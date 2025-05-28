import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtModule } from '@nestjs/jwt';
import { CmsController } from './cms.controller';
import { CmsService } from './cms.service';
import User from 'src/user/user.entity';
import { Category } from '../category/category.entity';
import { AuthModule } from 'src/auth/auth.module';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { PassportModule } from '@nestjs/passport';
import { JwtStrategy } from 'src/auth/strategy/jwt.strategy';
import { JwtAuthGuard } from 'src/auth/guard/jwt-auth.guard';
import { Post } from 'src/post/post.entity';
import { DailyEarning } from 'src/wallet/entity/daily-earning.entity';
import { Rating } from 'src/rating/rating.entity';
import { Comment } from 'src/comment/comment.entity';
import { Report } from 'src/report/report.entity';
import { Wallet } from 'src/wallet/entity/wallet.entity';
import { CreatorRequestModule } from 'src/creator-request/creator-request.module';
import { NotificationModule } from 'src/notification/notification.module';
import { CreatorRequest } from 'src/creator-request/creator-request.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([User, Category, Post, DailyEarning, Rating, Comment, Report, Wallet, CreatorRequest]),
    ConfigModule,
    PassportModule.register({ defaultStrategy: 'jwt' }),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => {
        return {
          secret: config.get<string>('JWT_SECRET'),
          signOptions: {
            expiresIn: config.get<string | number>('JWT_EXPIRES'),
          },
        };
      },
    }),
    AuthModule,
    CreatorRequestModule,
    NotificationModule,
  ],
  controllers: [CmsController],
  providers: [
    CmsService,
    JwtStrategy,
    JwtAuthGuard,
  ],
  exports: [
    JwtStrategy,
    PassportModule,
    JwtAuthGuard,
  ],
})
export class CmsModule {}
