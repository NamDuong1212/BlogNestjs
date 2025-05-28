import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CreatorRequestController } from './creator-request.controller';
import { CreatorRequestService } from './creator-request.service';
import { CreatorRequest } from './creator-request.entity';
import User from 'src/user/user.entity';
import { NotificationModule } from 'src/notification/notification.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([CreatorRequest, User]),
    NotificationModule,
  ],
  controllers: [CreatorRequestController],
  providers: [CreatorRequestService],
  exports: [CreatorRequestService],
})
export class CreatorRequestModule {}