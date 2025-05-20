import {
  Injectable,
  NotFoundException,
  BadRequestException,
  UnauthorizedException,
  InternalServerErrorException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between } from 'typeorm';
import { Itinerary } from './itinerary.entity';
import { ItineraryDay } from './itinerary-day.entity';
import { Post } from '../post/post.entity';
import { CreateItineraryDto } from './dto/create-itinerary.dto';
import { UpdateItineraryDto } from './dto/update-itinerary.dto';
import { CloudinaryService } from '../cloudinary/cloudinary.service';
import { differenceInDays, parse, parseISO } from 'date-fns';

@Injectable()
export class ItineraryService {
  constructor(
    @InjectRepository(Itinerary)
    private readonly itineraryRepository: Repository<Itinerary>,
    @InjectRepository(ItineraryDay)
    private readonly itineraryDayRepository: Repository<ItineraryDay>,
    @InjectRepository(Post)
    private readonly postRepository: Repository<Post>,
    private readonly cloudinaryService: CloudinaryService,
  ) {}

  async create(createItineraryDto: CreateItineraryDto, userId: string): Promise<Itinerary> {
    // Check if the post exists and user is the owner
    const post = await this.postRepository.findOne({
      where: { id: createItineraryDto.postId },
      relations: ['user'],
    });

    if (!post) {
      throw new NotFoundException('Post not found');
    }

    if (post.user.id !== userId) {
      throw new UnauthorizedException('You can only create itineraries for your own posts');
    }

    // Calculate total days
    const startDate = parseISO(createItineraryDto.startDate);
    const endDate = parseISO(createItineraryDto.endDate);
    
    if (endDate < startDate) {
      throw new BadRequestException('End date must be after start date');
    }
    
    const totalDays = differenceInDays(endDate, startDate) + 1;

    // Create itinerary without days first
    const itinerary = this.itineraryRepository.create({
      title: createItineraryDto.title,
      description: createItineraryDto.description,
      startDate,
      endDate,
      totalDays,
      currency: createItineraryDto.currency,
      postId: post.id,  // Set postId directly
      estimatedTotalBudgetMin: 0,
      estimatedTotalBudgetMax: 0,
    });

    // Save the itinerary first to get an ID
    const savedItinerary = await this.itineraryRepository.save(itinerary);

    // Create and save days separately
    if (createItineraryDto.days && createItineraryDto.days.length > 0) {
      // Validate day numbers
      const maxDayNumber = Math.max(...createItineraryDto.days.map(day => day.dayNumber));
      if (maxDayNumber > totalDays) {
        throw new BadRequestException(`Day number cannot exceed the total days of the trip (${totalDays})`);
      }

      let totalMinBudget = 0;
      let totalMaxBudget = 0;

      // Create day entities with explicit itineraryId
      const dayEntities = [];
      for (const dayDto of createItineraryDto.days) {
        totalMinBudget += dayDto.budgetMin || 0;
        totalMaxBudget += dayDto.budgetMax || 0;
        
        const day = this.itineraryDayRepository.create({
          dayNumber: dayDto.dayNumber,
          activities: dayDto.activities,
          location: dayDto.location,
          budgetMin: dayDto.budgetMin || 0,
          budgetMax: dayDto.budgetMax || 0,
          itineraryId: savedItinerary.id,  // Set itineraryId explicitly
        });
        
        dayEntities.push(day);
      }
      
      // Save all days
      await this.itineraryDayRepository.save(dayEntities);
      
      // Update the itinerary with budget totals
      savedItinerary.estimatedTotalBudgetMin = totalMinBudget;
      savedItinerary.estimatedTotalBudgetMax = totalMaxBudget;
      await this.itineraryRepository.save(savedItinerary);
    }

    // Return the complete itinerary with all relations
    return this.findOne(savedItinerary.id);
  }

  async findOne(id: string): Promise<Itinerary> {
    const itinerary = await this.itineraryRepository.findOne({
      where: { id },
      relations: ['days', 'post', 'post.user'],
    });

    if (!itinerary) {
      throw new NotFoundException('Itinerary not found');
    }

    // Sort days by day number
    itinerary.days = itinerary.days.sort((a, b) => a.dayNumber - b.dayNumber);

    return itinerary;
  }

  async findByPostId(postId: string): Promise<Itinerary> {
    const itinerary = await this.itineraryRepository.findOne({
      where: { postId },
      relations: ['days', 'post', 'post.user'],
    });

    if (!itinerary) {
      return null; // Return null instead of throwing an error for this method
    }

    // Sort days by day number
    itinerary.days = itinerary.days.sort((a, b) => a.dayNumber - b.dayNumber);

    return itinerary;
  }

  async update(id: string, updateItineraryDto: UpdateItineraryDto, userId: string): Promise<Itinerary> {
  const itinerary = await this.itineraryRepository.findOne({
    where: { id },
    relations: ['post', 'post.user', 'days'],
  });

  if (!itinerary) {
    throw new NotFoundException('Itinerary not found');
  }

  // Verify ownership
  if (itinerary.post.user.id !== userId) {
    throw new UnauthorizedException('You can only update your own itineraries');
  }

  // Update date calculations if needed
  let totalDays = itinerary.totalDays;
  if (updateItineraryDto.startDate || updateItineraryDto.endDate) {
    const startDate = updateItineraryDto.startDate 
      ? parseISO(updateItineraryDto.startDate) 
      : itinerary.startDate;
    const endDate = updateItineraryDto.endDate
      ? parseISO(updateItineraryDto.endDate)
      : itinerary.endDate;
    
    if (endDate < startDate) {
      throw new BadRequestException('End date must be after start date');
    }
    
    totalDays = differenceInDays(endDate, startDate) + 1;
    
    // Update the dates
    itinerary.startDate = startDate;
    itinerary.endDate = endDate;
    itinerary.totalDays = totalDays;
  }

  // Update basic properties
  if (updateItineraryDto.title) {
    itinerary.title = updateItineraryDto.title;
  }
  
  if (updateItineraryDto.description !== undefined) {
    itinerary.description = updateItineraryDto.description;
  }
  
  if (updateItineraryDto.currency) {
    itinerary.currency = updateItineraryDto.currency;
  }

  // Save itinerary updates first
  await this.itineraryRepository.save(itinerary);

  // Handle days updates if provided
  if (updateItineraryDto.days && updateItineraryDto.days.length > 0) {
    // Validate day numbers
    const maxDayNumber = Math.max(...updateItineraryDto.days.map(day => day.dayNumber || 0));
    if (maxDayNumber > totalDays) {
      throw new BadRequestException(`Day number cannot exceed the total days of the trip (${totalDays})`);
    }

    // Process day updates
    for (const dayDto of updateItineraryDto.days) {
      if (dayDto.id) {
        // Update existing day
        const existingDay = await this.itineraryDayRepository.findOne({
          where: { id: dayDto.id, itineraryId: itinerary.id }
        });
        
        if (!existingDay) {
          throw new NotFoundException(`Day with ID ${dayDto.id} not found in this itinerary`);
        }
        
        // Update properties
        if (dayDto.dayNumber !== undefined) existingDay.dayNumber = dayDto.dayNumber;
        if (dayDto.activities !== undefined) existingDay.activities = dayDto.activities;
        if (dayDto.location !== undefined) existingDay.location = dayDto.location;
        if (dayDto.budgetMin !== undefined) existingDay.budgetMin = dayDto.budgetMin;
        if (dayDto.budgetMax !== undefined) existingDay.budgetMax = dayDto.budgetMax;
        
        // IMPORTANT: Make sure the relationship is maintained
        existingDay.itineraryId = itinerary.id;
        
        // Using save instead of update to preserve relationships
        await this.itineraryDayRepository.save(existingDay);
      } else {
        // Create new day
        const newDay = this.itineraryDayRepository.create({
          dayNumber: dayDto.dayNumber,
          activities: dayDto.activities,
          location: dayDto.location,
          budgetMin: dayDto.budgetMin || 0,
          budgetMax: dayDto.budgetMax || 0,
          itineraryId: itinerary.id, // Explicitly set the itineraryId
        });
        
        await this.itineraryDayRepository.save(newDay);
      }
    }

    // Recalculate total budget
    const updatedDays = await this.itineraryDayRepository.find({
      where: { itineraryId: itinerary.id },
    });
    
    let totalMinBudget = 0;
    let totalMaxBudget = 0;
    
    updatedDays.forEach(day => {
      totalMinBudget += Number(day.budgetMin) || 0;
      totalMaxBudget += Number(day.budgetMax) || 0;
    });
    
    itinerary.estimatedTotalBudgetMin = totalMinBudget;
    itinerary.estimatedTotalBudgetMax = totalMaxBudget;
    
    // Save the updated budget
    await this.itineraryRepository.save(itinerary);
  }
  
  // Return updated itinerary with all relations
  return this.findOne(id);
}
  async remove(id: string, userId: string): Promise<{ message: string }> {
    const itinerary = await this.itineraryRepository.findOne({
      where: { id },
      relations: ['post', 'post.user'],
    });

    if (!itinerary) {
      throw new NotFoundException('Itinerary not found');
    }

    // Verify ownership
    if (itinerary.post.user.id !== userId) {
      throw new UnauthorizedException('You can only delete your own itineraries');
    }

    await this.itineraryRepository.remove(itinerary);
    return { message: 'Itinerary deleted successfully' };
  }

  async uploadDayImage(
    itineraryId: string,
    dayNumber: number,
    imageFile: Express.Multer.File,
    userId: string,
  ): Promise<ItineraryDay> {
    const itinerary = await this.itineraryRepository.findOne({
      where: { id: itineraryId },
      relations: ['post', 'post.user', 'days'],
    });

    if (!itinerary) {
      throw new NotFoundException('Itinerary not found');
    }

    // Verify ownership
    if (itinerary.post.user.id !== userId) {
      throw new UnauthorizedException('You can only update your own itineraries');
    }

    // Find the day
    const day = itinerary.days.find(d => d.dayNumber === dayNumber);
    if (!day) {
      throw new NotFoundException(`Day ${dayNumber} not found in this itinerary`);
    }

    // Upload image to Cloudinary
    try {
      const cloudinaryUrl = await this.cloudinaryService.uploadImage(imageFile);
      
      // Update the day with the new image URL
      day.image = cloudinaryUrl;
      return this.itineraryDayRepository.save(day);
    } catch (error) {
      throw new InternalServerErrorException(`Failed to upload image: ${error.message}`);
    }
  }

  async deleteItineraryDay(itineraryId: string, dayId: string, userId: string): Promise<{ message: string }> {
    const itinerary = await this.itineraryRepository.findOne({
      where: { id: itineraryId },
      relations: ['post', 'post.user', 'days'],
    });

    if (!itinerary) {
      throw new NotFoundException('Itinerary not found');
    }

    // Verify ownership
    if (itinerary.post.user.id !== userId) {
      throw new UnauthorizedException('You can only update your own itineraries');
    }

    // Find the day directly from repository
    const day = await this.itineraryDayRepository.findOne({
      where: { id: dayId, itineraryId: itinerary.id }
    });
    
    if (!day) {
      throw new NotFoundException(`Day with ID ${dayId} not found in this itinerary`);
    }

    // Remove the day
    await this.itineraryDayRepository.delete({ id: dayId, itineraryId });

    // Recalculate total budget
    const remainingDays = await this.itineraryDayRepository.find({
      where: { itineraryId: itinerary.id },
    });
    
    let totalMinBudget = 0;
    let totalMaxBudget = 0;
    
    remainingDays.forEach(day => {
      totalMinBudget += Number(day.budgetMin) || 0;
      totalMaxBudget += Number(day.budgetMax) || 0;
    });
    
    itinerary.estimatedTotalBudgetMin = totalMinBudget;
    itinerary.estimatedTotalBudgetMax = totalMaxBudget;
    
    await this.itineraryRepository.save(itinerary);

    return { message: 'Itinerary day deleted successfully' };
  }
}