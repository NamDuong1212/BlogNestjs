import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PostController } from './post.controller';
import { PostService } from './post.service';
import { Post } from './post.entity';
import { Category } from '../category/category.entity';
import User from 'src/user/user.entity';
import { Comment } from 'src/comment/comment.entity';
import { Rating } from 'src/rating/rating.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Post, Category, User, Comment, Rating]),
  ],
  controllers: [PostController],
  providers: [PostService],
})
export class PostModule {}