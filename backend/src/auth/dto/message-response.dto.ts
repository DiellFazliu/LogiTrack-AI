// src/modules/auth/dto/message-response.dto.ts
import { ApiProperty } from '@nestjs/swagger';

export class MessageResponseDto {
  @ApiProperty({ example: 'Operation completed successfully' })
  message!: string;
}