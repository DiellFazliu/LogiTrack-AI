import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class InvoiceInfoDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  invoiceNumber!: string;

  @ApiProperty()
  totalAmount!: number;

  @ApiProperty()
  status!: string;
}

export class PaymentResponseDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  invoiceId!: string;

  @ApiPropertyOptional({ type: InvoiceInfoDto })
  invoice?: InvoiceInfoDto;

  @ApiProperty()
  amount!: number;

  @ApiProperty()
  method!: string;

  @ApiPropertyOptional()
  transactionId!: string | null;

  @ApiProperty()
  status!: string;

  @ApiProperty()
  paidAt!: Date;

  @ApiProperty()
  createdAt!: Date;
}