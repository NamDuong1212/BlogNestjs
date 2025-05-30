import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Wallet } from './entity/wallet.entity'
import { WalletController } from './wallet.controller';
import { WalletService } from './wallet.service';
import { Post } from 'src/post/post.entity';
import { DailyEarning } from './entity/daily-earning.entity';
import { Withdrawal } from './entity/withdrawals.entity';
import { PayPalService } from './services/paypal.service';

@Module({
    imports: [TypeOrmModule.forFeature([Wallet, Post, DailyEarning, Withdrawal])],
    controllers: [WalletController],
    providers: [WalletService, PayPalService],
})
export class WalletModule {}