import { Post } from 'src/post/post.entity';
import { Column, Entity, OneToMany, PrimaryGeneratedColumn, ManyToOne, JoinColumn } from 'typeorm';

@Entity('category')
export class Category {
  @PrimaryGeneratedColumn()
  id: string;

  @Column()
  name: string;

  @Column({ default: 1 })
  level: number;

  @Column({ nullable: true })
  description: string;

  @ManyToOne(() => Category, (category) => category.children)
  @JoinColumn({ name: 'parentId' })
  parent: Category;

  @OneToMany(() => Category, (category) => category.parent)
  children: Category[];

  @OneToMany(() => Post, (post) => post.category)
  posts: Post[];
}
