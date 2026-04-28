import { IsEmail, IsString, MinLength, IsOptional, IsEnum } from 'class-validator'; 
import { ApiProperty } from '@nestjs/swagger'; 
import { UserRole } from '../../common/enums/roles.enum'; 
 
export class RegisterDto { 
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
 
  @ApiProperty({ enum: UserRole, example: UserRole.CUSTOMER, required: false }) 
  @IsEnum(UserRole) 
  @IsOptional() 
  role!: UserRole; 
 
  @ApiProperty({ required: false }) 
  @IsString() 
  @IsOptional() 
  organizationId!: string; 
} 
