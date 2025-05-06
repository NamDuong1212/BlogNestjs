import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PostController } from './post.controller';
import { PostService } from './post.service';
import { Post } from './post.entity';
import { Category } from '../category/category.entity';
import User from 'src/user/user.entity';
import { Comment } from 'src/comment/comment.entity';
import { Rating } from 'src/rating/rating.entity';
import { CloudinaryModule } from 'src/cloudinary/cloudinary.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Post, Category, User, Comment, Rating]),
    CloudinaryModule
  ],
  controllers: [PostController],
  providers: [PostService],
  exports: [PostService],
})
export class PostModule {}