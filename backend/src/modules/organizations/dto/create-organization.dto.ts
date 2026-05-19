// src/modules/organizations/dto/create-organization.dto.ts
import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsEmail, IsOptional, IsEnum, IsBoolean, IsDateString, IsInt, Min } from 'class-validator';

export enum PlanType {
  FREE = 'free',
  BASIC = 'basic',
  PRO = 'pro',
  ENTERPRISE = 'enterprise',
}

export enum SubscriptionStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  TRIAL = 'trial',
  EXPIRED = 'expired',
}

export class CreateOrganizationDto {
  @ApiProperty({ example: 'Transporti Shpejt' })
  @IsString()
  name!: string;

  @ApiProperty({ example: 'info@transporti.com' })
  @IsEmail()
  email!: string;

  @ApiProperty({ required: false, example: '+38344123456' })
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiProperty({ required: false, example: 'Rruga ABC, Prishtinë' })
  @IsOptional()
  @IsString()
  address?: string;

  @ApiProperty({ enum: PlanType, default: PlanType.FREE, required: false })
  @IsOptional()
  @IsEnum(PlanType)
  planType?: PlanType;

  @ApiProperty({ enum: SubscriptionStatus, default: SubscriptionStatus.TRIAL, required: false })
  @IsOptional()
  @IsEnum(SubscriptionStatus)
  subscriptionStatus?: SubscriptionStatus;

  @ApiProperty({ required: false, example: '2026-06-18T00:00:00.000Z' })
  @IsOptional()
  @IsDateString()
  subscriptionEndsAt?: string;

  @ApiProperty({ required: false, example: 5 })
  @IsOptional()
  @IsInt()
  @Min(1)
  maxUsers?: number;

  @ApiProperty({ required: false, example: 100 })
  @IsOptional()
  @IsInt()
  @Min(1)
  maxShipmentsPerMonth?: number;

  @ApiProperty({ required: false, example: 'https://transporti.com/logo.png' })
  @IsOptional()
  @IsString()
  logoUrl?: string;

  @ApiProperty({ required: false, default: true })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}