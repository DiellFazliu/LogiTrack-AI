import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class AuditLogResponseDto {
  @ApiProperty()
  id!: string;

  @ApiPropertyOptional()
  organizationId!: string | null;

  @ApiPropertyOptional()
  userId!: string | null;

  @ApiPropertyOptional()
  userName?: string;

  @ApiProperty()
  action!: string;

  @ApiPropertyOptional()
  method!: string | null;

  @ApiPropertyOptional()
  url!: string | null;

  @ApiPropertyOptional()
  entityType!: string | null;

  @ApiPropertyOptional()
  entityId!: string | null;

  @ApiPropertyOptional()
  oldValues!: any;

  @ApiPropertyOptional()
  newValues!: any;

  @ApiPropertyOptional()
  ipAddress!: string | null;

  @ApiPropertyOptional()
  userAgent!: string | null;

  @ApiPropertyOptional()
  statusCode!: number | null;

  @ApiPropertyOptional()
  responseTimeMs!: number | null;

  @ApiPropertyOptional()
  errorMessage!: string | null;

  @ApiProperty()
  createdAt!: Date;
}