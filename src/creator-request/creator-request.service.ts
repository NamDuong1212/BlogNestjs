// src/creator-request/creator-request.service.ts
import { Injectable, NotFoundException, BadRequestException, UnauthorizedException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreatorRequest, CreatorRequestStatus } from './creator-request.entity';
import { CreateCreatorRequestDto } from './dto/create-creator-request.dto';
import { ReviewCreatorRequestDto } from './dto/review-creator-request.dto';
import User from 'src/user/user.entity';
import { NotificationService } from 'src/notification/notification.service';

@Injectable()
export class CreatorRequestService {
  constructor(
    @InjectRepository(CreatorRequest)
    private readonly creatorRequestRepository: Repository<CreatorRequest>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly notificationService: NotificationService,
  ) {}

  async createRequest(userId: string, createDto: CreateCreatorRequestDto): Promise<CreatorRequest> {
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (user.isCreator) {
      throw new BadRequestException('User is already a creator');
    }

    // Check if user has pending request
    const existingRequest = await this.creatorRequestRepository.findOne({
      where: { userId, status: CreatorRequestStatus.PENDING }
    });

    if (existingRequest) {
      throw new BadRequestException('You already have a pending creator request');
    }

    const request = this.creatorRequestRepository.create({
      ...createDto,
      userId,
      user
    });

    return await this.creatorRequestRepository.save(request);
  }

  async getAllRequests(): Promise<CreatorRequest[]> {
    return await this.creatorRequestRepository.find({
      relations: ['user', 'reviewedBy'],
      order: { createdAt: 'DESC' }
    });
  }

  async getRequestById(id: string): Promise<CreatorRequest> {
    const request = await this.creatorRequestRepository.findOne({
      where: { id },
      relations: ['user', 'reviewedBy']
    });

    if (!request) {
      throw new NotFoundException('Creator request not found');
    }

    return request;
  }

  async reviewRequest(
    id: string, 
    reviewDto: ReviewCreatorRequestDto, 
    adminId: string
  ): Promise<CreatorRequest> {
    const request = await this.creatorRequestRepository.findOne({
      where: { id },
      relations: ['user']
    });

    if (!request) {
      throw new NotFoundException('Creator request not found');
    }

    if (request.status !== CreatorRequestStatus.PENDING) {
      throw new BadRequestException('Request has already been reviewed');
    }

    const admin = await this.userRepository.findOne({ where: { id: adminId } });
    if (!admin || admin.role !== 'admin') {
      throw new UnauthorizedException('Only admins can review requests');
    }

    // Update request
    request.status = reviewDto.status;
    request.adminNote = reviewDto.adminNote;
    request.reviewedById = adminId;
    request.reviewedBy = admin;

    // If approved, update user's creator status
    if (reviewDto.status === CreatorRequestStatus.APPROVED) {
      const user = await this.userRepository.findOne({ where: { id: request.userId } });
      if (user) {
        user.isCreator = true;
        await this.userRepository.save(user);

        // Send approval notification
        await this.notificationService.createCreatorApprovedNotification(
          user.id,
          reviewDto.adminNote || 'Your creator request has been approved!'
        );
      }
    } else if (reviewDto.status === CreatorRequestStatus.REJECTED) {
      // Send rejection notification
      await this.notificationService.createCreatorRejectedNotification(
        request.userId,
        reviewDto.adminNote || 'Your creator request has been rejected.'
      );
    }

    return await this.creatorRequestRepository.save(request);
  }

  async getUserRequests(userId: string): Promise<CreatorRequest[]> {
    return await this.creatorRequestRepository.find({
      where: { userId },
      relations: ['reviewedBy'],
      order: { createdAt: 'DESC' }
    });
  }
}