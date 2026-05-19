// src/modules/auth/auth.service.ts
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ConfigService } from '@nestjs/config'; 
import * as bcrypt from 'bcrypt';
import { User } from '../users/user.entity';
import { Organization, PlanType, SubscriptionStatus } from '../../modules/organizations/organization.entity';
import { Role } from '../roles/role.entity';  
import { RegisterDto } from './dto/register.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';  // <-- Shto këtë

@Injectable()
export class AuthService {
  private blacklistedTokens: Set<string> = new Set();

  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(Organization)
    private organizationRepository: Repository<Organization>,
    @InjectRepository(Role)  
    private roleRepository: Repository<Role>,
    private jwtService: JwtService,
    private configService: ConfigService,
  ) {}

  async validateUser(email: string, password: string): Promise<any> {
    const user = await this.userRepository.findOne({
      where: { email },
      select: ['id', 'email', 'password', 'name', 'organizationId', 'isActive'],
    });

    if (!user) return null;
    if (!user.isActive) throw new UnauthorizedException('Account is deactivated');

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) return null;

    const { password: _, ...result } = user;
    return result;
  }

  async validateUserById(id: string): Promise<any> {
    const user = await this.userRepository.findOne({
      where: { id },
      select: ['id', 'email', 'name', 'organizationId', 'isActive'],
    });
    if (!user || !user.isActive) return null;
    return user;
  }

  async register(registerDto: RegisterDto): Promise<any> {
    const { email, password, name, organizationName, organizationId } = registerDto;

    const existingUser = await this.userRepository.findOne({ where: { email } });
    if (existingUser) {
      throw new UnauthorizedException('User already exists');
    }

    let finalOrganizationId = organizationId;
    let targetRole = 'customer'; 

    if (organizationName && !organizationId) {
      const newOrganization = this.organizationRepository.create({
        name: organizationName,
        email: email,
        planType: PlanType.FREE,
        subscriptionStatus: SubscriptionStatus.TRIAL,
        subscriptionEndsAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      });
      const savedOrg = await this.organizationRepository.save(newOrganization);
      finalOrganizationId = savedOrg.id;
      targetRole = 'company_admin';  
    }

    let userRole = await this.roleRepository.findOne({ where: { name: targetRole } });
    if (!userRole) {
      userRole = this.roleRepository.create({ 
        name: targetRole, 
        description: targetRole === 'company_admin' ? 'Company administrator' : 'Regular customer' 
      });
      await this.roleRepository.save(userRole);
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = this.userRepository.create({
      email,
      password: hashedPassword,
      name,
      organizationId: finalOrganizationId || undefined,
      roles: [userRole],  
    });

    const savedUser = await this.userRepository.save(newUser);

    const payload = { 
      id: savedUser.id, 
      email: savedUser.email, 
      organizationId: savedUser.organizationId,
    };
    const token = this.jwtService.sign(payload);

    const { password: _, ...result } = savedUser;
    return { user: result, token };
  }

  async login(user: any) {
    const payload = { 
      id: user.id, 
      email: user.email, 
      organizationId: user.organizationId,
    };
    
    return {
      token: this.jwtService.sign(payload),
      refreshToken: this.jwtService.sign(payload, { expiresIn: '7d' }),
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        organizationId: user.organizationId,
      },
    };
  }

  async logout(token: string): Promise<void> {
    this.blacklistedTokens.add(token);
  }

  async refreshToken(oldToken: string): Promise<any> {
    try {
      const payload = this.jwtService.verify(oldToken);
      delete payload.exp;
      delete payload.iat;
      const newToken = this.jwtService.sign(payload);
      return { token: newToken };
    } catch (error) {
      throw new UnauthorizedException('Invalid refresh token');
    }
  }

  async changePassword(userId: string, changePasswordDto: ChangePasswordDto): Promise<void> {
    const user = await this.userRepository.findOne({
      where: { id: userId },
      select: ['id', 'password'],
    });

    if (!user) throw new UnauthorizedException('User not found');

    const isPasswordValid = await bcrypt.compare(changePasswordDto.currentPassword, user.password);
    if (!isPasswordValid) throw new UnauthorizedException('Current password is incorrect');

    const hashedPassword = await bcrypt.hash(changePasswordDto.newPassword, 10);
    await this.userRepository.update(userId, { password: hashedPassword });
  }

  async forgotPassword(email: string): Promise<void> {
    const user = await this.userRepository.findOne({ where: { email } });
    if (!user) return;
  }

  async resetPassword(resetPasswordDto: ResetPasswordDto): Promise<{ message: string }> {
    try {
      const decoded = this.jwtService.verify(resetPasswordDto.token, {
        secret: this.configService.get('JWT_SECRET'),
      });
      
      const user = await this.userRepository.findOne({ where: { id: decoded.id } });
      if (!user) {
        throw new UnauthorizedException('Invalid token');
      }
      
      const hashedPassword = await bcrypt.hash(resetPasswordDto.newPassword, 10);
      await this.userRepository.update(user.id, { password: hashedPassword });
      
      return { message: 'Password reset successfully' };
    } catch (error) {
      throw new UnauthorizedException('Invalid or expired token');
    }
  }

  isTokenBlacklisted(token: string): boolean {
    return this.blacklistedTokens.has(token);
  }
}