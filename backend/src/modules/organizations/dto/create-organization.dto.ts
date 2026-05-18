import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsEmail, IsOptional, IsEnum, IsUUID } from 'class-validator';

export enum PlanType {
  FREE = 'free',
  BASIC = 'basic',
  PRO = 'pro',
  ENTERPRISE = 'enterprise',
}

export class CreateOrganizationDto {
  @ApiProperty({ example: 'Kompania Alfa', description: 'Name of the organization' })
  @IsString()
  name!: string;

  @ApiProperty({ example: 'info@kompania.com', description: 'Email address' })
  @IsEmail()
  email!: string;

  @ApiProperty({ required: false, example: '044123456', description: 'Phone number' })
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiProperty({ required: false, example: 'Rruga ABC, Prishtinë', description: 'Address' })
  @IsOptional()
  @IsString()
  address?: string;

  @ApiProperty({ required: false, enum: PlanType, default: PlanType.FREE, description: 'Subscription plan' })
  @IsOptional()
  @IsEnum(PlanType)
  planType?: PlanType;

  @ApiProperty({ required: false, description: 'Parent organization ID (for hierarchical organizations)' })
  @IsOptional()
  @IsUUID()
  parentOrganizationId?: string;

  @ApiProperty({ required: false, description: 'Organization logo URL' })
  @IsOptional()
  @IsString()
  logoUrl?: string;

  @ApiProperty({ required: false, description: 'Tax/VAT number' })
  @IsOptional()
  @IsString()
  taxNumber?: string;

  @ApiProperty({ required: false, description: 'Website URL' })
  @IsOptional()
  @IsString()
  website?: string;
}