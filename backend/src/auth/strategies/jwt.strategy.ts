import { ExtractJwt, Strategy } from 'passport-jwt';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AuthService } from '../auth.service';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    
    private authService: AuthService,
    configService: ConfigService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.get<string>('JWT_SECRET')!,
    });
  }

  async validate(payload: any) {
    const user = await this.authService.validateUserById(payload.id);
    if (!user) {
      throw new UnauthorizedException('User not found');
    }
    return {
     id: user.id,
     email: user.email,
     name: user.name,
     role: user.role,
     organizationId: user.organizationId,  
    };
  }
}