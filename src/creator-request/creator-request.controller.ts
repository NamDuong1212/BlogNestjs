// src/creator-request/creator-request.controller.ts
import {
  Controller,
  Post,
  Get,
  Patch,
  Param,
  Body,
  UseGuards,
  Request,
} from '@nestjs/common';
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
} from '@nestjs/swagger';
import { CreatorRequestService } from './creator-request.service';
import { CreateCreatorRequestDto } from './dto/create-creator-request.dto';
import { ReviewCreatorRequestDto } from './dto/review-creator-request.dto';
import { JwtAuthGuard } from 'src/auth/guard/jwt-auth.guard';
import { RoleGuard } from 'src/auth/guard/role.guard';

@Controller('creator-request')
export class CreatorRequestController {
  constructor(private readonly creatorRequestService: CreatorRequestService) {}

  @ApiTags('Creator Request')
  @ApiBearerAuth('token')
  @ApiOperation({
    summary: 'Submit creator request',
    description: 'User submits a request to become a creator',
  })
  @ApiResponse({
    status: 201,
    description: 'Creator request submitted successfully',
  })
  @Post()
  @UseGuards(JwtAuthGuard)
  async createRequest(
    @Request() req,
    @Body() createDto: CreateCreatorRequestDto,
  ) {
    const request = await this.creatorRequestService.createRequest(
      req.user.id,
      createDto,
    );
    return {
      message: 'Creator request submitted successfully',
      data: request,
    };
  }

  @ApiTags('Creator Request')
  @ApiBearerAuth('token')
  @ApiOperation({
    summary: 'Get user creator requests',
    description: 'Get all creator requests for the authenticated user',
  })
  @ApiResponse({
    status: 200,
    description: 'User creator requests retrieved successfully',
  })
  @Get('/my-requests')
  @UseGuards(JwtAuthGuard)
  async getUserRequests(@Request() req) {
    const requests = await this.creatorRequestService.getUserRequests(
      req.user.id,
    );
    return {
      message: 'Creator requests retrieved successfully',
      data: requests,
    };
  }
}