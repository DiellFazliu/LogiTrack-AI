import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsEmail, IsOptional } from 'class-validator';

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
}