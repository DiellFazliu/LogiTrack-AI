import { ApiProperty } from '@nestjs/swagger';

export class PaymentResponseDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  invoiceId!: string;

  @ApiProperty()
  amount!: number;

  @ApiProperty()
  method!: string;

  @ApiProperty()
  status!: string;

  @ApiProperty()
  paidAt!: Date;
}