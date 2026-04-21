import { ExtractJwt, Strategy } from 'passport-jwt'; 
import { PassportStrategy } from '@nestjs/passport'; 
import { Injectable, UnauthorizedException } from '@nestjs/common'; 
import { ConfigService } from '@nestjs/config'; 
import { AuthService } from '../auth.service'; 
 
@Injectable() 
export class JwtStrategy extends PassportStrategy(Strategy) { 
  constructor( 
    private configService: ConfigService, 
    private authService: AuthService, 
  ) { 
    if (!secretOrKey) { 
      throw new Error('JWT_SECRET is not defined'); 
    } 
    super({ 
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(), 
      ignoreExpiration: false, 
      secretOrKey, 
    }); 
  } 
 
  async validate(payload: any) { 
    const user = await this.authService.validateUserById(payload.id); 
    if (!user) { 
      throw new UnauthorizedException('User not found'); 
    } 
    return user; 
  } 
} 
