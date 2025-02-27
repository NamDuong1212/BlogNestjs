import { Entity, PrimaryGeneratedColumn, Column, ManyToMany, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { Post } from '../post/post.entity';

@Entity()
export class Tag {
  @PrimaryGeneratedColumn()
  id: string;

  @Column({ unique: true })
  name: string;


  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
