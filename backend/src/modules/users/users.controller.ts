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
  @ApiResponse({ status: 200, description: 'Users retrieved successfully' })
  findAll(@Request() req) {
    const organizationId = req.user.role === 'super_admin' ? undefined : req.user.organizationId;
    return this.usersService.findAll(organizationId);
  }

  @Get('me')
  @ApiOperation({ summary: 'Get current user profile' })
  @ApiResponse({ status: 200, description: 'User profile retrieved successfully' })
  getMe(@Request() req) {
    return this.usersService.findById(req.user.id);
  }

  // // ✅ Shto PATCH /users/me për të përditësuar profilin e përdoruesit aktual
  // @Patch('me')
  // @ApiOperation({ summary: 'Update current user profile' })
  // @ApiResponse({ status: 200, description: 'Profile updated successfully' })
  // @ApiResponse({ status: 404, description: 'User not found' })
  // async updateMe(@Request() req, @Body() updateData: Partial<User>) {
  //   // Lejo vetëm fushat që mund të përditësohen nga përdoruesi
  //   const allowedUpdates: Partial<User> = {};
    
  //   if (updateData.name !== undefined) allowedUpdates.name = updateData.name;
  //   if (updateData.phone !== undefined) allowedUpdates.phone = updateData.phone;
  //   // Mos lejo ndryshimin e role, organizationId, etj.
    
  //   const updatedUser = await this.usersService.update(
  //     req.user.id, 
  //     allowedUpdates, 
  //     req.user.organizationId, 
  //     req.user.role,
  //     req.user.id
  //   );
    
  //   // Return user without password
  //   const { password, ...result } = updatedUser;
  //   return result;
  // }

  @Get(':id')
  @Roles(UserRole.SUPER_ADMIN, UserRole.COMPANY_ADMIN)
  @ApiOperation({ summary: 'Get user by ID' })
  @ApiResponse({ status: 200, description: 'User retrieved successfully' })
  @ApiResponse({ status: 404, description: 'User not found' })
  findOne(@Param('id') id: string) {
    return this.usersService.findById(id);
  }

  @Put(':id')
  @Roles(UserRole.SUPER_ADMIN, UserRole.COMPANY_ADMIN)
  @ApiOperation({ summary: 'Update user' })
  @ApiResponse({ status: 200, description: 'User updated successfully' })
  update(@Param('id') id: string, @Body() updateData: Partial<User>, @Request() req) {
    const organizationId = req.user.role === 'super_admin' ? undefined : req.user.organizationId;
    return this.usersService.update(id, updateData, organizationId, req.user.role, req.user.id);
  }

  @Delete(':id')
  @Roles(UserRole.SUPER_ADMIN, UserRole.COMPANY_ADMIN)
  @ApiOperation({ summary: 'Delete user' })
  @ApiResponse({ status: 200, description: 'User deleted successfully' })
  remove(@Param('id') id: string, @Request() req) {
    const organizationId = req.user.role === 'super_admin' ? undefined : req.user.organizationId;
    return this.usersService.remove(id, organizationId, req.user.role);
  }

  @Patch(':id/status')
  @Roles(UserRole.SUPER_ADMIN, UserRole.COMPANY_ADMIN)
  @ApiOperation({ summary: 'Update user active status' })
  @ApiResponse({ status: 200, description: 'Status updated successfully' })
  toggleStatus(
    @Param('id') id: string,
    @Body('isActive') isActive: boolean,
    @Request() req,
  ) {
    const organizationId = req.user.role === 'super_admin' ? undefined : req.user.organizationId;
    return this.usersService.toggleStatus(id, isActive, organizationId, req.user.role);
  }

  // Në users.controller.ts, shto:
  @Patch('me')
  @ApiOperation({ summary: 'Update current user profile' })
  async updateMe(@Request() req, @Body() updateData: Partial<User>) {
    const allowedUpdates: Partial<User> = {};
    if (updateData.name !== undefined) allowedUpdates.name = updateData.name;
    if (updateData.phone !== undefined) allowedUpdates.phone = updateData.phone;
    if (updateData.organizationId !== undefined) allowedUpdates.organizationId = updateData.organizationId;

    return this.usersService.update(req.user.id, allowedUpdates);
  }
}

