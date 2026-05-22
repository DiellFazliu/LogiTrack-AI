import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsString, IsOptional, IsUUID, IsObject } from 'class-validator';
import { NotificationType } from '../notification.entity';

export class CreateNotificationDto {
  @ApiProperty()
  @IsUUID()
  userId!: string;

  @ApiProperty({ enum: NotificationType, default: NotificationType.IN_APP })
  @IsEnum(NotificationType)
  @IsOptional()
  type?: NotificationType;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  title?: string;

  @ApiProperty()
  @IsString()
  message!: string;

  @ApiProperty({ required: false })
  @IsObject()
  @IsOptional()
  data?: any;
}