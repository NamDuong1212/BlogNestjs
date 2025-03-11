import {
  BadRequestException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Post } from './post.entity';
import { Category } from '../category/category.entity';
import { UpdatePostDto } from './dto/update-post.dto';
import User from 'src/user/user.entity';
import { Comment } from 'src/comment/comment.entity';
import { Rating } from 'src/rating/rating.entity';

@Injectable()
export class PostService {
  constructor(
    @InjectRepository(Post) private readonly postRepository: Repository<Post>,
    @InjectRepository(Category)
    private readonly categoryRepository: Repository<Category>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(Comment)
    private readonly commentRepository: Repository<Comment>,
    @InjectRepository(Rating)
    private readonly ratingRepository: Repository<Rating>,
  ) {}

  async createPost(
    userId: string,
    title: string,
    content: string,
    categoryId: string,
  ) {
    const category = await this.categoryRepository.findOne({
      where: { id: categoryId },
      relations: ['parent'],
    });

    if (!category) {
      throw new NotFoundException('Category not found.');
    }

    let currentCategory = category;
    let categoryLevel = 1;
    let categoryHierarchy = [currentCategory.id];

    while (currentCategory.parent) {
      categoryLevel++;
      currentCategory = await this.categoryRepository.findOne({
        where: { id: currentCategory.parent.id },
        relations: ['parent'],
      });
      categoryHierarchy.unshift(currentCategory.id);
    }

    if (categoryLevel !== 4) {
      throw new BadRequestException(
        'Posts must be assigned to a category at level 4 (leaf category)',
      );
    }

    if (categoryHierarchy.length !== 4) {
      throw new BadRequestException(
        'Invalid category hierarchy. A complete 4-level hierarchy is required.',
      );
    }

    const user = await this.userRepository.findOne({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('User not found.');
    }

    const newPost = this.postRepository.create({
      title,
      content,
      category,
      user,
      isPublished: true,
      categoryHierarchy: categoryHierarchy.join(','),
    });

    const savedPost = await this.postRepository.save(newPost);

    return {
      ...savedPost,
      author: user.username,
      avatar: user.avatar,
      userId,
    };
  }

  async updatePost(id: string, updatePostDto: UpdatePostDto): Promise<Post> {
    const post = await this.postRepository.findOne({
      where: { id },
      relations: ['category'],
    });

    if (!post) {
      throw new NotFoundException('Post not found');
    }

    if (updatePostDto.categoryIds) {
      const category = await this.categoryRepository.findOne({
        where: {
          id: Array.isArray(updatePostDto.categoryIds)
            ? updatePostDto.categoryIds[0]
            : updatePostDto.categoryIds,
        },
        relations: ['parent'],
      });

      if (!category) {
        throw new NotFoundException('Category not found.');
      }

      let currentCategory = category;
      let categoryLevel = 1;
      let categoryHierarchy = [currentCategory.id];

      while (currentCategory.parent) {
        categoryLevel++;
        currentCategory = await this.categoryRepository.findOne({
          where: { id: currentCategory.parent.id },
          relations: ['parent'],
        });
        categoryHierarchy.unshift(currentCategory.id);
      }

      if (categoryLevel !== 4) {
        throw new BadRequestException(
          'Posts must be assigned to a category at level 4 (leaf category)',
        );
      }

      if (categoryHierarchy.length !== 4) {
        throw new BadRequestException(
          'Invalid category hierarchy. A complete 4-level hierarchy is required.',
        );
      }

      post.category = category;

      if ('categoryHierarchy' in post) {
        post.categoryHierarchy = categoryHierarchy.join(',');
      }
    }

    if (updatePostDto.title) {
      post.title = updatePostDto.title;
    }

    if (updatePostDto.content) {
      post.content = updatePostDto.content;
    }

    if ('isPublished' in updatePostDto) {
      post.isPublished = !!updatePostDto.isPublished;
    }

    return this.postRepository.save(post);
  }

  async getAllPost(page: number, limit: number) {
    const skip = (page - 1) * limit;

    const [posts, total] = await this.postRepository.findAndCount({
      skip,
      take: limit,
      relations: ['category', 'category.parent', 'user'],
      where: { isPublished: true },
      order: { createdAt: 'DESC' }, // Assuming you have a createdAt field
    });

    const enrichedPosts = await Promise.all(
      posts.map(async (post) => {
        const categoryHierarchy = await this.getCategoryHierarchy(
          post.category.id,
        );

        return {
          ...post,
          author: post.user.username,
          avatar: post.user.avatar,
          userId: post.user.id,
          categoryHierarchy,
        };
      }),
    );

    return {
      data: enrichedPosts,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  private async getCategoryHierarchy(
    categoryId: string,
  ): Promise<{ id: string; name: string; level: number }[]> {
    const result = [];
    const categoryHierarchy = [];
    let currentCategoryId = categoryId;

    while (currentCategoryId) {
      const category = await this.categoryRepository.findOne({
        where: { id: currentCategoryId },
        relations: ['parent'],
      });

      if (!category) break;

      categoryHierarchy.unshift(category);

      currentCategoryId = category.parent ? category.parent.id : null;
    }

    for (let i = 0; i < categoryHierarchy.length; i++) {
      result.push({
        id: categoryHierarchy[i].id,
        name: categoryHierarchy[i].name,
        level: i + 1,
      });
    }

    return result;
  }

  async getPostByCategory(id: string, page: number, limit: number) {
    const skip = (page - 1) * limit;

    const category = await this.categoryRepository.findOne({
      where: { id },
    });
    if (!category) {
      throw new Error('Category not found');
    }

    const [posts, total] = await this.postRepository.findAndCount({
      skip,
      take: limit,
      where: {
        category: { id },
      },
      relations: ['category'],
    });

    return {
      data: posts,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async getPostById(id: string) {
    const post = await this.postRepository.findOne({ where: { id } });

    if (!post) {
      throw new NotFoundException('Post not found');
    }

    post.viewCount += 1;
    return this.postRepository.save(post);
  }

  async deletePost(
    id: string,
    isCreator: boolean,
  ): Promise<{ message: string }> {
    if (!isCreator) {
      throw new UnauthorizedException('Access denied. Creator only.');
    }

    const post = await this.postRepository.findOne({ where: { id } });

    if (!post) {
      throw new NotFoundException('Post not found');
    }

    await this.ratingRepository.delete({ post });

    await this.commentRepository.delete({ post });

    await this.postRepository.remove(post);

    return { message: 'Post deleted successfully' };
  }

  async updatePostImage(id: string, imageUrl: string, isCreator: boolean) {
    if (!isCreator) {
      throw new UnauthorizedException('Access denied. Creator only.');
    }

    const post = await this.postRepository.findOne({ where: { id } });

    if (!post) {
      throw new NotFoundException('Post not found');
    }

    post.image = imageUrl;
    return this.postRepository.save(post);
  }

  async getPostByCreator(userId: string, page: number, limit: number) {
    const skip = (page - 1) * limit;

    const user = await this.userRepository.findOne({
      where: { id: userId, isCreator: true },
    });
    if (!user) {
      throw new UnauthorizedException('User is not a creator or not found.');
    }

    const [posts, total] = await this.postRepository.findAndCount({
      skip,
      take: limit,
      where: {
        user: { id: userId },
      },
      relations: ['category'],
    });

    return {
      data: posts,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findOneById(postId: string): Promise<Post> {
    return this.postRepository.findOne({
      where: { id: postId },
      relations: ['user'],
    });
  }
}
