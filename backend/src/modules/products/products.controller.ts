import { Controller, Get, Post, Put, Delete, Body, Param, Query, UseGuards, Request } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { ProductsService } from './products.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { Roles } from '../../auth/decorators/roles.decorator';
import { UserRole } from '../../common/enums/roles.enum';

@ApiTags('Products')
@ApiBearerAuth()
@Controller('products')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ProductsController {
  constructor(private productsService: ProductsService) {}

  @Post()
  @Roles(UserRole.COMPANY_ADMIN, UserRole.DISPATCHER)
  @ApiOperation({ summary: 'Create a new product' })
  create(@Body() createDto: CreateProductDto, @Request() req) {
    return this.productsService.create(createDto, req.user.organizationId);
  }

  @Get()
  @Roles(UserRole.COMPANY_ADMIN, UserRole.DISPATCHER)
  @ApiOperation({ summary: 'Get all products' })
  findAll(@Query('category') category: string, @Request() req) {
    return this.productsService.findAll(req.user.organizationId, category);
  }

  @Get(':id')
  @Roles(UserRole.COMPANY_ADMIN, UserRole.DISPATCHER)
  @ApiOperation({ summary: 'Get product by ID' })
  findOne(@Param('id') id: string, @Request() req) {
    return this.productsService.findOne(id, req.user.organizationId);
  }

  @Put(':id')
  @Roles(UserRole.COMPANY_ADMIN, UserRole.DISPATCHER)
  @ApiOperation({ summary: 'Update product' })
  update(@Param('id') id: string, @Body() updateDto: UpdateProductDto, @Request() req) {
    return this.productsService.update(id, updateDto, req.user.organizationId);
  }

  @Delete(':id')
  @Roles(UserRole.COMPANY_ADMIN)
  @ApiOperation({ summary: 'Delete product' })
  remove(@Param('id') id: string, @Request() req) {
    return this.productsService.remove(id, req.user.organizationId);
  }
}