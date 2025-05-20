import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Req,
  NotFoundException,
  UseInterceptors,
  UploadedFile,
  ParseIntPipe,
  Request,
  BadRequestException,
  UnauthorizedException,
  InternalServerErrorException,
  Query,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { JwtAuthGuard } from '../auth/guard/jwt-auth.guard';
import { ItineraryService } from './itinerary.service';
import { CreateItineraryDto } from './dto/create-itinerary.dto';
import { UpdateItineraryDto } from './dto/update-itinerary.dto';
import { 
  ApiBearerAuth, 
  ApiTags, 
  ApiOperation, 
  ApiResponse, 
  ApiConsumes 
} from '@nestjs/swagger';
import { diskStorage } from 'multer';
import { v4 as uuidv4 } from 'uuid';

@Controller('itinerary')
export class ItineraryController {
  constructor(private readonly itineraryService: ItineraryService) {}

  @ApiTags('Itinerary')
  @ApiBearerAuth('token')
  @ApiOperation({
    summary: 'Create a new itinerary',
    description: 'Allows a user to create a new itinerary for their post.',
  })
  @ApiResponse({
    status: 201,
    description: 'Itinerary created successfully.',
    type: CreateItineraryDto,
  })
  @Post('create')
  @UseGuards(JwtAuthGuard)
  async create(@Body() createItineraryDto: CreateItineraryDto, @Request() req) {
    const userId = req.user.id;
    return this.itineraryService.create(createItineraryDto, userId);
  }

  @ApiTags('Itinerary')
  @ApiBearerAuth('')
  @ApiOperation({
    summary: 'Get an itinerary by ID',
    description: 'Fetches the details of a single itinerary by its ID.',
  })
  @ApiResponse({
    status: 200,
    description: 'Itinerary details',
    type: CreateItineraryDto,
  })
  @Get('/:id')
  async findOne(@Param('id') id: string) {
    return this.itineraryService.findOne(id);
  }

  @ApiTags('Itinerary')
  @ApiBearerAuth('')
  @ApiOperation({
    summary: 'Get an itinerary by post ID',
    description: 'Fetches an itinerary associated with a specific post.',
  })
  @ApiResponse({
    status: 200,
    description: 'Returns the itinerary or null if not found.',
    type: CreateItineraryDto,
  })
  @Get('by-post/:postId')
  async findByPostId(@Param('postId') postId: string) {
    return this.itineraryService.findByPostId(postId);
  }

  @ApiTags('Itinerary')
  @ApiBearerAuth('token')
  @ApiOperation({
    summary: 'Update an itinerary',
    description: 'Allows a user to update their existing itinerary by ID.',
  })
  @ApiResponse({
    status: 200,
    description: 'Itinerary updated successfully.',
    type: UpdateItineraryDto,
  })
  @Patch('/:id')
  @UseGuards(JwtAuthGuard)
  async update(
    @Param('id') id: string,
    @Body() updateItineraryDto: UpdateItineraryDto,
    @Request() req,
  ) {
    const updatedItinerary = await this.itineraryService.update(id, updateItineraryDto, req.user.id);
    return { data: updatedItinerary };
  }

  @ApiTags('Itinerary')
  @ApiBearerAuth('token')
  @ApiOperation({
    summary: 'Delete an itinerary',
    description: 'Allows a user to delete their itinerary by ID.',
  })
  @ApiResponse({
    status: 200,
    description: 'The itinerary was deleted successfully',
  })
  @Delete('/:id')
  @UseGuards(JwtAuthGuard)
  async remove(@Param('id') id: string, @Request() req) {
    const result = await this.itineraryService.remove(id, req.user.id);
    return result;
  }

  @ApiTags('Itinerary')
  @ApiBearerAuth('token')
  @ApiOperation({
    summary: 'Upload an image for a specific day in the itinerary',
    description: 'Allows a user to upload an image for a specific day in their itinerary.',
  })
  @ApiResponse({
    status: 200,
    description: 'Image uploaded successfully',
  })
  @ApiConsumes('multipart/form-data')
  @Patch('/:id/days/:dayNumber/upload-image')
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(
    FileInterceptor('image', {
      storage: diskStorage({
        destination: './temp/uploads',
        filename: (req, file, callback) => {
          const filename = `${uuidv4()}-${file.originalname}`;
          callback(null, filename);
        },
      }),
      fileFilter: (req, file, callback) => {
        if (!file.mimetype.match(/\/(jpg|jpeg|png|gif)$/)) {
          return callback(
            new BadRequestException('Only image files are allowed!'),
            false,
          );
        }
        callback(null, true);
      },
    }),
  )
  async uploadDayImage(
    @Param('id') id: string,
    @Param('dayNumber', ParseIntPipe) dayNumber: number,
    @UploadedFile() file,
    @Request() req,
  ) {
    if (!file) {
      throw new BadRequestException('No file uploaded');
    }

    try {
      const updatedDay = await this.itineraryService.uploadDayImage(
        id,
        dayNumber,
        file,
        req.user.id,
      );

      return {
        message: 'Image uploaded successfully',
        data: updatedDay,
      };
    } catch (error) {
      if (error instanceof NotFoundException || error instanceof UnauthorizedException) {
        throw error;
      }
      throw new InternalServerErrorException(
        `Failed to upload image: ${error.message}`,
      );
    }
  }

  @ApiTags('Itinerary')
  @ApiBearerAuth('token')
  @ApiOperation({
    summary: 'Delete a day from an itinerary',
    description: 'Allows a user to delete a specific day from their itinerary.',
  })
  @ApiResponse({
    status: 200,
    description: 'Day deleted successfully',
  })
  @Delete('/:id/days/:dayId')
  @UseGuards(JwtAuthGuard)
  async deleteItineraryDay(
    @Param('id') id: string,
    @Param('dayId') dayId: string,
    @Request() req,
  ) {
    try {
      const result = await this.itineraryService.deleteItineraryDay(
        id,
        dayId,
        req.user.id,
      );

      return {
        message: 'Itinerary day deleted successfully',
        data: result,
      };
    } catch (error) {
      if (error instanceof NotFoundException || error instanceof UnauthorizedException) {
        throw error;
      }
      throw new InternalServerErrorException(
        `Failed to delete itinerary day: ${error.message}`,
      );
    }
  }
}