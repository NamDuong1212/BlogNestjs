
import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsOptional, IsNumber, Min, IsInt } from 'class-validator';

export class UpdateItineraryDayDto {
  @ApiProperty({ description: 'ID of the day to update', required: false })
  @IsOptional()
  id?: string;

  @ApiProperty({ description: 'Day number in the itinerary', required: false })
  @IsInt()
  @Min(1)
  @IsOptional()
  dayNumber?: number;

  @ApiProperty({ description: 'Activities for this day', required: false })
  @IsString()
  @IsOptional()
  activities?: string;

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