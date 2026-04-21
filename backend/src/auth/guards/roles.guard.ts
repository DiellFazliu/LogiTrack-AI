import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common'; 
import { Reflector } from '@nestjs/core'; 
import { ROLES_KEY } from '../decorators/roles.decorator'; 
import { IS_PUBLIC_KEY } from '../decorators/public.decorator'; 
import { UserRole } from '../../common/enums/roles.enum'; 
 
@Injectable() 
export class RolesGuard implements CanActivate { 
  constructor(private reflector: Reflector) {} 
 
  canActivate(context: ExecutionContext): boolean { 
      context.getHandler(), 
      context.getClass(), 
    ]); 
    if (isPublic) return true; 
 
      context.getHandler(), 
      context.getClass(), 
    ]); 
    if (!requiredRoles) return true; 
 
    const { user } = context.switchToHttp().getRequest(); 
    if (!user) return false; 
 
    return requiredRoles.includes(user.role); 
  } 
} 
