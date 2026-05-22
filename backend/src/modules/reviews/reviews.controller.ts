import {
 Controller,
 Get,
 Post,
 Body
} from '@nestjs/common';

import {
 ApiTags,
 ApiOperation
} from '@nestjs/swagger';

import { ReviewsService }
from './reviews.service';

import { CreateReviewDto }
from './dto/create-review.dto';

@ApiTags('Reviews')
@Controller('reviews')

export class ReviewsController {

 constructor(
   private readonly reviewsService:
   ReviewsService
 ){}

 @Get()

 @ApiOperation({
   summary:'Get all reviews'
 })

 async getReviews(){

   return this.reviewsService
   .getAllReviews();

 }

 @Post()

 @ApiOperation({
   summary:'Create review'
 })

 async createReview(

   @Body()
   dto:CreateReviewDto

 ){

   return this.reviewsService
   .createReview(dto);

 }

}