// src/modules/auth/dto/create-user.dto.ts
import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsString, MinLength, IsOptional, IsEnum, IsUUID } from 'class-validator';

export enum CreateUserRole {
  CUSTOMER = 'customer',
  DRIVER = 'driver',
  DISPATCHER = 'dispatcher',
  COMPANY_ADMIN = 'company_admin',
}

export class CreateUserDto {
  @ApiProperty({ example: 'user@example.com' })
  @IsEmail()
  email!: string;

  @ApiProperty({ example: 'password123', minLength: 6 })
  @IsString()
  @MinLength(6)
  password!: string;

  @ApiProperty({ example: 'John Doe' })
  @IsString()
  name!: string;

  @ApiProperty({ enum: CreateUserRole, example: CreateUserRole.CUSTOMER })
  @IsEnum(CreateUserRole)
  role!: CreateUserRole;

  @ApiProperty({ required: false, description: 'Required for super_admin creating company_admin' })
  @IsOptional()
  @IsString()
  organizationName?: string;

  @ApiProperty({ required: false, description: 'Organization ID for super_admin' })
  @IsOptional()
  @IsUUID()
  organizationId?: string;

  @ApiProperty({ required: false, example: '+38344123456' })
  @IsOptional()
  @IsString()
  phone?: string;
}