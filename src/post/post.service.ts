import {
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
import { Tag } from 'src/tag/tag.entity';
import { TagService } from 'src/tag/tag.service';

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
    @InjectRepository(Tag)
    private readonly tagRepository: Repository<Tag>,
    private readonly tagService: TagService,
  ) {}

  async createPost(
    userId: string,
    title: string,
    content: string,
    categoryId: string,
    tags?: string[],
  ) {

    const category = await this.categoryRepository.findOne({
      where: { id: categoryId },
    });
    if (!category) {
      throw new NotFoundException('Category not found.');
    }

    const user = await this.userRepository.findOne({
      where: { id: userId },
    });
    if (!user) {
      throw new NotFoundException('User not found.');
    }

    let postTags: Tag[] = [];
    if (tags && tags.length > 0) {
      postTags = await this.tagService.findOrCreateTags(tags);
    }

    const newPost = this.postRepository.create({
      title,
      content,
      category,
      user,
      tags: postTags,
      isPublished: true,
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
      relations: ['tags'] 
    });

    if (!post) {
      throw new NotFoundException('Post not found');
    }

    if (updatePostDto.tags) {
      const tags = await this.tagService.findOrCreateTags(updatePostDto.tags);
      post.tags = tags;
    }

    const updatePost = Object.assign(post, updatePostDto);
    return this.postRepository.save(updatePost);
  }

  async getAllPost(page: number, limit: number) {
    const skip = (page - 1) * limit;
    const [posts, total] = await this.postRepository.findAndCount({
      skip,
      take: limit,
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
    return this.postRepository.findOne({ where: { id: postId }, relations: ['user'] });
  }
}