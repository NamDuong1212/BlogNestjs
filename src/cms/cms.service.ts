import {
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { LoginDto } from 'src/auth/dto/login.dto';
import { SignupDto } from 'src/auth/dto/signup.dto';
import User from 'src/user/user.entity';
import { Repository } from 'typeorm';
import { CreateCategoryDto } from 'src/category/dto/create-category.dto';
import { Category } from 'src/category/category.entity';
import * as bcrypt from 'bcrypt';
import { UpdateCategoryDto } from 'src/category/dto/update-category.dto';
import { DailyEarning } from 'src/wallet/entity/daily-earning.entity';
import { Post } from 'src/post/post.entity';
import { Rating } from 'src/rating/rating.entity';
import { Comment } from 'src/comment/comment.entity';
import { Report } from 'src/report/report.entity';
import { Wallet } from 'src/wallet/entity/wallet.entity';

@Injectable()
export class CmsService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly jwtService: JwtService,
    @InjectRepository(Category)
    private readonly categoryRepository: Repository<Category>,
    @InjectRepository(DailyEarning)
    private dailyEarningRepository: Repository<DailyEarning>,
    @InjectRepository(Post)
    private postRepository: Repository<Post>,
    @InjectRepository(Rating)
    private readonly ratingRepository: Repository<Rating>,
    @InjectRepository(Comment)
    private readonly commentRepository: Repository<Comment>,
    @InjectRepository(Report)
    private readonly reportRepository: Repository<Report>,
    @InjectRepository(Wallet)
    private readonly walletRepository: Repository<Wallet>,
  ) {}

  async signup(signupDto: SignupDto): Promise<{ message: string }> {
    const { email, password } = signupDto;

    const existingUser = await this.userRepository.findOne({
      where: { email },
    });
    if (existingUser) {
      throw new UnauthorizedException('Email already in use');
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const admin = this.userRepository.create({
      username: 'admin',
      email,
      password: hashedPassword,
      isActive: true,
      role: 'admin',
    });

    await this.userRepository.save(admin);
    return {
      message: 'Admin account created successfully',
    };
  }

  async login(loginDto: LoginDto): Promise<{ user: any; token: string }> {
    const { email, password } = loginDto;

    const user = await this.userRepository.findOne({ where: { email } });

    if (!user) {
      throw new UnauthorizedException('Invalid email or password');
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid email or password');
    }

    const token = this.jwtService.sign({
      id: user.id,
      username: user.username,
      email: user.email,
    });

    return { user, token };
  }

  async validateAdmin(
    username: string,
    password: string,
  ): Promise<User | null> {
    const admin = await this.userRepository.findOne({ where: { username } });
    if (admin && (await bcrypt.compare(password, admin.password))) {
      return admin;
    }
    return null;
  }

  async createCategory(
    createCategoryDto: CreateCategoryDto,
  ): Promise<Category> {
    const { name, parentId } = createCategoryDto;
    const existingCategory = await this.categoryRepository.findOne({
      where: { name },
    });

    if (existingCategory) {
      throw new UnauthorizedException('Category already exists');
    }

    let parentCategory = null;
    let level = 1;

    if (parentId) {
      parentCategory = await this.categoryRepository.findOne({
        where: { id: parentId },
        relations: ['parent'],
      });

      if (!parentCategory) {
        throw new NotFoundException('Parent category not found');
      }

      // Calculate the level of the parent category
      let currentParent = parentCategory;
      let parentLevel = 1;

      while (currentParent.parent) {
        parentLevel++;
        currentParent = await this.categoryRepository.findOne({
          where: { id: currentParent.parent.id },
          relations: ['parent'],
        });
      }
      level = parentLevel + 1;

      if (level > 4) {
        throw new UnauthorizedException(
          'Category hierarchy cannot exceed 4 levels',
        );
      }
    } else {
      level = 1;
    }

    const category = this.categoryRepository.create({
      ...createCategoryDto,
      parent: parentCategory,
      level,
    });

    await this.categoryRepository.save(category);
    return category;
  }

  async updateCategory(
    id: string,
    updateCategoryDto: UpdateCategoryDto,
  ): Promise<Category> {
    const { name, parentId } = updateCategoryDto;
    const category = await this.categoryRepository.findOne({
      where: { id },
      relations: ['parent', 'children'],
    });

    if (!category) {
      throw new NotFoundException('Category not found');
    }

    // Check if the name already exists
    if (name && name !== category.name) {
      const existingCategory = await this.categoryRepository.findOne({
        where: { name },
      });
      if (existingCategory) {
        throw new UnauthorizedException('Category already exists');
      }
    }

    if (parentId && parentId === id) {
      throw new UnauthorizedException('A category cannot be its own parent');
    }

    if (parentId && category.children && category.children.length > 0) {
      const isChildOfCategory = await this.isChildOfCategory(parentId, id);
      if (isChildOfCategory) {
        throw new UnauthorizedException(
          'Cannot set a child category as parent',
        );
      }
    }

    let parentCategory = null;
    let level = 1;

    if (parentId) {
      parentCategory = await this.categoryRepository.findOne({
        where: { id: parentId },
        relations: ['parent'],
      });

      if (!parentCategory) {
        throw new NotFoundException('Parent category not found');
      }

      let currentParent = parentCategory;
      let parentLevel = 1;

      while (currentParent.parent) {
        parentLevel++;
        currentParent = await this.categoryRepository.findOne({
          where: { id: currentParent.parent.id },
          relations: ['parent'],
        });
      }

      level = parentLevel + 1;

      if (level > 4) {
        throw new UnauthorizedException(
          'Category hierarchy cannot exceed 4 levels',
        );
      }

      if (category.children && category.children.length > 0) {
        const maxChildDepth = await this.getMaxChildDepth(category);
        if (level + maxChildDepth - 1 > 4) {
          throw new UnauthorizedException(
            'This change would cause some children to exceed the maximum depth of 4 levels',
          );
        }
      }
    } else {
      level = 1;
    }

    if (name) {
      category.name = name;
    }

    category.parent = parentCategory;
    category.level = level;
    if (category.children && category.children.length > 0) {
      await this.updateChildrenLevels(category, level);
    }

    return this.categoryRepository.save(category);
  }
  private async isChildOfCategory(
    potentialChildId: string,
    parentId: string,
  ): Promise<boolean> {
    const potentialChild = await this.categoryRepository.findOne({
      where: { id: potentialChildId },
      relations: ['parent'],
    });

    if (!potentialChild || !potentialChild.parent) {
      return false;
    }

    if (potentialChild.parent.id === parentId) {
      return true;
    }

    return this.isChildOfCategory(potentialChild.parent.id, parentId);
  }
  private async getMaxChildDepth(category: Category): Promise<number> {
    if (!category.children || category.children.length === 0) {
      return 1;
    }

    let maxDepth = 1;

    for (const child of category.children) {
      const childWithChildren = await this.categoryRepository.findOne({
        where: { id: child.id },
        relations: ['children'],
      });

      const childDepth = 1 + (await this.getMaxChildDepth(childWithChildren));
      maxDepth = Math.max(maxDepth, childDepth);
    }

    return maxDepth;
  }

  private async updateChildrenLevels(
    parent: Category,
    parentLevel: number,
  ): Promise<void> {
    const children = await this.categoryRepository.find({
      where: { parent: { id: parent.id } },
      relations: ['children'],
    });

    for (const child of children) {
      child.level = parentLevel + 1;
      await this.categoryRepository.save(child);

      if (child.children && child.children.length > 0) {
        await this.updateChildrenLevels(child, child.level);
      }
    }
  }

  async deleteCategory(
    id: string,
    isCreator: boolean,
  ): Promise<{ message: string }> {
    if (!isCreator) {
      throw new UnauthorizedException('Access denied. Creator only.');
    }

    const category = await this.categoryRepository.findOne({ where: { id } });

    if (!category) {
      throw new NotFoundException('Category not found');
    }

    await this.categoryRepository.remove(category);

    return { message: 'Category deleted successfully' };
  }

  async getAllCategory(): Promise<Category[]> {
    const allCategories = await this.categoryRepository.find({
      relations: ['parent', 'children'],
    });

    const rootCategories = allCategories.filter((category) => !category.parent);

    for (const rootCategory of rootCategories) {
      this.buildCategoryTree(rootCategory, allCategories);
    }

    return rootCategories;
  }
  private buildCategoryTree(parent: Category, allCategories: Category[]): void {
    const children = allCategories.filter(
      (category) => category.parent && category.parent.id === parent.id,
    );
    parent.children = children;
    for (const child of children) {
      this.buildCategoryTree(child, allCategories);
    }
  }

  async getCategoryById(id: string): Promise<Category> {
    const category = await this.categoryRepository.findOne({
      where: { id },
      relations: ['parent', 'children'],
    });

    if (!category) {
      throw new NotFoundException('Category not found');
    }

    return category;
  }

  async deleteUser(id: string): Promise<{ message: string }> {
    const user = await this.userRepository.findOne({ where: { id } });
    if (!user) {
      throw new NotFoundException('User not found');
    }
    await this.userRepository.remove(user);
    return { message: 'User deleted successfully' };
  }

  async deletePost(id: string): Promise<{ message: string }> {
    const post = await this.postRepository.findOne({ where: { id } });

    if (!post) {
      throw new NotFoundException('Post not found');
    }

    await this.commentRepository.delete({ post: { id: post.id } });
    await this.ratingRepository.delete({ post: { id: post.id } });
    await this.postRepository.remove(post);

    return { message: 'Post deleted successfully' };
  }

  async getAllReport() {
    const reports = await this.reportRepository.find({
      relations: ['post', 'reportedBy'],
    });
    return reports.map((report) => ({
      id: report.id,
      reason: report.reason,
      postId: report.post.id,
      reportedAt: report.reportedAt,
      reportedBy: {
        id: report.reportedBy.id,
        username: report.reportedBy.username,
        email: report.reportedBy.email,
      },
    }));
  }

  async deleteReport(id: string): Promise<{ message: string }> {
    const report = await this.reportRepository.findOne({ where: { id } });
    if (!report) {
      throw new NotFoundException('Report not found');
    }
    await this.reportRepository.remove(report);
    return { message: 'Report deleted successfully' };
  }

  async findUserById(id: string): Promise<User> {
    return this.userRepository.findOne({ where: { id } });
  }

  async findPostById(id: string): Promise<Post> {
    return this.postRepository.findOne({ where: { id }, relations: ['user'] });
  }

  async notifyPostDeletion(
    userId: string,
    title: string,
  ): Promise<{ message: string }> {
    const creator = await this.userRepository.findOne({
      where: { id: userId },
    });

    if (!creator || !creator.isCreator) {
      throw new UnauthorizedException('User is not a creator');
    }

    console.log(
      `Notify Creator (${creator.username}): Your post "${title}" has been deleted.`,
    );

    return { message: `Notification sent to creator: ${creator.username}` };
  }

  async getListOfViews(): Promise<
    {
      author: string;
      postId: string;
      title: string;
      viewCount: number;
      Paid: number;
    }[]
  > {
    const posts = await this.postRepository.find({ relations: ['user'] });
    return posts.map((post) => ({
      author: post.user.username,
      postId: post.id,
      title: post.title,
      viewCount: post.viewCount,
      Paid: post.viewCount * 2,
    }));
  }

  async calculateDailyEarning() {
    const posts = await this.postRepository.find({ relations: ['user'] });
    const today = new Date();
    const todayString = today.toISOString().split('T')[0];

    // Collect processed data for response
    const result: Array<{
      creatorId: string;
      viewsToday: number;
      earningToday: number;
      totalBalance: number;
      postId: string;
    }> = [];

    for (const post of posts) {
      if (!post.user) {
        console.warn(`Post with ID ${post.id} has no associated user.`);
        continue;
      }

      const earning = post.viewCount * 2;
      let dailyEarning = await this.dailyEarningRepository.findOne({
        where: {
          creatorId: post.user.id,
          date: todayString as unknown as Date,
        },
      });

      if (dailyEarning) {
        dailyEarning.viewsToday += post.viewCount;
        dailyEarning.earningToday += earning;
      } else {
        dailyEarning = this.dailyEarningRepository.create({
          creatorId: post.user.id,
          date: today,
          viewsToday: post.viewCount,
          earningToday: earning,
          postId: post.id,
        });
      }
      await this.dailyEarningRepository.save(dailyEarning);

      const wallet = await this.walletRepository.findOne({
        where: { creatorId: post.user.id },
      });

      if (wallet) {
        wallet.balance += earning;
        await this.walletRepository.save(wallet);

        result.push({
          creatorId: post.user.id,
          viewsToday: dailyEarning.viewsToday,
          earningToday: dailyEarning.earningToday,
          totalBalance: wallet.balance,
          postId: post.id,
        });
      } else {
        console.warn(`Wallet not found for creator ID ${post.user.id}`);
      }

      // Reset view count for the post
      post.viewCount = 0;
      await this.postRepository.save(post);
    }

    return {
      message: 'Daily earnings calculated successfully.',
      result,
    };
  }
}
