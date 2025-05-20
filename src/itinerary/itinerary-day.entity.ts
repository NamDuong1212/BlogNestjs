import { 
  Entity, 
  PrimaryGeneratedColumn, 
  Column, 
  ManyToOne, 
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn
} from 'typeorm';
import { Itinerary } from './itinerary.entity';

@Entity()
export class ItineraryDay {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  dayNumber: number;
  
  @Column({ type: 'text' })
  activities: string;
  
  @Column({ nullable: true })
  image: string;
  
  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  budgetMin: number;
  
  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  budgetMax: number;
  
  @Column({ nullable: true })
  location: string;

  @ManyToOne(() => Itinerary, itinerary => itinerary.days, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'itineraryId' })
  itinerary: Itinerary;
  
  @Column()
  itineraryId: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}