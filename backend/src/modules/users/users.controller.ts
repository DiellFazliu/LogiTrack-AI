// src/modules/users/users.controller.ts
import { Controller, Get, Param, Put, Patch, Body, Delete, UseGuards, Request } from '@nestjs/common';
import { UsersService } from './users.service';
import { User } from './user.entity';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { Roles } from '../../auth/decorators/roles.decorator';
import { UserRole } from '../../common/enums/roles.enum';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiResponse } from '@nestjs/swagger';

@ApiTags('Users')
@ApiBearerAuth()
@Controller('users')
@UseGuards(JwtAuthGuard, RolesGuard)
export class UsersController {
  constructor(private usersService: UsersService) {}

  @Get()
  @Roles(UserRole.SUPER_ADMIN, UserRole.COMPANY_ADMIN)
  @ApiOperation({ summary: 'Get all users' })
  findAll(@Request() req) {
    const organizationId = req.user.role === 'super_admin' ? undefined : req.user.organizationId;
    return this.usersService.findAll(organizationId);
  }

  @Get('me')
  @Roles(UserRole.SUPER_ADMIN, UserRole.COMPANY_ADMIN, UserRole.DISPATCHER, UserRole.DRIVER, UserRole.CUSTOMER)
  @ApiOperation({ summary: 'Get current user profile' })
  getMe(@Request() req) {
    return this.usersService.findById(req.user.id);
  }

@Patch('me')
@UseGuards(JwtAuthGuard)  // ✅ Vetëm JwtAuthGuard, pa RolesGuard
@ApiOperation({ summary: 'Update current user profile' })
async updateMe(@Request() req, @Body() updateData: Partial<User>) {
  console.log('🔵 UpdateMe called by user:', req.user?.id, 'Role:', req.user?.role);
  
  const allowedUpdates: Partial<User> = {};
  if (updateData.name !== undefined) allowedUpdates.name = updateData.name;
  if (updateData.phone !== undefined) allowedUpdates.phone = updateData.phone;
  
  return this.usersService.update(
    req.user.id,
    allowedUpdates,
    req.user.organizationId,
    req.user.role,
    req.user.id
  );

}
// Në users.controller.ts
@Put('profile')
@UseGuards(JwtAuthGuard)
@ApiOperation({ summary: 'Update current user profile' })
async updateProfile(@Request() req, @Body() updateData: Partial<User>) {
  const allowedUpdates: Partial<User> = {};
  if (updateData.name !== undefined) allowedUpdates.name = updateData.name;
  if (updateData.phone !== undefined) allowedUpdates.phone = updateData.phone;
  
  return this.usersService.update(
    req.user.id,
    allowedUpdates,
    req.user.organizationId,
    req.user.role,
    req.user.id
  );
}

  @Get(':id')
  @Roles(UserRole.SUPER_ADMIN, UserRole.COMPANY_ADMIN)
  @ApiOperation({ summary: 'Get user by ID' })
  findOne(@Param('id') id: string) {
    return this.usersService.findById(id);
  }

  @Put(':id')
  @Roles(UserRole.SUPER_ADMIN, UserRole.COMPANY_ADMIN)
  @ApiOperation({ summary: 'Update user' })
  update(@Param('id') id: string, @Body() updateData: Partial<User>, @Request() req) {
    const organizationId = req.user.role === 'super_admin' ? undefined : req.user.organizationId;
    return this.usersService.update(id, updateData, organizationId, req.user.role, req.user.id);
  }

  @Delete(':id')
  @Roles(UserRole.SUPER_ADMIN, UserRole.COMPANY_ADMIN)
  @ApiOperation({ summary: 'Delete user' })
  remove(@Param('id') id: string, @Request() req) {
    const organizationId = req.user.role === 'super_admin' ? undefined : req.user.organizationId;
    return this.usersService.remove(id, organizationId, req.user.role);
  }

  @Patch(':id/status')
  @Roles(UserRole.SUPER_ADMIN, UserRole.COMPANY_ADMIN)
  @ApiOperation({ summary: 'Update user active status' })
  toggleStatus(
    @Param('id') id: string,
    @Body('isActive') isActive: boolean,
    @Request() req,
  ) {
    const organizationId = req.user.role === 'super_admin' ? undefined : req.user.organizationId;
    return this.usersService.toggleStatus(id, isActive, organizationId, req.user.role);
  }
}