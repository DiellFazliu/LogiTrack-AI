import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, FindOptionsWhere, ILike, IsNull, Equal } from 'typeorm';
import { Setting } from './setting.entity';
import { CreateSettingDto } from './dto/create-setting.dto';
import { UpdateSettingDto } from './dto/update-setting.dto';
import { FilterSettingDto } from './dto/filter-setting.dto';
import { SettingResponseDto } from './dto/setting-response.dto';

@Injectable()
export class SettingsService {
  constructor(
    @InjectRepository(Setting)
    private settingRepository: Repository<Setting>,
  ) {}

  private toResponseDto(setting: Setting): SettingResponseDto {
    return {
      id: setting.id,
      organizationId: setting.organizationId,
      key: setting.key,
      value: setting.value,
      dataType: setting.dataType,
      description: setting.description,
      isPublic: setting.isPublic,
      isEncrypted: setting.isEncrypted,
      group: setting.group,
      createdAt: setting.createdAt,
      updatedAt: setting.updatedAt,
    };
  }

  private parseValue(value: string, dataType: string): any {
    switch (dataType) {
      case 'number':
        return parseFloat(value);
      case 'boolean':
        return value === 'true';
      case 'json':
        try {
          return JSON.parse(value);
        } catch {
          return value;
        }
      default:
        return value;
    }
  }

  private formatValue(value: any, dataType: string): string {
    switch (dataType) {
      case 'json':
        return JSON.stringify(value);
      default:
        return String(value);
    }
  }

  async create(createDto: CreateSettingDto, userId: string): Promise<SettingResponseDto> {
    const { key, organizationId } = createDto;

    const where: FindOptionsWhere<Setting> = { key };
    if (organizationId) {
      where.organizationId = organizationId;
    } else {
      where.organizationId = IsNull();
    }

    const existing = await this.settingRepository.findOne({ where });
    if (existing) {
      throw new BadRequestException(`Setting with key '${key}' already exists`);
    }

    const setting = this.settingRepository.create({
      ...createDto,
      organizationId: organizationId || null,
    });

    const savedSetting = await this.settingRepository.save(setting);
    return this.toResponseDto(savedSetting);
  }

  async findAll(filters: FilterSettingDto, organizationId?: string): Promise<{
    data: SettingResponseDto[];
    total: number;
    page: number;
    limit: number;
  }> {
    const {
      key,
      group,
      isPublic,
      page = 1,
      limit = 20,
      sortBy = 'key',
      order = 'ASC',
    } = filters;

    const where: FindOptionsWhere<Setting> = {};

    if (organizationId) {
      where.organizationId = organizationId;
    } else if (filters.organizationId) {
      where.organizationId = filters.organizationId;
    }

    if (key) where.key = ILike(`%${key}%`);
    if (group) where.group = group;
    if (isPublic !== undefined) where.isPublic = isPublic;

    const [data, total] = await this.settingRepository.findAndCount({
      where,
      skip: (page - 1) * limit,
      take: limit,
      order: { [sortBy]: order },
    });

    return {
      data: data.map(item => this.toResponseDto(item)),
      total,
      page,
      limit,
    };
  }

  async findOne(id: string, organizationId?: string): Promise<SettingResponseDto> {
    const where: FindOptionsWhere<Setting> = { id };
    if (organizationId) {
      where.organizationId = organizationId;
    }

    const setting = await this.settingRepository.findOne({ where });
    if (!setting) {
      throw new NotFoundException(`Setting with ID ${id} not found`);
    }
    return this.toResponseDto(setting);
  }

  async getValue(key: string, organizationId?: string): Promise<any> {
    let setting: Setting | null = null;

    // First try to get organization-specific setting
    if (organizationId) {
      setting = await this.settingRepository.findOne({
        where: { key, organizationId },
      });
    }

    // If not found, try to get global setting
    if (!setting) {
      setting = await this.settingRepository.findOne({
        where: { key, organizationId: IsNull() },
      });
    }

    if (!setting) {
      return null;
    }

    return this.parseValue(setting.value, setting.dataType);
  }

  async setValue(
    key: string,
    value: any,
    organizationId?: string,
    dataType?: string,
  ): Promise<SettingResponseDto> {
    let setting: Setting | null = null;

    if (organizationId) {
      setting = await this.settingRepository.findOne({
        where: { key, organizationId },
      });
    }

    if (!setting) {
      setting = await this.settingRepository.findOne({
        where: { key, organizationId: IsNull() },
      });
    }

    const inferredDataType = dataType || typeof value;
    const formattedValue = this.formatValue(value, inferredDataType);

    if (setting) {
      setting.value = formattedValue;
      setting.dataType = inferredDataType;
      setting.updatedAt = new Date();
    } else {
      setting = this.settingRepository.create({
        key,
        value: formattedValue,
        dataType: inferredDataType,
        organizationId: organizationId || null,
      });
    }

    const savedSetting = await this.settingRepository.save(setting);
    return this.toResponseDto(savedSetting);
  }

  async update(
    id: string,
    updateDto: UpdateSettingDto,
    organizationId?: string,
  ): Promise<SettingResponseDto> {
    const setting = await this.settingRepository.findOne({
      where: { id },
    });
    if (!setting) {
      throw new NotFoundException(`Setting with ID ${id} not found`);
    }

    if (organizationId && setting.organizationId !== organizationId) {
      throw new ForbiddenException('You do not have access to this setting');
    }

    if (updateDto.value !== undefined) {
      const dataType = updateDto.dataType || setting.dataType;
      updateDto.value = this.formatValue(updateDto.value, dataType);
    }

    Object.assign(setting, updateDto);
    const savedSetting = await this.settingRepository.save(setting);
    return this.toResponseDto(savedSetting);
  }

  async getOrganizationSettings(organizationId: string): Promise<SettingResponseDto[]> {
    const settings = await this.settingRepository.find({
      where: [
        { organizationId },
        { organizationId: IsNull(), isPublic: true },
      ],
      order: { group: 'ASC', key: 'ASC' },
    });
    return settings.map(item => this.toResponseDto(item));
  }

  async getGlobalSettings(): Promise<SettingResponseDto[]> {
    const settings = await this.settingRepository.find({
      where: { organizationId: IsNull() },
      order: { group: 'ASC', key: 'ASC' },
    });
    return settings.map(item => this.toResponseDto(item));
  }

  async getSettingsByGroup(group: string, organizationId?: string): Promise<SettingResponseDto[]> {
    const where: FindOptionsWhere<Setting> = { group };
    if (organizationId) {
      where.organizationId = organizationId;
    } else {
      where.organizationId = IsNull();
    }

    const settings = await this.settingRepository.find({ where });
    return settings.map(item => this.toResponseDto(item));
  }

  async getPublicSettings(): Promise<SettingResponseDto[]> {
    const settings = await this.settingRepository.find({
      where: { isPublic: true, organizationId: IsNull() },
      order: { group: 'ASC', key: 'ASC' },
    });
    return settings.map(item => this.toResponseDto(item));
  }

  async remove(id: string, organizationId?: string): Promise<void> {
    const setting = await this.settingRepository.findOne({
      where: { id },
    });
    if (!setting) {
      throw new NotFoundException(`Setting with ID ${id} not found`);
    }

    if (organizationId && setting.organizationId !== organizationId) {
      throw new ForbiddenException('You do not have access to this setting');
    }

    await this.settingRepository.remove(setting);
  }

  async removeByKey(key: string, organizationId?: string): Promise<void> {
    let setting: Setting | null = null;

    if (organizationId) {
      setting = await this.settingRepository.findOne({
        where: { key, organizationId },
      });
    }

    if (!setting) {
      setting = await this.settingRepository.findOne({
        where: { key, organizationId: IsNull() },
      });
    }

    if (!setting) {
      throw new NotFoundException(`Setting with key '${key}' not found`);
    }

    await this.settingRepository.remove(setting);
  }

  async initializeDefaultSettings(organizationId?: string): Promise<void> {
    const defaultSettings = [
      { key: 'company_name', value: 'LogiTrack AI', dataType: 'string', group: 'general', description: 'Company display name' },
      { key: 'company_logo', value: '', dataType: 'string', group: 'general', description: 'Company logo URL' },
      { key: 'timezone', value: 'Europe/Tirane', dataType: 'string', group: 'general', description: 'System timezone' },
      { key: 'date_format', value: 'YYYY-MM-DD', dataType: 'string', group: 'general', description: 'Date display format' },
      { key: 'default_currency', value: 'EUR', dataType: 'string', group: 'financial', description: 'Default currency' },
      { key: 'tax_rate', value: '20', dataType: 'number', group: 'financial', description: 'Default tax rate (%)' },
      { key: 'enable_email_notifications', value: 'true', dataType: 'boolean', group: 'notifications', description: 'Enable email notifications' },
      { key: 'enable_sms_notifications', value: 'false', dataType: 'boolean', group: 'notifications', description: 'Enable SMS notifications' },
      { key: 'default_payment_terms', value: '30', dataType: 'number', group: 'financial', description: 'Default payment terms (days)' },
      { key: 'low_stock_threshold', value: '10', dataType: 'number', group: 'inventory', description: 'Low stock alert threshold' },
    ];

    for (const setting of defaultSettings) {
      const where: FindOptionsWhere<Setting> = { key: setting.key };
      if (organizationId) {
        where.organizationId = organizationId;
      } else {
        where.organizationId = IsNull();
      }

      const existing = await this.settingRepository.findOne({ where });
      if (!existing) {
        await this.create(
          {
            ...setting,
            organizationId,
            isPublic: true,
          },
          'system',
        );
      }
    }
  }
}