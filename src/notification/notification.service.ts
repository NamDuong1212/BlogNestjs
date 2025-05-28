// src/notification/notification.service.ts
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Notification, NotificationType } from './notification.entity';
import User from 'src/user/user.entity';

@Injectable()
export class NotificationService {
  constructor(
    @InjectRepository(Notification)
    private readonly notificationRepository: Repository<Notification>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  async createCreatorApprovedNotification(userId: string, message: string): Promise<Notification> {
    const notification = this.notificationRepository.create({
      type: NotificationType.CREATOR_REQUEST_APPROVED,
      title: 'Creator Request Approved',
      message,
      userId
    });

    return await this.notificationRepository.save(notification);
  }

  async createCreatorRejectedNotification(userId: string, message: string): Promise<Notification> {
    const notification = this.notificationRepository.create({
      type: NotificationType.CREATOR_REQUEST_REJECTED,
      title: 'Creator Request Rejected',
      message,
      userId
    });

    return await this.notificationRepository.save(notification);
  }

  async createCreatorStatusRevokedNotification(userId: string, reason: string): Promise<Notification> {
    const notification = this.notificationRepository.create({
      type: NotificationType.CREATOR_STATUS_REVOKED,
      title: 'Creator Status Revoked',
      message: `Your creator privileges have been revoked. Reason: ${reason}`,
      userId
    });

    return await this.notificationRepository.save(notification);
  }

  async createPostDeletedNotification(userId: string, postTitle: string): Promise<Notification> {
    const notification = this.notificationRepository.create({
      type: NotificationType.POST_DELETED,
      title: 'Post Deleted',
      message: `Your post "${postTitle}" has been deleted by an administrator.`,
      userId
    });

    return await this.notificationRepository.save(notification);
  }

  async getUserNotifications(userId: string): Promise<Notification[]> {
    return await this.notificationRepository.find({
      where: { userId },
      order: { createdAt: 'DESC' }
    });
  }

  async markAsRead(id: string, userId: string): Promise<Notification> {
    const notification = await this.notificationRepository.findOne({
      where: { id, userId }
    });

    if (!notification) {
      throw new Error('Notification not found');
    }

    notification.isRead = true;
    return await this.notificationRepository.save(notification);
  }

  async markAllAsRead(userId: string): Promise<void> {
    await this.notificationRepository.update(
      { userId, isRead: false },
      { isRead: true }
    );
  }
}