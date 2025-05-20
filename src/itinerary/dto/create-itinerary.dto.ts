import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsDate, IsOptional, IsNumber, IsArray, ValidateNested, IsUUID, Min, IsISO8601 } from 'class-validator';
import { Type } from 'class-transformer';
import { CreateItineraryDayDto } from './create-itinerary-day.dto';

export class CreateItineraryDto {
  @ApiProperty({ description: 'Title of the itinerary' })
  @IsString()
  title: string;

  @ApiProperty({ description: 'Description of the itinerary', required: false })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({ description: 'Start date of the trip (YYYY-MM-DD)' })
  @IsISO8601()
  startDate: string;

  @ApiProperty({ description: 'End date of the trip (YYYY-MM-DD)' })
  @IsISO8601()
  endDate: string;

  @ApiProperty({ description: 'Currency used for budget (e.g., USD, EUR)', required: false })
  @IsString()
  @IsOptional()
  currency?: string;

  @ApiProperty({ description: 'The post ID this itinerary belongs to' })
  @IsUUID()
  postId: string;

  @ApiProperty({ 
    description: 'Days of the itinerary', 
    type: [CreateItineraryDayDto],
    required: false
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateItineraryDayDto)
  @IsOptional()
  days?: CreateItineraryDayDto[];
}