import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('withdrawals')
export class Withdrawal {
  @PrimaryGeneratedColumn()
  id: string;

  @Column()
  creatorId: string;

  @Column({ type: 'float' })
  amount: number;

  @Column({ type: 'varchar', length: 50 })
  status: 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED';

  @Column({ nullable: true })
  paypalBatchId: string;

  @Column({ nullable: true })
  paypalPayoutItemId: string;

  @Column({ nullable: true })
  paypalEmail: string;

  @Column({ type: 'text', nullable: true })
  failureReason: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}