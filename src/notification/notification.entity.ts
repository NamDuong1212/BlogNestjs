// src/notification/notification.entity.ts
import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, CreateDateColumn } from 'typeorm';
import User from 'src/user/user.entity';

export enum NotificationType {
  CREATOR_REQUEST_APPROVED = 'creator_request_approved',
  CREATOR_REQUEST_REJECTED = 'creator_request_rejected',
  CREATOR_STATUS_REVOKED = 'creator_status_revoked',
  POST_DELETED = 'post_deleted'
}

@Entity('notification')
export class Notification {
  @PrimaryGeneratedColumn()
  id: string;

  @Column({
    type: 'enum',
    enum: NotificationType
  })
  type: NotificationType;

  @Column()
  title: string;

  @Column({ type: 'text' })
  message: string;

  @Column({ default: false })
  isRead: boolean;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'userId' })
  user: User;

  @Column()
  userId: string;

  @CreateDateColumn()
  createdAt: Date;
}