import {
  Controller,
  Post,
  Get,
  Param,
  Body
} from '@nestjs/common';

import {
  ApiTags,
  ApiOperation,
  ApiResponse,
} from '@nestjs/swagger';

import { ReportsService }
from './reports.service';

@ApiTags('Reports')
@Controller('reports')

export class ReportsController {

 constructor(
   private reportsService:
   ReportsService
 ){}

 @Post(
   'daily/:organizationId'
 )

 @ApiOperation({
   summary:'Generate daily report'
 })

 @ApiResponse({
   status:200,
   description:'Daily report generated'
 })

 async generateDailyReport(

   @Param(
    'organizationId'
   )
   organizationId:string,

   @Body('date')
   date:string

 ){

   return this.reportsService
   .generateDailyReport(

      organizationId,

      new Date(date)

   );
 }

 @Get(':id')

 @ApiOperation({
   summary:'Get report by id'
 })

 @ApiResponse({
   status:200,
   description:'Report returned'
 })

 async getReport(

   @Param('id')
   id:string

 ){

   return this.reportsService
   .getReport(id);

 }

 @Get(
   'organization/:organizationId'
 )

 @ApiOperation({
   summary:'Get organization reports'
 })

 @ApiResponse({
   status:200,
   description:'Reports list returned'
 })

 async getOrganizationReports(

   @Param(
    'organizationId'
   )

   organizationId:string

 ){

   return this.reportsService
   .getReportsByOrganization(
      organizationId
   );

 }

}