// src/modules/invoices/invoices.service.ts
import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between } from 'typeorm';
import { Invoice, InvoiceStatus } from './invoice.entity';
import { Payment } from './payment.entity';
import { CreateInvoiceDto } from './dto/create-invoice.dto';
import { UpdateInvoiceDto } from './dto/update-invoice.dto';
import { CreatePaymentDto } from './dto/create-payment.dto';

@Injectable()
export class InvoicesService {
  constructor(
    @InjectRepository(Invoice)
    private invoiceRepository: Repository<Invoice>,
    @InjectRepository(Payment)
    private paymentRepository: Repository<Payment>,
  ) {}

  async generateInvoiceNumber(): Promise<string> {
    const lastInvoice = await this.invoiceRepository.findOne({
      order: { createdAt: 'DESC' },
    });
    const lastNumber = lastInvoice ? parseInt(lastInvoice.invoiceNumber.split('-')[1]) : 0;
    return `INV-${(lastNumber + 1).toString().padStart(6, '0')}`;
  }

  async create(createDto: CreateInvoiceDto): Promise<Invoice> {
    const invoiceNumber = await this.generateInvoiceNumber();
    const totalAmount = createDto.amount + (createDto.tax || 0);
    const invoice = this.invoiceRepository.create({
      ...createDto,
      invoiceNumber,
      totalAmount,
    });
    return this.invoiceRepository.save(invoice);
  }

  async findAll(organizationId?: string, status?: string): Promise<Invoice[]> {
    const where: any = {};
    if (organizationId) where.organizationId = organizationId;
    if (status) where.status = status;
    return this.invoiceRepository.find({
      where,
      relations: ['organization', 'shipment', 'payments'],
      order: { createdAt: 'DESC' },
    });
  }

  async findOne(id: string): Promise<Invoice> {
    const invoice = await this.invoiceRepository.findOne({
      where: { id },
      relations: ['organization', 'shipment', 'payments'],
    });
    if (!invoice) throw new NotFoundException('Invoice not found');
    return invoice;
  }

  async update(id: string, updateDto: UpdateInvoiceDto): Promise<Invoice> {
    const invoice = await this.findOne(id);
    Object.assign(invoice, updateDto);
    return this.invoiceRepository.save(invoice);
  }

  async addPayment(createPaymentDto: CreatePaymentDto): Promise<Payment> {
    const invoice = await this.findOne(createPaymentDto.invoiceId);
    if (invoice.status === InvoiceStatus.PAID) {
      throw new BadRequestException('Invoice already paid');
    }
    const payment = this.paymentRepository.create(createPaymentDto);
    const savedPayment = await this.paymentRepository.save(payment);

    // Update invoice status based on total paid
    const totalPaid = await this.getTotalPaid(invoice.id);
    if (totalPaid >= invoice.totalAmount) {
      invoice.status = InvoiceStatus.PAID;
      invoice.paidAt = new Date();
      await this.invoiceRepository.save(invoice);
    }
    return savedPayment;
  }

  async getTotalPaid(invoiceId: string): Promise<number> {
    const result = await this.paymentRepository
      .createQueryBuilder('payment')
      .select('SUM(payment.amount)', 'total')
      .where('payment.invoice_id = :invoiceId', { invoiceId })
      .getRawOne();
    return parseFloat(result?.total || 0);
  }

  async getPayments(invoiceId: string): Promise<Payment[]> {
    return this.paymentRepository.find({
      where: { invoiceId },
      order: { paidAt: 'DESC' },
    });
  }

  async getInvoicesByOrganization(organizationId: string): Promise<Invoice[]> {
    return this.findAll(organizationId);
  }

  async getOverdueInvoices(): Promise<Invoice[]> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return this.invoiceRepository.find({
      where: {
        status: InvoiceStatus.PENDING,
        dueDate: Between(new Date(0), today),
      },
      relations: ['organization'],
    });
  }

  async remove(id: string): Promise<void> {
    const invoice = await this.findOne(id);
    await this.invoiceRepository.remove(invoice);
  }
}