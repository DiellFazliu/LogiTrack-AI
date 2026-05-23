// src/modules/auth/dto/create-super-admin.dto.ts
import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsString, MinLength, IsOptional } from 'class-validator';

export class CreateSuperAdminDto {
  @ApiProperty({ example: 'superadmin@logitrack.com' })
  @IsEmail()
  email!: string;

  @ApiProperty({ example: 'SuperAdmin123!', minLength: 6 })
  @IsString()
  @MinLength(6)
  password!: string;

  @ApiProperty({ example: 'Super Admin' })
  @IsString()
  name!: string;

  @ApiProperty({ required: false, example: '+38344123456' })
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiProperty({ description: 'Secret key for super admin creation', example: 'your-super-secret-key-change-this' })
  @IsString()
  secretKey!: string;
}
