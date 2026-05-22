import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
  Req,
} from '@nestjs/common';
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiQuery,
} from '@nestjs/swagger';
import { SettingsService } from './settings.service';
import { CreateSettingDto } from './dto/create-setting.dto';
import { UpdateSettingDto } from './dto/update-setting.dto';
import { FilterSettingDto } from './dto/filter-setting.dto';
import { SettingResponseDto } from './dto/setting-response.dto';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { Roles } from '../../auth/decorators/roles.decorator';
import { Public } from '../../auth/decorators/public.decorator';
import { UserRole } from '../../common/enums/roles.enum';

@ApiTags('Settings')
@ApiBearerAuth()
@Controller('settings')
@UseGuards(JwtAuthGuard, RolesGuard)
export class SettingsController {
  constructor(private readonly settingsService: SettingsService) {}

  @Post()
  @Roles(UserRole.SUPER_ADMIN, UserRole.COMPANY_ADMIN)
  @ApiOperation({ summary: 'Create a new setting' })
  @ApiResponse({ status: 201, type: SettingResponseDto })
  async create(@Body() createDto: CreateSettingDto, @Req() req: any): Promise<SettingResponseDto> {
    return this.settingsService.create(createDto, req.user.id);
  }

  @Get()
  @Roles(UserRole.SUPER_ADMIN, UserRole.COMPANY_ADMIN)
  @ApiOperation({ summary: 'Get all settings' })
  async findAll(@Query() filters: FilterSettingDto, @Req() req: any): Promise<{
    data: SettingResponseDto[];
    total: number;
    page: number;
    limit: number;
  }> {
    const organizationId = req.user.organizationId;
    return this.settingsService.findAll(filters, organizationId);
  }

  @Get('organization')
  @Roles(UserRole.SUPER_ADMIN, UserRole.COMPANY_ADMIN)
  @ApiOperation({ summary: 'Get organization settings' })
  async getOrganizationSettings(@Req() req: any): Promise<SettingResponseDto[]> {
    return this.settingsService.getOrganizationSettings(req.user.organizationId);
  }

  @Get('global')
  @Roles(UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Get global settings' })
  async getGlobalSettings(): Promise<SettingResponseDto[]> {
    return this.settingsService.getGlobalSettings();
  }

  @Get('public')
  @Public()
  @ApiOperation({ summary: 'Get public settings (no auth required)' })
  async getPublicSettings(): Promise<SettingResponseDto[]> {
    return this.settingsService.getPublicSettings();
  }

  @Get('group/:group')
  @Roles(UserRole.SUPER_ADMIN, UserRole.COMPANY_ADMIN)
  @ApiOperation({ summary: 'Get settings by group' })
  async getSettingsByGroup(@Param('group') group: string, @Req() req: any): Promise<SettingResponseDto[]> {
    const organizationId = req.user.organizationId;
    return this.settingsService.getSettingsByGroup(group, organizationId);
  }

  @Get('value/:key')
  @ApiOperation({ summary: 'Get setting value by key' })
  @ApiQuery({ name: 'organizationId', required: false })
  async getValue(
    @Param('key') key: string,
    @Query('organizationId') organizationId?: string,
  ): Promise<any> {
    return this.settingsService.getValue(key, organizationId);
  }

  @Get(':id')
  @Roles(UserRole.SUPER_ADMIN, UserRole.COMPANY_ADMIN)
  @ApiOperation({ summary: 'Get setting by ID' })
  async findOne(@Param('id') id: string, @Req() req: any): Promise<SettingResponseDto> {
    const organizationId = req.user.organizationId;
    return this.settingsService.findOne(id, organizationId);
  }

  @Put('value/:key')
  @Roles(UserRole.SUPER_ADMIN, UserRole.COMPANY_ADMIN)
  @ApiOperation({ summary: 'Set setting value by key' })
  @ApiResponse({ type: SettingResponseDto })
  async setValue(
    @Param('key') key: string,
    @Body('value') value: any,
    @Body('dataType') dataType: string,
    @Req() req: any,
  ): Promise<SettingResponseDto> {
    const organizationId = req.user.organizationId;
    return this.settingsService.setValue(key, value, organizationId, dataType);
  }

  @Put(':id')
  @Roles(UserRole.SUPER_ADMIN, UserRole.COMPANY_ADMIN)
  @ApiOperation({ summary: 'Update setting' })
  async update(
    @Param('id') id: string,
    @Body() updateDto: UpdateSettingDto,
    @Req() req: any,
  ): Promise<SettingResponseDto> {
    const organizationId = req.user.organizationId;
    return this.settingsService.update(id, updateDto, organizationId);
  }

  @Post('initialize')
  @Roles(UserRole.SUPER_ADMIN)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Initialize default settings' })
  async initializeDefaultSettings(@Req() req: any): Promise<{ message: string }> {
    await this.settingsService.initializeDefaultSettings(req.user.organizationId);
    return { message: 'Default settings initialized successfully' };
  }

  @Delete(':id')
  @Roles(UserRole.SUPER_ADMIN, UserRole.COMPANY_ADMIN)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete setting by ID' })
  async remove(@Param('id') id: string, @Req() req: any): Promise<void> {
    const organizationId = req.user.organizationId;
    return this.settingsService.remove(id, organizationId);
  }

  @Delete('key/:key')
  @Roles(UserRole.SUPER_ADMIN, UserRole.COMPANY_ADMIN)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete setting by key' })
  async removeByKey(@Param('key') key: string, @Req() req: any): Promise<void> {
    const organizationId = req.user.organizationId;
    return this.settingsService.removeByKey(key, organizationId);
  }
}