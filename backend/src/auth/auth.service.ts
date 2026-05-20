import { Injectable, UnauthorizedException, ForbiddenException, ConflictException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { User } from '../modules/users/user.entity';
import { Organization, PlanType, SubscriptionStatus } from '../modules/organizations/organization.entity';
import { Role } from '../modules/roles/role.entity';
import { RegisterDto } from './dto/register.dto';
import { CreateUserDto, CreateUserRole } from './dto/create-user.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { CreateSuperAdminDto } from './dto/create-super-admin.dto';
import { ConfigService } from '@nestjs/config';

// Interface for validated user (without password)
export interface ValidatedUser {
  id: string;
  email: string;
  name: string;
  role: string;
  organizationId?: string;
  isActive?: boolean;
}

// Interface for current authenticated user
export interface CurrentUser {
  id: string;
  email: string;
  role: string;
  organizationId?: string;
}

// Interface for login response
export interface LoginResponse {
  token: string;
  refreshToken: string;
  user: {
    id: string;
    email: string;
    name: string;
    role: string;
    organizationId?: string;
  };
}

// Interface for user response (without password)
export interface UserResponse {
  user: Omit<User, 'password'>;
  token?: string;
  message?: string;
}

// Interface for JWT payload
interface JwtPayload {
  id: string;
  email: string;
  role: string;
  organizationId?: string;
  exp?: number;
  iat?: number;
}

@Injectable()
export class AuthService {
  private blacklistedTokens: Set<string> = new Set();
  private superAdminSecretKey: string;

  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(Organization)
    private organizationRepository: Repository<Organization>,
    @InjectRepository(Role)
    private roleRepository: Repository<Role>,
    private jwtService: JwtService,
    private configService: ConfigService,
  ) {
    this.superAdminSecretKey = this.configService.get<string>('SUPER_ADMIN_SECRET_KEY') || 'your-super-secret-key-change-this';
    
    if (!this.configService.get<string>('SUPER_ADMIN_SECRET_KEY')) {
      console.warn('⚠️ SUPER_ADMIN_SECRET_KEY is not set in .env file!');
    }
  }

  async validateUser(email: string, password: string): Promise<ValidatedUser | null> {
    const user = await this.userRepository.findOne({
      where: { email },
      select: ['id', 'email', 'password', 'name', 'organizationId', 'isActive'],
      relations: ['roles'],
    });

    if (!user) return null;
    if (!user.isActive) throw new UnauthorizedException('Account is deactivated');

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) return null;

    const { password: _, ...result } = user;
    return {
      ...result,
      role: user.roles?.[0]?.name || 'customer',
    };
  }

  async validateUserById(id: string): Promise<ValidatedUser | null> {
    const user = await this.userRepository.findOne({
      where: { id },
      relations: ['roles', 'organization'],
    });
    if (!user || !user.isActive) return null;
    
    return {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.roles?.[0]?.name || 'customer',
      organizationId: user.organizationId,
    };
  }

  async register(registerDto: RegisterDto): Promise<UserResponse> {
    const { email, password, name } = registerDto;

    const existingUser = await this.userRepository.findOne({ where: { email } });
    if (existingUser) {
      throw new ConflictException('User already exists');
    }

    let customerRole = await this.roleRepository.findOne({ where: { name: 'customer' } });
    if (!customerRole) {
      customerRole = this.roleRepository.create({ 
        name: 'customer', 
        description: 'Regular customer' 
      });
      await this.roleRepository.save(customerRole);
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = this.userRepository.create({
      email,
      password: hashedPassword,
      name,
      roles: [customerRole],
    });

    const savedUser = await this.userRepository.save(newUser);

    const payload: JwtPayload = { 
      id: savedUser.id, 
      email: savedUser.email, 
      role: 'customer',
      organizationId: savedUser.organizationId,
    };
    const token = this.jwtService.sign(payload);

    const { password: _, ...result } = savedUser;
    return { user: result, token };
  }

  async createUser(createUserDto: CreateUserDto, currentUser: CurrentUser): Promise<UserResponse> {
    const { email, password, name, role, organizationName, organizationId, phone } = createUserDto;
    const currentUserRole = currentUser.role;
    const currentUserOrgId = currentUser.organizationId;

    const existingUser = await this.userRepository.findOne({ where: { email } });
    if (existingUser) {
      throw new ConflictException('User already exists');
    }

    let finalOrganizationId = organizationId;
    const targetRole = role;

    // SUPER ADMIN - Can create any role
    if (currentUserRole === 'super_admin') {
      if (role === CreateUserRole.COMPANY_ADMIN && organizationName && !organizationId) {
        const newOrganization = this.organizationRepository.create({
          name: organizationName,
          email: email,
          planType: PlanType.FREE,
          subscriptionStatus: SubscriptionStatus.TRIAL,
          subscriptionEndsAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        });
        const savedOrg = await this.organizationRepository.save(newOrganization);
        finalOrganizationId = savedOrg.id;
      }
    }
    // COMPANY ADMIN - Can only create customer, driver, dispatcher
    else if (currentUserRole === 'company_admin') {
      if (!currentUserOrgId) {
        throw new ForbiddenException('Company admin must have an organization');
      }
      
      if (role === CreateUserRole.COMPANY_ADMIN) {
        throw new ForbiddenException('Company admin cannot create another company admin');
      }
      
      finalOrganizationId = currentUserOrgId;
    }
    // OTHER ROLES - Not allowed to create users
    else {
      throw new ForbiddenException('You do not have permission to create users');
    }

    let userRole = await this.roleRepository.findOne({ where: { name: targetRole } });
    if (!userRole) {
      userRole = this.roleRepository.create({ name: targetRole });
      await this.roleRepository.save(userRole);
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = this.userRepository.create({
      email,
      password: hashedPassword,
      name,
      phone,
      organizationId: finalOrganizationId,
      roles: [userRole],
      createdByOrganizationId: currentUserOrgId,
      lastUpdatedBy: currentUser.id,
    });

    const savedUser = await this.userRepository.save(newUser);

    const { password: _, ...result } = savedUser;
    return { user: result, message: 'User created successfully' };
  }

  async createSuperAdmin(
    secretKey: string, 
    createSuperAdminDto: CreateSuperAdminDto,
    currentUser: CurrentUser,
      ): Promise<UserResponse> {
        if (currentUser.role !== 'super_admin') {
          throw new ForbiddenException('Only super admin can create new super admin');
        }

        if (secretKey !== this.superAdminSecretKey) {
          throw new UnauthorizedException('Invalid secret key');
        }

        const { email, password, name, phone } = createSuperAdminDto;

        const existingUser = await this.userRepository.findOne({ where: { email } });
        if (existingUser) {
          throw new ConflictException('Super admin already exists');
        }

        let superAdminRole = await this.roleRepository.findOne({ where: { name: 'super_admin' } });
        if (!superAdminRole) {
          superAdminRole = this.roleRepository.create({ 
            name: 'super_admin', 
            description: 'Full system access' 
          });
          await this.roleRepository.save(superAdminRole);
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const newUser = this.userRepository.create({
          email,
          password: hashedPassword,
          name,
          phone,
          roles: [superAdminRole],
          createdByOrganizationId: currentUser.organizationId,
          lastUpdatedBy: currentUser.id,
        });

        const savedUser = await this.userRepository.save(newUser);

        const { password: _, ...result } = savedUser;
        return { user: result, message: 'Super admin created successfully' };
      }

  async login(user: ValidatedUser): Promise<LoginResponse> {
    const payload: JwtPayload = { 
      id: user.id, 
      email: user.email, 
      role: user.role,
      organizationId: user.organizationId,
    };
    
    return {
      token: this.jwtService.sign(payload),
      refreshToken: this.jwtService.sign(payload, { expiresIn: '7d' }),
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        organizationId: user.organizationId,
      },
    };
  }

  async logout(token: string): Promise<void> {
    this.blacklistedTokens.add(token);
  }

  async refreshToken(oldToken: string): Promise<{ token: string }> {
    try {
      const payload = this.jwtService.verify(oldToken) as JwtPayload;
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
    // Logic for sending reset email would go here
  }

  isTokenBlacklisted(token: string): boolean {
    return this.blacklistedTokens.has(token);
  }
}