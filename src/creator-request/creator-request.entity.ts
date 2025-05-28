// src/creator-request/creator-request.entity.ts
import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import User from 'src/user/user.entity';

export enum CreatorRequestStatus {
  PENDING = 'pending',
  APPROVED = 'approved',
  REJECTED = 'rejected'
}

@Entity('creator_request')
export class CreatorRequest {
  @PrimaryGeneratedColumn()
  id: string;

  @Column({ type: 'text' })
  reason: string;

  @Column({
    type: 'enum',
    enum: CreatorRequestStatus,
    default: CreatorRequestStatus.PENDING
  })
  status: CreatorRequestStatus;

  @Column({ type: 'text', nullable: true })
  adminNote: string;

  @ManyToOne(() => User, { eager: true })
  @JoinColumn({ name: 'userId' })
  user: User;

  @Column()
  userId: string;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'reviewedById' })
  reviewedBy: User;

  @Column({ nullable: true })
  reviewedById: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}