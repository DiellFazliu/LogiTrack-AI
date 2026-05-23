// src/modules/auth/dto/user-response.dto.ts
import { ApiProperty } from '@nestjs/swagger';

export class UserResponseDto {
  @ApiProperty({ example: '123e4567-e89b-12d3-a456-426614174000' })
  id!: string;

  @ApiProperty({ example: 'user@example.com' })
  email!: string;

  @ApiProperty({ example: 'John Doe' })
  name!: string;

  @ApiProperty({ 
    example: ['customer', 'driver'], 
    description: 'List of roles assigned to the user',
    isArray: true 
  })
  roles?: string[];

  @ApiProperty({ example: '123e4567-e89b-12d3-a456-426614174000', nullable: true })
  organizationId?: string | null;

  @ApiProperty({ example: '+38344123456', nullable: true })
  phone?: string;

  @ApiProperty({ example: true })
  isActive!: boolean;
}