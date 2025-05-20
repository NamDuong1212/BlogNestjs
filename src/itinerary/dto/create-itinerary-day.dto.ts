import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsOptional, IsNumber, Min, IsInt } from 'class-validator';

export class CreateItineraryDayDto {
  @ApiProperty({ description: 'Day number in the itinerary' })
  @IsInt()
  @Min(1)
  dayNumber: number;

  @ApiProperty({ description: 'Activities for this day' })
  @IsString()
  activities: string;

  @ApiProperty({ description: 'Optional location for this day', required: false })
  @IsString()
  @IsOptional()
  location?: string;

  @ApiProperty({ description: 'Minimum budget for this day', required: false })
  @IsNumber()
  @Min(0)
  @IsOptional()
  budgetMin?: number;

  @ApiProperty({ description: 'Maximum budget for this day', required: false })
  @IsNumber()
  @Min(0)
  @IsOptional()
  budgetMax?: number;
}