import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
} from 'typeorm';
import { Category } from '../category/category.entity';
import User from '../user/user.entity';
import { Like } from 'src/like/like.entity';
import { Report } from 'src/report/report.entity';

@Entity()
export class Post {
  @PrimaryGeneratedColumn()
  id: string;

  @Column()
  title: string;

  @Column()
  content: string;

  @Column({ nullable: true })
  image: string;

  @Column({ nullable: true, type: 'simple-array' })
  images: string[];

  @ManyToOne(() => Category, (category) => category.posts, { eager: true })
  @JoinColumn({ name: 'categoryId' })
  category: Category;

  @ManyToOne(() => User, (user) => user.posts, { eager: true })
  @JoinColumn({ name: 'userId' })
  user: User;

  @OneToMany(() => Like, (like) => like.post)
  @JoinColumn({ name: 'likeId' })
  likes: Like[];

  @OneToMany(() => Report, (report) => report.post)
  @JoinColumn({ name: 'reportId' })
  reports: Report[];

  @Column({ default: 0 })
  viewCount: number;

  @Column({ default: false })
  isPublished: boolean;

  @Column({ nullable: true })
  categoryHierarchy: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}