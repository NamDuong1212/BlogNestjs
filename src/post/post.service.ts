import {
  BadRequestException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Brackets, Repository } from 'typeorm';
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
      images: [], // Initialize empty images array
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

    // Handle images array update if provided
    if (updatePostDto.images) {
      post.images = updatePostDto.images;
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
    const category = await this.categoryRepository.findOne({ where: { id } });
    if (!category) {
      throw new NotFoundException(`Category with id ${id} not found.`);
    }

    const skip = (page - 1) * limit;

    const qb = this.postRepository
      .createQueryBuilder('post')
      .leftJoinAndSelect('post.category', 'category')
      .leftJoinAndSelect('post.user', 'user')
      .where('post.isPublished = :published', { published: true })
      .andWhere(`CONCAT(',', post.categoryHierarchy, ',') LIKE :catId`, {
        catId: `%,${id},%`,
      })
      .orderBy('post.createdAt', 'DESC')
      .skip(skip)
      .take(limit);

    const [posts, total] = await qb.getManyAndCount();

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

  async getPostById(id: string) {
    const post = await this.postRepository.findOne({
      where: { id },
      relations: ['category', 'user'],
    });

    if (!post) {
      throw new NotFoundException('Post not found');
    }

    post.viewCount += 1;
    await this.postRepository.save(post);

    const categoryHierarchy = await this.getCategoryHierarchy(post.category.id);

    const relatedPosts = await this.getRelatedPosts(
      post.categoryHierarchy, // Truyền danh sách category
      id,
    );

    return {
      ...post,
      author: post.user.username,
      avatar: post.user.avatar,
      userId: post.user.id,
      categoryHierarchy,
      relatedPosts,
    };
  }

  async getRelatedPosts(categoryHierarchy: string, excludePostId: string) {
    if (!categoryHierarchy) {
      return [];
    }

    try {
      const categories = categoryHierarchy
        .split(',')
        .filter((id) => id.trim() !== '');

      if (categories.length === 0) {
        return [];
      }

      const posts = await this.postRepository
        .createQueryBuilder('post')
        .leftJoinAndSelect('post.category', 'category')
        .leftJoinAndSelect('post.user', 'user')
        .where('post.isPublished = :published', { published: true })
        .andWhere('post.id != :postId', { postId: excludePostId })
        .andWhere(
          new Brackets((qb) => {
            categories.forEach((catId) => {
              qb.orWhere(
                `CONCAT(',', post.categoryHierarchy, ',') LIKE :catId${catId}`,
                {
                  [`catId${catId}`]: `%,${catId},%`,
                },
              );
            });
          }),
        )
        .orderBy('post.createdAt', 'DESC') // Sắp xếp theo bài mới nhất
        .limit(10)
        .getMany();

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

      return enrichedPosts;
    } catch (error) {
      console.error('Error getting related posts:', error);
      return [];
    }
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

  // Update single image (legacy method for backward compatibility)
  async updatePostImage(id: string, imageUrl: string, isCreator: boolean) {
    if (!isCreator) {
      throw new UnauthorizedException('Access denied. Creator only.');
    }
    
    const post = await this.postRepository.findOne({ where: { id } });
    
    if (!post) {
      throw new NotFoundException('Post not found');
    }
    
    // Set the main image
    post.image = imageUrl;
    
    // Also add to images array if it doesn't already exist
    if (!post.images) {
      post.images = [];
    }
    
    if (!post.images.includes(imageUrl)) {
      post.images.push(imageUrl);
    }
    
    return this.postRepository.save(post);
  }

  // New method to handle multiple images
  async updatePostImages(id: string, imageUrls: string[], isCreator: boolean) {
    if (!isCreator) {
      throw new UnauthorizedException('Access denied. Creator only.');
    }
    
    const post = await this.postRepository.findOne({ where: { id } });
    
    if (!post) {
      throw new NotFoundException('Post not found');
    }
    
    // Initialize images array if it doesn't exist
    if (!post.images) {
      post.images = [];
    }
    
    // Add new images to the array
    for (const imageUrl of imageUrls) {
      if (!post.images.includes(imageUrl)) {
        post.images.push(imageUrl);
      }
    }
    
    // If the post doesn't have a main image yet, set the first uploaded image as the main image
    if (!post.image && post.images.length > 0) {
      post.image = post.images[0];
    }
    
    // Ensure we don't exceed the limit of 10 images
    if (post.images.length > 10) {
      post.images = post.images.slice(0, 10);
    }
    
    return this.postRepository.save(post);
  }

  async deletePostImage(id: string, imageUrl: string, isCreator: boolean) {
  if (!isCreator) {
    throw new UnauthorizedException('Access denied. Creator only.');
  }

  const post = await this.postRepository.findOne({ where: { id } });

  if (!post) {
    throw new NotFoundException('Post not found');
  }

  // Remove the specific image from the images array
  if (post.images) {
    post.images = post.images.filter(img => img !== imageUrl);

    // If the deleted image was the main image, set a new main image or clear it
    if (post.image === imageUrl) {
      post.image = post.images.length > 0 ? post.images[0] : null;
    }
  }

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
    relations: ['category', 'user'],
    order: { updatedAt: 'DESC' }, // Sắp xếp theo updatedAt giảm dần
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

  async findOneById(postId: string): Promise<Post> {
    return this.postRepository.findOne({
      where: { id: postId },
      relations: ['user'],
    });
  }
  
  async searchPosts(
    searchTerm: string,
    page: number = 1,
    limit: number = 10
  ) {
    const skip = (page - 1) * limit;
    
    const [posts, total] = await this.postRepository
      .createQueryBuilder('post')
      .leftJoinAndSelect('post.category', 'category')
      .leftJoinAndSelect('post.user', 'user')
      .where('post.isPublished = :published', { published: true })
      .andWhere('LOWER(post.title) LIKE LOWER(:title)', { title: `%${searchTerm}%` })
      .orderBy('post.createdAt', 'DESC')
      .skip(skip)
      .take(limit)
      .getManyAndCount();
  
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
}