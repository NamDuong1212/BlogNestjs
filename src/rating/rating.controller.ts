import { Controller, Post, Body, Get, Param, UseGuards, Req, UnauthorizedException } from '@nestjs/common';
import { RatingService } from './rating.service';
import { JwtAuthGuard } from 'src/auth/guard/jwt-auth.guard';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { RatingDto } from './dto/rating.dto';

@Controller('rating')
export class RatingController {
  constructor(private readonly ratingService: RatingService) {}

  @ApiTags('Rating')
  @ApiBearerAuth('token')
  @ApiOperation({
    summary: 'Rating',
    description: 'Allows a user to create a new rating for a post.',
  })
  @ApiResponse({
    status: 201,
    description: 'Rating created successfully.',
    type: RatingDto,
  })
  @Post()
  @UseGuards(JwtAuthGuard)
  async createRating(
    @Req() req,
    @Body('postId') postId: string,
    @Body('stars') stars: number, 
  ) {
    const userId = req.user.id;
    return this.ratingService.createRating(userId, postId, stars);
  }

  @ApiTags('Rating')
@ApiBearerAuth('token')
@ApiOperation({
  summary: 'Get average rating',
  description: 'Allows a user to get the average rating for a post.',
})
@ApiResponse({
  status: 200,
  description: 'Get average rating successfully.',
  type: Number,
})
@Get('/:postId')
@UseGuards(JwtAuthGuard)
async getAverageRating(@Param('postId') postId: string) {
  return this.ratingService.getAverageRating(postId);
}
}
