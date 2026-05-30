// backend/src/modules/reviews/reviews.controller.ts
import { Controller, Get, Post, Put, Delete, Body, Param, UseGuards, Request, Query } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { ReviewsService } from './reviews.service';
import { CreateReviewDto, UpdateReviewDto } from './dto/create-review.dto';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { Roles } from '../../auth/decorators/roles.decorator';
import { UserRole } from '../../common/enums/roles.enum';

@ApiTags('Reviews')
@ApiBearerAuth()
@Controller('reviews')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ReviewsController {
  constructor(private readonly reviewsService: ReviewsService) {}

  @Post()
  @Roles(UserRole.CUSTOMER)
  @ApiOperation({ summary: 'Create a review for a shipment' })
  async create(@Body() createDto: CreateReviewDto, @Request() req) {
    return this.reviewsService.create(createDto, req.user.id);
  }

  @Get('shipment/:shipmentId')
  @Roles(UserRole.CUSTOMER, UserRole.DRIVER, UserRole.COMPANY_ADMIN)
  @ApiOperation({ summary: 'Get review by shipment ID' })
  async findByShipment(@Param('shipmentId') shipmentId: string) {
    return this.reviewsService.findByShipment(shipmentId);
  }

  @Get('driver/:driverId')
  @Roles(UserRole.COMPANY_ADMIN, UserRole.DISPATCHER)
  @ApiOperation({ summary: 'Get all reviews for a driver' })
  async findByDriver(@Param('driverId') driverId: string) {
    return this.reviewsService.findByDriver(driverId);
  }

  // ✅ ENDPOINT I RI: Merr review-t e fundit për organizatën
  @Get('recent')
  @Roles(UserRole.COMPANY_ADMIN, UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Get recent reviews for organization' })
  async getRecentReviews(
    @Query('organizationId') organizationId: string,
    @Query('limit') limit: string = '5',
    @Request() req,
  ) {
    const orgId = organizationId || req.user.organizationId;
    return this.reviewsService.getRecentReviews(orgId, parseInt(limit));
  }

  // ✅ ENDPOINT I RI: Merr mesataren e vlerësimeve për të gjithë driver-at
  @Get('driver/average/all')
  @Roles(UserRole.COMPANY_ADMIN, UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Get average rating for all drivers in organization' })
  async getAllDriversAverageRating(@Request() req) {
    return this.reviewsService.getAllDriversAverageRating(req.user.organizationId);
  }

  @Get('driver/:driverId/average')
  @ApiOperation({ summary: 'Get driver average rating' })
  async getDriverAverageRating(@Param('driverId') driverId: string) {
    const average = await this.reviewsService.getDriverAverageRating(driverId);
    return { driverId, averageRating: average };
  }

  @Put(':id')
  @Roles(UserRole.CUSTOMER)
  @ApiOperation({ summary: 'Update a review' })
  async update(@Param('id') id: string, @Body() updateDto: UpdateReviewDto, @Request() req) {
    return this.reviewsService.update(id, updateDto, req.user.id);
  }

  @Delete(':id')
  @Roles(UserRole.CUSTOMER)
  @ApiOperation({ summary: 'Delete a review' })
  async delete(@Param('id') id: string, @Request() req) {
    return this.reviewsService.delete(id, req.user.id);
  }
}