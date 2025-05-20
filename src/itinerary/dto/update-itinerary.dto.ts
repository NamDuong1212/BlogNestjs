import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsDate, IsOptional, IsNumber, IsArray, ValidateNested, Min, IsISO8601 } from 'class-validator';
import { Type } from 'class-transformer';
import { UpdateItineraryDayDto } from './update-itinerary-day.dto';

export class UpdateItineraryDto {
  @ApiProperty({ description: 'Title of the itinerary', required: false })
  @IsString()
  @IsOptional()
  title?: string;

  @ApiProperty({ description: 'Description of the itinerary', required: false })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({ description: 'Start date of the trip (YYYY-MM-DD)', required: false })
  @IsISO8601()
  @IsOptional()
  startDate?: string;

  @ApiProperty({ description: 'End date of the trip (YYYY-MM-DD)', required: false })
  @IsISO8601()
  @IsOptional()
  endDate?: string;

  @ApiProperty({ description: 'Currency used for budget (e.g., USD, EUR)', required: false })
  @IsString()
  @IsOptional()
  currency?: string;

  @ApiProperty({ 
    description: 'Days of the itinerary to update', 
    type: [UpdateItineraryDayDto],
    required: false
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => UpdateItineraryDayDto)
  @IsOptional()
  days?: UpdateItineraryDayDto[];
}