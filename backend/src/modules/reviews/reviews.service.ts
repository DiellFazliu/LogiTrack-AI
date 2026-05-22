import { Injectable } from '@nestjs/common';

import { InjectRepository } from '@nestjs/typeorm';

import { Repository } from 'typeorm';

import { Review } from './review.entity';

import { CreateReviewDto } from './dto/create-review.dto';

@Injectable()
export class ReviewsService {

 constructor(

   @InjectRepository(Review)

   private reviewRepository:
   Repository<Review>

 ){}

 async createReview(
   dto:CreateReviewDto
 ){

   const review=
   this.reviewRepository.create({

      shipmentId:
      dto.shipmentId,

      driverId:
      dto.driverId,

      rating:
      dto.rating,

      comment:
      dto.comment

   });

   return this.reviewRepository
   .save(review);

 }

 async getAllReviews(){

   return this.reviewRepository
   .find();

 }

}