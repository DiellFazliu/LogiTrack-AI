import { ApiProperty } from '@nestjs/swagger';

export class InvoiceResponseDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  invoiceNumber!: string;

  @ApiProperty()
  organizationId!: string;

  @ApiProperty()
  amount!: number;

  @ApiProperty()
  tax!: number;

  @ApiProperty()
  totalAmount!: number;

  @ApiProperty()
  status!: string;

  @ApiProperty()
  dueDate?: Date;

  @ApiProperty()
  paidAt?: Date;

  @ApiProperty()
  createdAt!: Date;
}