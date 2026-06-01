// backend/src/modules/notifications/dto/create-notification.dto.ts
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsUUID, IsString, IsOptional, IsBoolean, IsObject, IsEnum, IsInt, Min, Max } from 'class-validator';
import { Transform } from 'class-transformer';

export type NotificationType = 'email' | 'sms' | 'push' | 'in_app';

export class CreateNotificationDto {
  @ApiProperty()
  @IsUUID()
  userId!: string;

  @ApiPropertyOptional({ enum: ['email', 'sms', 'push', 'in_app'], default: 'in_app' })
  @IsOptional()
  @IsEnum(['email', 'sms', 'push', 'in_app'])
  type?: NotificationType;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  title!: string;

  @ApiProperty()
  @IsString()
  message!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsObject()
  data?: any;
}

export class UpdateNotificationDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  isRead?: boolean;
}

export class NotificationQueryDto {
  @ApiPropertyOptional()
  @IsOptional()
  @Transform(({ value }) => value === 'true')
  @IsBoolean()
  isRead?: boolean;

  @ApiPropertyOptional({ default: 50, maximum: 100 })
  @IsOptional()
  @Transform(({ value }) => parseInt(value))
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number = 50;

  @ApiPropertyOptional({ default: 0 })
  @IsOptional()
  @Transform(({ value }) => parseInt(value))
  @IsInt()
  @Min(0)
  offset?: number = 0;
}