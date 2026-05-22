import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Document } from './document.entity';
import { CreateDocumentDto } from './dto/create-document.dto';
import { UpdateDocumentDto } from './dto/update-document.dto';

@Injectable()
export class DocumentsService {
  constructor(
    @InjectRepository(Document)
    private documentRepository: Repository<Document>,
  ) {}

  async create(createDocumentDto: CreateDocumentDto, userId: string, organizationId: string): Promise<Document> {
    const documentNumber = `DOC-${Date.now()}-${Math.random().toString(36).substr(2, 8).toUpperCase()}`;

    const document = this.documentRepository.create({
      ...createDocumentDto,
      documentNumber,
      organizationId,
      uploadedBy: userId,
    });

    return this.documentRepository.save(document);
  }

  async findAll(organizationId: string, type?: string, page: number = 1, limit: number = 10): Promise<{ items: Document[]; total: number }> {
    const where: any = { organizationId };
    if (type) where.documentType = type;

    const [items, total] = await this.documentRepository.findAndCount({
      where,
      relations: ['shipment', 'uploader'],
      order: { uploadedAt: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });

    return { items, total };
  }

  async findById(id: string, organizationId: string): Promise<Document> {
    const document = await this.documentRepository.findOne({
      where: { id, organizationId },
      relations: ['shipment', 'uploader'],
    });
    if (!document) throw new NotFoundException('Document not found');
    return document;
  }

  async update(id: string, organizationId: string, updateDocumentDto: UpdateDocumentDto): Promise<Document> {
    const document = await this.findById(id, organizationId);
    if (updateDocumentDto.description) {
      document.description = updateDocumentDto.description;
    }
    return this.documentRepository.save(document);
  }

  async remove(id: string, organizationId: string): Promise<void> {
    const document = await this.findById(id, organizationId);
    await this.documentRepository.remove(document);
  }
}