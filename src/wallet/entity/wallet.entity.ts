import { Column, Entity, PrimaryGeneratedColumn } from "typeorm";

@Entity('wallet')
export class Wallet {
    @PrimaryGeneratedColumn()
    id: string;

    @Column()
    creatorId: string;

    @Column({ default: 0 })
    balance: number;

    @Column({ nullable: true })
    paypalEmail: string;

    @Column({ default: false })
    paypalVerified: boolean;
}