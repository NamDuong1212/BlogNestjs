import { 
  Controller, 
  Post, 
  UseGuards, 
  Req, 
  UnauthorizedException, 
  Get, 
  Body,
  Param 
} from '@nestjs/common';
import { WalletService } from './wallet.service';
import { JwtAuthGuard } from 'src/auth/guard/jwt-auth.guard';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { CreateWalletDto } from './dto/create-wallet.dto';
import { LinkPayPalDto } from './dto/link-paypal.dto';
import { WithdrawalRequestDto } from './dto/withdrawal-request.dto';

@Controller('wallet')
@ApiTags('Wallet')
export class WalletController {
  constructor(private readonly walletService: WalletService) {}

  @ApiBearerAuth('token')
  @ApiOperation({
    summary: 'Create Wallet',
    description: 'Creator & User create wallet with JWT authentication.',
  })
  @ApiResponse({
    status: 200,
    description: 'Create Wallet successfully.',
    type: CreateWalletDto,
  })
  @Post('create')
  @UseGuards(JwtAuthGuard)
  async createWallet(@Req() req) {
    const user = req.user;

    if (!user || !user.isCreator) {
      throw new UnauthorizedException('Access denied. Creator only.');
    }

    return this.walletService.createWallet(user.id);
  }

  @ApiBearerAuth('token')
  @ApiOperation({
    summary: 'Get Wallet',
    description: 'Get wallet by creator ID with JWT authentication.',
  })
  @ApiResponse({
    status: 200,
    description: 'Get Wallet successfully.',
    type: CreateWalletDto,
  })
  @UseGuards(JwtAuthGuard)
  @Get()
  async getWallet(@Req() req) {
    const user = req.user;

    if (!user || !user.isCreator) {
      throw new UnauthorizedException('Access denied. Creator only.');
    }

    return this.walletService.getWalletByCreatorId(user.id);
  }

  @ApiBearerAuth('token')
  @ApiOperation({
    summary: 'Link PayPal Account',
    description: 'Link PayPal email to wallet for withdrawals.',
  })
  @ApiResponse({
    status: 200,
    description: 'PayPal account linked successfully.',
  })
  @Post('link-paypal')
  @UseGuards(JwtAuthGuard)
  async linkPayPal(@Req() req, @Body() linkPayPalDto: LinkPayPalDto) {
    const user = req.user;

    if (!user || !user.isCreator) {
      throw new UnauthorizedException('Access denied. Creator only.');
    }

    return this.walletService.linkPayPal(user.id, linkPayPalDto.paypalEmail);
  }

  @ApiBearerAuth('token')
  @ApiOperation({
    summary: 'Request Withdrawal',
    description: 'Creator request withdrawal via PayPal with JWT authentication.',
  })
  @ApiResponse({
    status: 200,
    description: 'Withdrawal request successfully.',
  })
  @Post('withdrawals')
  @UseGuards(JwtAuthGuard)
  async createWithdrawal(@Req() req, @Body() withdrawalDto: WithdrawalRequestDto) {
    const user = req.user;

    if (!user || !user.isCreator) {
      throw new UnauthorizedException('Access denied. Creator only.');
    }

    return this.walletService.requestWithdrawal(user.id, withdrawalDto.amount);
  }

  @ApiBearerAuth('token')
  @ApiOperation({
    summary: 'Get Withdrawal History',
    description: 'Get withdrawal history for creator.',
  })
  @ApiResponse({
    status: 200,
    description: 'Withdrawal history retrieved successfully.',
  })
  @Get('withdrawals')
  @UseGuards(JwtAuthGuard)
  async getWithdrawalHistory(@Req() req) {
    const user = req.user;

    if (!user || !user.isCreator) {
      throw new UnauthorizedException('Access denied. Creator only.');
    }

    return this.walletService.getWithdrawalHistory(user.id);
  }
}