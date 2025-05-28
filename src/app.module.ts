import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import * as Joi from 'joi';
import { ConfigModule } from '@nestjs/config';
import { DatabaseModule } from './database/database.module';
import { UserModule } from './user/user.module';
import { AuthModule } from './auth/auth.module';
import { CategoryModule } from './category/category.module';
import { PostModule } from './post/post.module';
import { CommentModule } from './comment/comment.module';
import { LikeModule } from './like/like.module';
import { WalletModule } from './wallet/wallet.module';
import { RatingModule } from './rating/rating.module';
import { CmsModule } from './cms/cms.module';
import { ReportModule } from './report/report.module';
import { CloudinaryModule } from './cloudinary/cloudinary.module';
import { ItineraryModule } from './itinerary/itinerary.module';
import { CreatorRequestModule } from './creator-request/creator-request.module';
import { NotificationModule } from './notification/notification.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      validationSchema: Joi.object({
        DB_HOST: Joi.string().required(),
        DB_PORT: Joi.number().required(),
        DB_USERNAME: Joi.string().required(),
        DB_PASSWORD: Joi.string().required(),
        DB_DATABASE: Joi.string().required(),
        PORT: Joi.number(),
        isGlobal: true, 
        envFilePath: '.env', 
      }),
    }),
    DatabaseModule,
    UserModule,
    AuthModule,
    CategoryModule,
    PostModule,
    CommentModule,
    LikeModule,
    WalletModule,
    RatingModule,
    CmsModule,
    ReportModule,
    CloudinaryModule,
    ItineraryModule,
    CreatorRequestModule,
    NotificationModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
