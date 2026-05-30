import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, FindOptionsWhere, Between, In } from 'typeorm';
import { Payment, PaymentStatus } from './payment.entity';
import { CreatePaymentDto } from './dto/create-payment.dto';
import { UpdatePaymentDto } from './dto/update-payment.dto';
import { FilterPaymentDto } from './dto/filter-payment.dto';
import { PaymentResponseDto, InvoiceInfoDto } from './dto/payment-response.dto';
import { Invoice, InvoiceStatus } from '../invoices/invoice.entity';

@Injectable()
export class PaymentsService {
  constructor(
    @InjectRepository(Payment)
    private paymentRepository: Repository<Payment>,
    @InjectRepository(Invoice)
    private invoiceRepository: Repository<Invoice>,
  ) {}

  private async toResponseDto(payment: Payment): Promise<PaymentResponseDto> {
    let invoiceInfo: InvoiceInfoDto | undefined;
    if (payment.invoice) {
      invoiceInfo = {
        id: payment.invoice.id,
        invoiceNumber: payment.invoice.invoiceNumber,
        totalAmount: payment.invoice.totalAmount,
        status: payment.invoice.status,
      };
    }

    return {
      id: payment.id,
      invoiceId: payment.invoiceId,
      invoice: invoiceInfo,
      amount: payment.amount,
      method: payment.method,
      transactionId: payment.transactionId,
      status: payment.status,
      paidAt: payment.paidAt,
      createdAt: payment.createdAt,
    };
  }

  async create(createDto: CreatePaymentDto, userId: string, organizationId: string): Promise<PaymentResponseDto> {
    const { invoiceId, amount } = createDto;

    const invoice = await this.invoiceRepository.findOne({
      where: { id: invoiceId, organizationId },
    });
    if (!invoice) {
      throw new NotFoundException(`Invoice with ID ${invoiceId} not found`);
    }

    if (invoice.status === InvoiceStatus.PAID) {
      throw new BadRequestException('Invoice is already paid');
    }

    if (amount > invoice.totalAmount) {
      throw new BadRequestException('Payment amount cannot exceed invoice total');
    }

    const payment = this.paymentRepository.create({
      ...createDto,
      status: PaymentStatus.COMPLETED,
      paidAt: new Date(),
    });

    const savedPayment = await this.paymentRepository.save(payment);

    // Update invoice status if fully paid
    const remainingAmount = invoice.totalAmount - amount;
    if (remainingAmount <= 0) {
      invoice.status = InvoiceStatus.PAID;
      invoice.paidAt = new Date();
      await this.invoiceRepository.save(invoice);
    }

    return this.toResponseDto(savedPayment);
  }

  async findAll(filters: FilterPaymentDto, organizationId: string): Promise<{
    data: PaymentResponseDto[];
    total: number;
    page: number;
    limit: number;
  }> {
    const {
      invoiceId,
      status,
      method,
      fromDate,
      toDate,
      page = 1,
      limit = 10,
      sortBy = 'createdAt',
      order = 'DESC',
    } = filters;

    const where: FindOptionsWhere<Payment> = {};

    if (invoiceId) where.invoiceId = invoiceId;
    if (status) where.status = status;
    if (method) where.method = method;

    if (fromDate && toDate) {
      where.createdAt = Between(new Date(fromDate), new Date(toDate));
    }

    const [data, total] = await this.paymentRepository.findAndCount({
      where,
      relations: ['invoice'],
      skip: (page - 1) * limit,
      take: limit,
      order: { [sortBy]: order },
    });

    const responseData = await Promise.all(data.map(item => this.toResponseDto(item)));

    return {
      data: responseData,
      total,
      page,
      limit,
    };
  }

  async findOne(id: string, organizationId: string): Promise<PaymentResponseDto> {
    const payment = await this.paymentRepository.findOne({
      where: { id },
      relations: ['invoice'],
    });
    if (!payment) {
      throw new NotFoundException(`Payment with ID ${id} not found`);
    }

    if (payment.invoice?.organizationId !== organizationId) {
      throw new ForbiddenException('You do not have access to this payment');
    }

    return this.toResponseDto(payment);
  }

  async findByInvoice(invoiceId: string, organizationId: string): Promise<PaymentResponseDto[]> {
    const invoice = await this.invoiceRepository.findOne({
      where: { id: invoiceId, organizationId },
    });
    if (!invoice) {
      throw new NotFoundException(`Invoice with ID ${invoiceId} not found`);
    }

    const payments = await this.paymentRepository.find({
      where: { invoiceId },
      relations: ['invoice'],
      order: { createdAt: 'DESC' },
    });

    return Promise.all(payments.map(p => this.toResponseDto(p)));
  }

  async update(id: string, updateDto: UpdatePaymentDto, organizationId: string): Promise<PaymentResponseDto> {
    const payment = await this.paymentRepository.findOne({
      where: { id },
      relations: ['invoice'],
    });
    if (!payment) {
      throw new NotFoundException(`Payment with ID ${id} not found`);
    }

    if (payment.invoice?.organizationId !== organizationId) {
      throw new ForbiddenException('You do not have access to this payment');
    }

    Object.assign(payment, updateDto);
    const savedPayment = await this.paymentRepository.save(payment);
    return this.toResponseDto(savedPayment);
  }

  async remove(id: string, organizationId: string): Promise<void> {
    const payment = await this.paymentRepository.findOne({
      where: { id },
      relations: ['invoice'],
    });
    if (!payment) {
      throw new NotFoundException(`Payment with ID ${id} not found`);
    }

    if (payment.invoice?.organizationId !== organizationId) {
      throw new ForbiddenException('You do not have access to this payment');
    }

    await this.paymentRepository.remove(payment);
  }

  async getPaymentStats(organizationId: string): Promise<any> {
    const invoices = await this.invoiceRepository.find({
      where: { organizationId },
    });

    const invoiceIds = invoices.map(i => i.id);
    
    // Përdor In operator për array
    let payments: Payment[] = [];
    if (invoiceIds.length > 0) {
      payments = await this.paymentRepository.find({
        where: { invoiceId: In(invoiceIds) },
      });
    }

    const totalAmount = payments.reduce((sum, p) => sum + p.amount, 0);
    const completedAmount = payments
      .filter(p => p.status === PaymentStatus.COMPLETED)
      .reduce((sum, p) => sum + p.amount, 0);

    const byMethod = payments.reduce((acc, p) => {
      acc[p.method] = (acc[p.method] || 0) + p.amount;
      return acc;
    }, {} as Record<string, number>);

    const byStatus = payments.reduce((acc, p) => {
      acc[p.status] = (acc[p.status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return {
      totalPayments: payments.length,
      totalAmount,
      completedAmount,
      byMethod,
      byStatus,
    };
  }
}