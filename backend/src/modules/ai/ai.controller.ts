// backend/src/modules/ai/ai.controller.ts
import { Controller, Post, Body, Param, Get, UseGuards, Patch } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiResponse, ApiBody } from '@nestjs/swagger';
import { AiService } from './ai.service';
import { OptimizeRouteDto } from './dto/optimize-route.dto';
import { CreateAiOptimizationDto, UpdateAiOptimizationDto } from './dto/ai-optimization.dto';
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
  @Roles(UserRole.COMPANY_ADMIN, UserRole.DISPATCHER, UserRole.DRIVER)
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

  // ==================== AI OPTIMIZATIONS ENDPOINTS ====================

  @Post('optimizations')
  @Roles(UserRole.COMPANY_ADMIN, UserRole.DISPATCHER, UserRole.DRIVER)
  @ApiOperation({ summary: 'Create AI optimization record' })
  async createOptimization(@Body() createDto: CreateAiOptimizationDto) {
    return this.aiService.createOptimization(createDto);
  }

  @Patch('optimizations/:id')
  @Roles(UserRole.COMPANY_ADMIN, UserRole.DISPATCHER, UserRole.DRIVER)
  @ApiOperation({ summary: 'Update AI optimization record' })
  async updateOptimization(@Param('id') id: string, @Body() updateDto: UpdateAiOptimizationDto) {
    return this.aiService.updateOptimization(id, updateDto);
  }

  @Get('optimizations/shipment/:shipmentId')
  @Roles(UserRole.COMPANY_ADMIN, UserRole.DISPATCHER, UserRole.DRIVER)
  @ApiOperation({ summary: 'Get optimization by shipment ID' })
  async getOptimizationByShipment(@Param('shipmentId') shipmentId: string) {
    return this.aiService.findOptimizationByShipment(shipmentId);
  }

  @Get('optimizations')
  @Roles(UserRole.COMPANY_ADMIN, UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Get all AI optimizations' })
  async getAllOptimizations() {
    return this.aiService.findAllOptimizations();
  }
}