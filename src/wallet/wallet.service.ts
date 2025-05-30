import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Wallet } from './entity/wallet.entity';
import { Post } from 'src/post/post.entity';
import { DailyEarning } from './entity/daily-earning.entity';
import { Withdrawal } from './entity/withdrawals.entity';
import { PayPalService } from './services/paypal.service';
import { Cron, CronExpression } from '@nestjs/schedule';

@Injectable()
export class WalletService {
  constructor(
    @InjectRepository(Wallet)
    private walletRepository: Repository<Wallet>,
    @InjectRepository(DailyEarning)
    private dailyEarningRepository: Repository<DailyEarning>,
    @InjectRepository(Post)
    private postRepository: Repository<Post>,
    @InjectRepository(Withdrawal)
    private withdrawalRepository: Repository<Withdrawal>,
    private paypalService: PayPalService,
  ) {}

  async createWallet(creatorId: string) {
    const existingWallet = await this.walletRepository.findOne({ where: { creatorId } });
    if (existingWallet) {
      throw new BadRequestException('Wallet already exists for this creator.');
    }

    const newWallet = this.walletRepository.create({ creatorId, balance: 0 });
    return this.walletRepository.save(newWallet);
  }

  async getWalletByCreatorId(creatorId: string) {
    const wallet = await this.walletRepository.findOne({ where: { creatorId } });
    if (!wallet) {
      throw new BadRequestException(`Wallet not found for creatorId: ${creatorId}`);
    }
    return wallet;
  }

  async linkPayPal(creatorId: string, paypalEmail: string) {
    const wallet = await this.walletRepository.findOne({ where: { creatorId } });
    
    if (!wallet) {
      throw new BadRequestException('Wallet not found');
    }

    wallet.paypalEmail = paypalEmail;
    wallet.paypalVerified = true; // In production, you might want to verify this email first
    
    return this.walletRepository.save(wallet);
  }

  async requestWithdrawal(creatorId: string, amount: number) {
    if (amount <= 0) {
      throw new BadRequestException('Invalid withdrawal amount');
    }

    if (amount < 5) {
      throw new BadRequestException('Minimum withdrawal amount is $5');
    }

    const wallet = await this.walletRepository.findOne({ where: { creatorId } });

    if (!wallet) {
      throw new BadRequestException('Wallet not found');
    }

    if (!wallet.paypalEmail) {
      throw new BadRequestException('Please link your PayPal account first');
    }

    if (amount > wallet.balance) {
      throw new BadRequestException('Insufficient balance');
    }

    const withdrawal = this.withdrawalRepository.create({
      creatorId,
      amount,
      status: 'PENDING',
      paypalEmail: wallet.paypalEmail,
      createdAt: new Date(),
    });

    // Deduct amount from wallet immediately
    wallet.balance -= amount;

    await this.walletRepository.save(wallet);
    const savedWithdrawal = await this.withdrawalRepository.save(withdrawal);

    // Process PayPal payout
    try {
      const payoutResult = await this.paypalService.sendPayout(
        wallet.paypalEmail,
        amount,
        'USD'
      );

      savedWithdrawal.paypalBatchId = payoutResult.batchId;
      savedWithdrawal.paypalPayoutItemId = payoutResult.payoutItemId;
      savedWithdrawal.status = 'PROCESSING';
      
      await this.withdrawalRepository.save(savedWithdrawal);

      return {
        ...savedWithdrawal,
        message: 'Withdrawal request submitted successfully. Processing via PayPal.'
      };
    } catch (error) {
      // If PayPal fails, refund the amount back to wallet
      wallet.balance += amount;
      await this.walletRepository.save(wallet);

      savedWithdrawal.status = 'FAILED';
      savedWithdrawal.failureReason = error.message;
      await this.withdrawalRepository.save(savedWithdrawal);

      throw new BadRequestException('Withdrawal failed: ' + error.message);
    }
  }

  async getWithdrawalHistory(creatorId: string) {
    return this.withdrawalRepository.find({
      where: { creatorId },
      order: { createdAt: 'DESC' }
    });
  }

  // Cron job to check and update withdrawal statuses
  @Cron(CronExpression.EVERY_30_MINUTES)
  async updateWithdrawalStatuses() {
    const processingWithdrawals = await this.withdrawalRepository.find({
      where: { status: 'PROCESSING' }
    });

    for (const withdrawal of processingWithdrawals) {
      if (withdrawal.paypalBatchId) {
        try {
          const payoutStatus = await this.paypalService.getPayoutStatus(withdrawal.paypalBatchId);
          
          if (payoutStatus.items && payoutStatus.items.length > 0) {
            const item = payoutStatus.items[0];
            
            if (item.transaction_status === 'SUCCESS') {
              withdrawal.status = 'COMPLETED';
            } else if (item.transaction_status === 'FAILED') {
              withdrawal.status = 'FAILED';
              withdrawal.failureReason = item.errors?.message || 'PayPal transaction failed';
              
              // Refund to wallet if failed
              const wallet = await this.walletRepository.findOne({ 
                where: { creatorId: withdrawal.creatorId } 
              });
              if (wallet) {
                wallet.balance += withdrawal.amount;
                await this.walletRepository.save(wallet);
              }
            }
            
            await this.withdrawalRepository.save(withdrawal);
          }
        } catch (error) {
          console.error(`Failed to update withdrawal ${withdrawal.id}:`, error);
        }
      }
    }
  }
}