import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Comment } from './comment.entity';
import { CreateCommentDto } from './dto/create-comment.dto';
import { Post } from '../post/post.entity';
import User from '../user/user.entity';
import { UpdateCommentDto } from './dto/update-comment.dto';

@Injectable()
export class CommentService {
  constructor(
    @InjectRepository(Comment)
    private readonly commentRepository: Repository<Comment>,
    @InjectRepository(Post)
    private readonly postRepository: Repository<Post>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  async createComment(
    createCommentDto: CreateCommentDto,
    userId: string,
  ) {
    const { content, postId } = createCommentDto;

    const post = await this.postRepository.findOneBy({ id: postId });
    if (!post) {
      throw new NotFoundException('Post not found');
    }

    const user = await this.userRepository.findOne({
      where: { id: userId },
    });
    if (!user) {
      throw new NotFoundException('User not found.');
    }

    const comment = this.commentRepository.create({
      content,
      post,
      user: { id: userId } as User,
    });

    const savedComment = await this.commentRepository.save(comment);

    return {
      ...savedComment,
      username: user.username,
      avatar: user.avatar,
    }
  }

  async updateComment(
    commentId: string,
    userId: string,
    updateCommentDto: UpdateCommentDto,
  ): Promise<Comment> {
    const comment = await this.commentRepository.findOne({
      where: { id: commentId },
      relations: ['user'],
    });

    if (!comment) {
      throw new NotFoundException('Comment not found');
    }

    if (comment.user.id !== userId) {
      throw new ForbiddenException('You can only update your own comments');
    }

    comment.content = updateCommentDto.content;
    return this.commentRepository.save(comment);
  }

  async deleteComment(
    commentId: string,
    userId: string,
  ): Promise<{ message: string }> {
    const comment = await this.commentRepository.findOne({
      where: { id: commentId },
      relations: ['user'],
    });

    if (!comment) {
      throw new NotFoundException('Comment not found');
    }

    if (comment.user.id !== userId) {
      throw new ForbiddenException('You can only delete your own comments');
    }

    await this.commentRepository.remove(comment);

    return { message: 'Comment deleted successfully' };
  }

  async getCommentByPostId(postId: string) {
    const comments = await this.commentRepository.find({
      where: { post: { id: postId } },
      relations: ['user', 'replies', 'replies.user'],
    });

    if (!comments.length) {
      throw new NotFoundException('No comments found for this post');
    }

    const post = await this.postRepository.find({
      where: { id: postId },
    })

    const commentsWithReplies = comments.filter(comment => comment.replies.length > 0);

    return commentsWithReplies.map(comment => ({
      id: comment.id,
      content: comment.content,
      createdAt: comment.createdAt,
      user: {
        id: comment.user.id,
        username: comment.user.username,
        email: comment.user.email,
        avatar: comment.user.avatar,
      },
      replies: comment.replies.map(reply => ({
        id: reply.id,
        content: reply.content,
        createdAt: reply.createdAt,
        user: {
          id: reply.user.id,
          username: reply.user.username,
          email: reply.user.email,
          avatar: reply.user.avatar,
        },
      })),
      post
    }));
  }

  async replyToComment(
    createCommentDto: CreateCommentDto,
    userId: string,
    parentId: string,
  ) {
    const { content, postId } = createCommentDto;

    const post = await this.postRepository.findOneBy({ id: postId });
    if (!post) {
      throw new NotFoundException('Post not found');
    }

    const user = await this.userRepository.findOne({
      where: { id: userId },
    });
    if (!user) {
      throw new NotFoundException('User not found.');
    }

    const parentComment = await this.commentRepository.findOne({
      where: { id: parentId, post: { id: postId } },
    });
    if (!parentComment) {
      throw new NotFoundException('Parent comment not found in post.');
    }

    const reply = this.commentRepository.create({
      content,
      post,
      user: { id: userId } as User,
      parent: parentComment,
    });

    const savedReply = await this.commentRepository.save(reply);

    return {
      ...savedReply,
      username: user.username,
      avatar: user.avatar,
    };
  }
}
