import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Rating } from './rating.entity';
import { Post } from 'src/post/post.entity';

@Injectable()
export class RatingService {
  constructor(
    @InjectRepository(Rating)
    private ratingRepository: Repository<Rating>,
    @InjectRepository(Post)
    private postRepository: Repository<Post>,
  ) {}

  async createRating(userId: string, postId: string, stars: number) {
    if (stars < 1 || stars > 5) {
      throw new BadRequestException('Rating must be between 1 and 5 stars');
    }

    const post = await this.postRepository.findOne({ where: { id: postId } });
    if (!post) {
      throw new NotFoundException('Post not found');
    }

    const existingRating = await this.ratingRepository.findOne({
      where: { userId, postId },
    });

    if (existingRating) {
      existingRating.stars = stars;
      return this.ratingRepository.save(existingRating);
    }

    const newRating = this.ratingRepository.create({ userId, postId, stars });
    return this.ratingRepository.save(newRating);
  }

  async isPostCreator(userId: string, postId: string): Promise<boolean> {
    const post = await this.postRepository.findOne({ where: { id: postId, user: { id: userId } } });
    return !!post;
  }

  async getAverageRating(userId: string, postId: string) {
    const isCreator = await this.isPostCreator(userId, postId);
    if (!isCreator) {
      throw new NotFoundException('User is not the creator of this post');
    }

    const ratings = await this.ratingRepository.find({ where: { postId } });
    if (!ratings.length) return 0;

    const totalStars = ratings.reduce((sum, rating) => sum + rating.stars, 0);
    return totalStars / ratings.length;
  }

  async getRatingById(id: string) {
    const rating = await this.ratingRepository.findOne({ where: { id } });

    if (!rating) {
      throw new NotFoundException('Rating not found');
    }

    return rating;
  }
}
