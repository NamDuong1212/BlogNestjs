import { Like } from 'src/like/like.entity';
import { Post } from 'src/post/post.entity';
import { Report } from 'src/report/report.entity';
import { Wallet } from 'src/wallet/entity/wallet.entity';
import { Column, Entity, OneToMany, OneToOne, JoinColumn, PrimaryGeneratedColumn } from 'typeorm';

@Entity('user')
class User {
  @PrimaryGeneratedColumn()
  id: string;

  @Column()
  username: string;

  @Column({ unique: true })
  email: string;

  @Column()
  password: string;

  @Column({ nullable: true })
  bio: string;

  @Column({ nullable: true, type: 'date' })
  birthday: Date;

  @Column({ nullable: true })
  avatar: string;

  @Column({ default: false })
  isCreator: boolean;

  @Column({ default: 'user' })
  role: string;

  @OneToMany(() => Post, (post) => post.user)
  posts: Post[];

  @OneToMany(() => Like, (like) => like.user)
  likes: Like[];

  @OneToMany(() => Report, (report) => report.reportedBy)
  reports: Report[];

  @Column({ nullable: true })
  otp: string;

  @Column({ nullable: true, type: 'timestamp' })
  otpExpiry: Date;

  @Column({ nullable: true })
  resetPasswordToken: string;

  @Column({ nullable: true })
  resetPasswordExpiry: Date;

  @Column({ default: false })
  isActive: boolean;

  @OneToOne(() => Wallet)
  @JoinColumn()
  wallet: Wallet;

}

export default User;
