// src/modules/products/products.service.ts
import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Product } from './product.entity';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { AuditService } from '../audit/audit.service';

@Injectable()
export class ProductsService {
  constructor(
    @InjectRepository(Product)
    private productRepository: Repository<Product>,
    private auditService: AuditService,
  ) {}

  async create(createDto: CreateProductDto, organizationId: string, userId: string): Promise<Product> {
    const product = this.productRepository.create({
      ...createDto,
      organizationId,
    });
    const savedProduct = await this.productRepository.save(product);
    
    await this.auditService.log({
      organizationId,
      userId,
      action: 'CREATE_PRODUCT',
      entityType: 'product',
      entityId: savedProduct.id,
      newValues: {
        name: savedProduct.name,
        sku: savedProduct.sku,
        category: savedProduct.category,
      },
    });
    
    return savedProduct;
  }

  async findAll(organizationId: string, userId: string): Promise<Product[]> {
    const products = await this.productRepository.find({
      where: { organizationId, isActive: true },
    });
    
    await this.auditService.log({
      organizationId,
      userId,
      action: 'VIEW_PRODUCTS_LIST',
      entityType: 'product',
      newValues: { count: products.length },
    });
    
    return products;
  }

  async findOne(id: string, organizationId: string, userId: string): Promise<Product> {
    const product = await this.productRepository.findOne({
      where: { id, organizationId, isActive: true },
    });
    if (!product) throw new NotFoundException('Product not found');
    
    await this.auditService.log({
      organizationId,
      userId,
      action: 'VIEW_PRODUCT_DETAILS',
      entityType: 'product',
      entityId: product.id,
      newValues: { name: product.name },
    });
    
    return product;
  }

  async update(id: string, updateDto: UpdateProductDto, organizationId: string, userId: string): Promise<Product> {
    const oldProduct = await this.findOne(id, organizationId, userId);
    
    const changes: any = {};
    if (updateDto.name !== undefined && updateDto.name !== oldProduct.name) {
      changes.name = { old: oldProduct.name, new: updateDto.name };
    }
    if (updateDto.sku !== undefined && updateDto.sku !== oldProduct.sku) {
      changes.sku = { old: oldProduct.sku, new: updateDto.sku };
    }
    if (updateDto.category !== undefined && updateDto.category !== oldProduct.category) {
      changes.category = { old: oldProduct.category, new: updateDto.category };
    }
    
    await this.productRepository.update(id, updateDto);
    const updatedProduct = await this.findOne(id, organizationId, userId);
    
    if (Object.keys(changes).length > 0) {
      await this.auditService.log({
        organizationId,
        userId,
        action: 'UPDATE_PRODUCT',
        entityType: 'product',
        entityId: id,
        oldValues: changes,
        newValues: { name: updatedProduct.name },
      });
    }
    
    return updatedProduct;
  }

  async remove(id: string, organizationId: string, userId: string): Promise<void> {
    const product = await this.findOne(id, organizationId, userId);
    
    await this.auditService.log({
      organizationId,
      userId,
      action: 'DELETE_PRODUCT',
      entityType: 'product',
      entityId: id,
      oldValues: {
        name: product.name,
        sku: product.sku,
      },
    });
    
    await this.productRepository.update(id, { isActive: false });
  }
}