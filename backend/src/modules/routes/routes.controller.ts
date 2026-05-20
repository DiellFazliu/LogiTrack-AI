// src/modules/routes/routes.controller.ts
import { Controller, Post, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { Roles } from '../../auth/decorators/roles.decorator';
import { UserRole } from '../../common/enums/roles.enum';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { RoutesService } from './routes.service';
import { OptimizeRouteDto } from './dto/optimize-route.dto';

@ApiTags('Routes')
@ApiBearerAuth()
@Controller('routes')
@UseGuards(JwtAuthGuard, RolesGuard)
export class RoutesController {
  constructor(private readonly routesService: RoutesService) {}

  @Post('optimize')
  @Roles(UserRole.DRIVER, UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Get real route from OpenRouteService (Drivers and Super Admins only)' })
  @ApiResponse({ status: 200, description: 'Route optimized successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - Driver or Super Admin role required' })
  async optimize(@Body() dto: OptimizeRouteDto) {
    const coordinates: [number, number][] = dto.points.map((p) => [
      p.longitude,
      p.latitude,
    ]);

    return this.routesService.optimizeRoute(coordinates);
  }
}