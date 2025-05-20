import { 
  Entity, 
  PrimaryGeneratedColumn, 
  Column, 
  OneToMany, 
  JoinColumn, 
  ManyToOne,
  CreateDateColumn,
  UpdateDateColumn
} from 'typeorm';
import { Post } from '../post/post.entity';
import { ItineraryDay } from './itinerary-day.entity';

@Entity()
export class Itinerary {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  title: string;

  @Column({ nullable: true })
  description: string;

  @Column({ type: 'date' })
  startDate: Date;
  
  @Column({ type: 'date' })
  endDate: Date;
  
  @Column({ default: 0 })
  totalDays: number;
  
  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  estimatedTotalBudgetMin: number;
  
  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  estimatedTotalBudgetMax: number;
  
  @Column({ nullable: true })
  currency: string;

  @ManyToOne(() => Post, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'postId' })
  post: Post;
  
  @Column()
  postId: string;

  @OneToMany(() => ItineraryDay, day => day.itinerary, { 
    eager: true
  })
  days: ItineraryDay[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}