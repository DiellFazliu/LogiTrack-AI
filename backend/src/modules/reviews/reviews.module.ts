import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { ReviewsController } from './reviews.controller';
import { ReviewsService } from './reviews.service';

import { Review } from './review.entity';

import { Shipment } from '../shipments/shipment.entity';
import { Driver } from '../drivers/driver.entity';
import { User } from '../users/user.entity';

@Module({

 imports:[

   TypeOrmModule.forFeature([

      Review,
      Shipment,
      Driver,
      User

   ])

 ],

 controllers:[
   ReviewsController
 ],

 providers:[
   ReviewsService
 ],

 exports:[
   ReviewsService
 ]

})

export class ReviewsModule {}