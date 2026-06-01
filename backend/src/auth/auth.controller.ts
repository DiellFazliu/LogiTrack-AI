// src/modules/auth/auth.controller.ts
import { Controller, Post, Body, UseGuards, Request, HttpCode, HttpStatus, Get, Patch } from '@nestjs/common';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { CreateUserDto } from './dto/create-user.dto';
import { CreateSuperAdminDto } from './dto/create-super-admin.dto';
import { LocalAuthGuard } from './guards/local-auth.guard';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { RolesGuard } from './guards/roles.guard';
import { Public } from './decorators/public.decorator';
import { Roles } from './decorators/roles.decorator';
import { UserRole } from '../common/enums/roles.enum';
import { ApiTags, ApiOperation, ApiResponse, ApiBody, ApiBearerAuth, ApiOkResponse, ApiCreatedResponse } from '@nestjs/swagger';
import { EmailService } from '../jobs/email/email.service';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(
    private authService: AuthService, 
    private emailService: EmailService
  ) {}

  @Public()
  @Post('register')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Register as customer', description: 'Public registration - creates a customer account' })
  @ApiCreatedResponse({ description: 'Customer registered successfully' })
  @ApiBody({ type: RegisterDto })
  async register(@Body() registerDto: RegisterDto) {
    // ✅ Regjistro user-in
    const result = await this.authService.register(registerDto);
    
    // ✅ Dërgo email mirëseardhjeje (në background)
    try {
      await this.emailService.sendWelcomeEmail(
        registerDto.email,
        registerDto.name,
        result.user.id
      );
      console.log(`📧 Welcome email queued for ${registerDto.email}`);
    } catch (err) {
      // ✅ Rregullimi: Përdor 'err' dhe 'instanceof Error'
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      console.error(`❌ Failed to queue welcome email: ${errorMessage}`);
    }
    
    return result;
  }

  @Public()
  @Post('login')
  @UseGuards(LocalAuthGuard)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Login user' })
  @ApiOkResponse({ description: 'Login successful' })
  @ApiBody({ type: LoginDto })
  async login(@Request() req) {
    return this.authService.login(req.user);
  }

  @Public()
  @Post('test-email')
  async testEmail(@Body() body: { to: string }) {
    try {
      await this.emailService.sendEmail(
        body.to || 'dielli898@gmail.com',
        'Test Email from LogiTrack-AI',
        'This is a test email to verify SMTP configuration!'
      );
      return { message: 'Test email queued successfully' };
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      return { message: 'Failed to queue test email', error: errorMessage };
    }
  }

  @Post('create-super-admin')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.SUPER_ADMIN)
  @HttpCode(HttpStatus.CREATED)
  @ApiBearerAuth()
  @ApiOperation({ 
    summary: 'Create super admin (requires super admin privileges + secret key)',
    description: 'Only existing super admin can create new super admin with valid secret key'
  })
  @ApiCreatedResponse({ description: 'Super admin created successfully' })
  @ApiBody({ type: CreateSuperAdminDto })
  async createSuperAdmin(
    @Body() createSuperAdminDto: CreateSuperAdminDto,
    @Request() req,
  ) {
    return this.authService.createSuperAdmin(
      createSuperAdminDto.secretKey,
      createSuperAdminDto,
      req.user,
    );
  }

  @Post('users')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.SUPER_ADMIN, UserRole.COMPANY_ADMIN, UserRole.DISPATCHER)
  @HttpCode(HttpStatus.CREATED)
  @ApiBearerAuth()
  @ApiOperation({ 
    summary: 'Create user (Super Admin or Company Admin only)',
    description: 'Super Admin can create: customer, driver, dispatcher, company_admin. Company Admin can create: customer, driver, dispatcher'
  })
  @ApiCreatedResponse({ description: 'User created successfully' })
  @ApiBody({ type: CreateUserDto })
  async createUser(@Body() createUserDto: CreateUserDto, @Request() req) {
    const result = await this.authService.createUser(createUserDto, req.user);
    
    // ✅ Dërgo email mirëseardhjeje për përdoruesin e ri
    if (result.user && result.user.email) {
      try {
        await this.emailService.sendWelcomeEmail(
          result.user.email,
          result.user.name,
          result.user.id,
          createUserDto.password
        );
        console.log(`📧 Welcome email queued for ${result.user.email}`);
      } catch (err) {
        // ✅ Rregullimi: Përdor 'err' dhe 'instanceof Error'
        const errorMessage = err instanceof Error ? err.message : 'Unknown error';
        console.error(`❌ Failed to queue welcome email: ${errorMessage}`);
      }
    }
    
    return result;
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get current user profile' })
  @ApiOkResponse({ description: 'Profile retrieved successfully' })
  async getProfile(@Request() req) {
    return this.authService.getProfile(req.user.id);
  }

  @Patch('me')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update current user profile' })
  @ApiOkResponse({ description: 'Profile updated successfully' })
  async updateProfile(@Request() req, @Body() updateData: { name?: string; phone?: string; organizationId?: string }) {
    return this.authService.updateProfile(req.user.id, updateData);
  }

  @Post('sync-drivers')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.SUPER_ADMIN)
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Sync existing driver users to drivers table' })
  async syncDrivers() {
    const result = await this.authService.syncExistingDrivers();
    return { 
      message: 'Sync completed', 
      created: result.created, 
      skipped: result.skipped 
    };
  }

  @Post('logout')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Logout user' })
  async logout(@Request() req) {
    const token = req.headers.authorization?.split(' ')[1];
    await this.authService.logout(token);
    return { message: 'Logged out successfully' };
  }

  @Public()
  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Refresh JWT token' })
  async refresh(@Body('refreshToken') refreshToken: string) {
    return this.authService.refreshToken(refreshToken);
  }

  @Post('change-password')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Change user password' })
  async changePassword(@Request() req, @Body() changePasswordDto: ChangePasswordDto) {
    await this.authService.changePassword(req.user.id, changePasswordDto);
    return { message: 'Password changed successfully' };
  }

  @Public()
  @Post('forgot-password')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Request password reset' })
  async forgotPassword(@Body() forgotPasswordDto: ForgotPasswordDto) {
    await this.authService.forgotPassword(forgotPasswordDto.email);
    return { message: 'If the email exists, a reset link has been sent' };
  }
}