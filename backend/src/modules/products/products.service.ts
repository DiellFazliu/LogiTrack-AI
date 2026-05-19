import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Product } from './product.entity';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';

@Injectable()
export class ProductsService {
  constructor(
    @InjectRepository(Product)
    private productRepository: Repository<Product>,
  ) {}

  async create(createDto: CreateProductDto, organizationId: string): Promise<Product> {
    const product = this.productRepository.create({
      ...createDto,
      organizationId,
    });
    return this.productRepository.save(product);
  }

  async findAll(organizationId: string, category?: string): Promise<Product[]> {
    const where: any = { organizationId, isActive: true };
    if (category) where.category = category;
    
    return this.productRepository.find({ where });
  }

  async findOne(id: string, organizationId: string): Promise<Product> {
    const product = await this.productRepository.findOne({
      where: { id, organizationId },
    });
    if (!product) throw new NotFoundException('Product not found');
    return product;
  }

  async update(id: string, updateDto: UpdateProductDto, organizationId: string): Promise<Product> {
    await this.findOne(id, organizationId);
    await this.productRepository.update(id, updateDto);
    return this.findOne(id, organizationId);
  }

  async remove(id: string, organizationId: string): Promise<void> {
    await this.findOne(id, organizationId);
    await this.productRepository.update(id, { isActive: false });
  }
}