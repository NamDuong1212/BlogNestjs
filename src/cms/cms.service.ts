import { Injectable, NotFoundException, UnauthorizedException } from '@nestjs/common';
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
import { Cron, CronExpression } from '@nestjs/schedule';
import { Rating } from 'src/rating/rating.entity';
import { Comment } from 'src/comment/comment.entity';
import { Report } from 'src/report/report.entity';

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
    ) {}

    async signup(signupDto: SignupDto): Promise<{ message: string }> {
        const { email, password } = signupDto;

        const existingUser = await this.userRepository.findOne({ where: { email } });
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

    async login(loginDto: LoginDto): Promise<{ user: any, token: string }> {
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

    async validateAdmin(username: string, password: string): Promise<User | null> {
        const admin = await this.userRepository.findOne({ where: { username } });
        if (admin && await bcrypt.compare(password, admin.password)) {
            return admin;
        }
        return null;
      }

    async createCategory(
        createCategoryDto: CreateCategoryDto,
    ): Promise<Category>{
        const { name } = createCategoryDto;
        const category = this.categoryRepository.create(createCategoryDto);
        const existingCategory = await this.categoryRepository.findOne({ where: { name } });
        if (existingCategory) {
            throw new UnauthorizedException('Category already exists');
        }
        await this.categoryRepository.save(category);
        return category;
    }

    async updateCategory(
        id: string,
        updateCategoryDto: UpdateCategoryDto,
    ): Promise<Category> {
        const { name } = updateCategoryDto;

        const category = await this.categoryRepository.findOne({ where: { id } });
    
        const existingCategory = await this.categoryRepository.findOne({ where: { name } });
        if (existingCategory) {
            throw new UnauthorizedException('Category already exists');
        }
        if (!category) {
          throw new NotFoundException('Category not found');
        }
        const updateCategory = Object.assign(category, updateCategoryDto);
        return this.categoryRepository.save(updateCategory);
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
        return await this.categoryRepository.find();
    }

    async getCategoryById(id: string): Promise<Category> {
        const category = await this.categoryRepository.findOne({ where: { id } });
    
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

    @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
    async calculateDailyEarning() {
        const posts = await this.postRepository.find({ relations: ['user'] });
        const today = new Date();
        const todayString = today.toISOString().split('T')[0];
    
        const result: Array<{
            creatorId: string;
            viewsToday: number;
            earningToday: number;
            postId: string;
        }> = [];
    
        for (const post of posts) {
            if (!post.user) {
                console.warn(`Post with ID ${post.id} has no associated user.`);
                continue;
            }
    
            const earning = post.viewCount * 2;
            let dailyEarning = await this.dailyEarningRepository.findOne({
                where: { creatorId: post.user.id, date: todayString as unknown as Date },
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
    
            result.push({
                creatorId: post.user.id,
                viewsToday: dailyEarning.viewsToday,
                earningToday: dailyEarning.earningToday,
                postId: post.id,
            });
    
            post.viewCount = 0;
            await this.postRepository.save(post);
        }
    
        return {
            message: 'Daily earnings calculated successfully',
            result,
        };
    }

    async deletePost(
        id: string,
    ): Promise<{ message: string }> {
    
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
        return await this.reportRepository.find();
    }

    async findUserById(id: string): Promise<User> {
        return this.userRepository.findOne({ where: { id } });
    }

    async findPostById(id: string): Promise<Post> {
        return this.postRepository.findOne({ where: { id }, relations: ['user'] });
    }

    async notifyPostDeletion(userId: string, title: string): Promise<{ message: string }> {
        const creator = await this.userRepository.findOne({ where: { id: userId } });
    
        if (!creator || !creator.isCreator) {
          throw new UnauthorizedException('User is not a creator');
        }
    
        console.log(`Notify Creator (${creator.username}): Your post "${title}" has been deleted.`);
    
        return { message: `Notification sent to creator: ${creator.username}` };
    }
}
