import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class SettingResponseDto {
  @ApiProperty()
  id!: string;

  @ApiPropertyOptional()
  organizationId!: string | null;

  @ApiProperty()
  key!: string;

  @ApiProperty()
  value!: string;

  @ApiProperty()
  dataType!: string;

  @ApiPropertyOptional()
  description!: string | null;

  @ApiProperty()
  isPublic!: boolean;

  @ApiProperty()
  isEncrypted!: boolean;

  @ApiPropertyOptional()
  group!: string | null;

  @ApiProperty()
  createdAt!: Date;

  @ApiProperty()
  updatedAt!: Date;
}