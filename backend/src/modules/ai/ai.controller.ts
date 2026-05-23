// src/modules/ai/ai.controller.ts
import { Controller, Post, Body, Param, Get, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiResponse, ApiBody } from '@nestjs/swagger';
import { AiService } from './ai.service';
import { OptimizeRouteDto } from './dto/optimize-route.dto';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { Roles } from '../../auth/decorators/roles.decorator';
import { UserRole } from '../../common/enums/roles.enum';

@ApiTags('AI')
@ApiBearerAuth()
@Controller('ai')
@UseGuards(JwtAuthGuard, RolesGuard)
export class AiController {
  constructor(private aiService: AiService) {}

  @Post('optimize-route')
  @Roles(UserRole.COMPANY_ADMIN, UserRole.DISPATCHER)
  @ApiOperation({ summary: 'Optimize delivery route using AI' })
  @ApiResponse({ status: 200, description: 'Route optimized successfully' })
  @ApiBody({ type: OptimizeRouteDto })
  async optimizeRoute(@Body() dto: OptimizeRouteDto) {
    return this.aiService.optimizeRoute(dto);
  }

  @Get('predict-delay/:shipmentId')
  @Roles(UserRole.COMPANY_ADMIN, UserRole.DISPATCHER)
  @ApiOperation({ summary: 'Predict shipment delay using AI' })
  @ApiResponse({ status: 200, description: 'Delay prediction generated' })
  async predictDelay(@Param('shipmentId') shipmentId: string) {
    return this.aiService.predictDelay(shipmentId);
  }

  @Post('chatbot')
  @ApiOperation({ summary: 'Chat with AI assistant' })
  @ApiResponse({ status: 200, description: 'Response generated' })
  @ApiBody({ schema: { type: 'object', properties: { message: { type: 'string' } } } })
  async chat(@Body('message') message: string) {
    return { response: await this.aiService.chat(message) };
  }
}