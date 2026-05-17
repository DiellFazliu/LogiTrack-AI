import { Injectable, NestMiddleware, UnauthorizedException } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { JsonWebTokenError, TokenExpiredError } from 'jsonwebtoken';

@Injectable()
export class AuthMiddleware implements NestMiddleware {
  constructor(
    private jwtService: JwtService,
    private configService: ConfigService,
  ) {}

  use(req: Request, _res: Response, next: NextFunction) {
    
    const url = req.originalUrl;
    console.log('AuthMiddleware - URL:', url);

    // Lista e rrugëve publike që nuk kërkojnë autentikim
    const publicPaths = [
      '/auth/register',
      '/auth/login',
      '/api-docs',
      '/api-docs-json',
      '/shipments/track',
    ];

    // Kontrollo nëse rruga aktuale është publike
    const isPublic = publicPaths.some(path => req.originalUrl.includes(path));
    
       // Debug: shiko a është publike
    console.log('Is public?', isPublic);

    if (isPublic) {
      console.log('Skipping auth for:', req.url);
      return next();
    }

    // Merr token-in nga header
    const authHeader = req.headers.authorization;
    
    if (!authHeader) {
      throw new UnauthorizedException('Token not provided');
    }

    // Formati: "Bearer <token>"
    const token = authHeader.split(' ')[1];
    
    if (!token) {
      throw new UnauthorizedException('Invalid token format. Use: Bearer <token>');
    }

    try {
      // Verifiko token-in
      const decoded = this.jwtService.verify(token, {
        secret: this.configService.get('JWT_SECRET'),
      });
      
      // Vendos user-in e dekoduar në request
      req['user'] = decoded;
      next();
    } catch (error) {
      // Kontrollo nëse error është instance e TokenExpiredError
      if (error instanceof TokenExpiredError) {
        throw new UnauthorizedException('Token has expired');
      }
      // Kontrollo nëse error është instance e JsonWebTokenError
      if (error instanceof JsonWebTokenError) {
        throw new UnauthorizedException('Invalid token');
      }
      // Për çdo gabim tjetër
      throw new UnauthorizedException('Authentication failed');
    }
  }
}