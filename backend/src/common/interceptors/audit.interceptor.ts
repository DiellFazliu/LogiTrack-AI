import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  SetMetadata,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap, catchError } from 'rxjs/operators';
import { Reflector } from '@nestjs/core';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Request, Response } from 'express';
import { AuditLog } from '../../modules/audit/audit-log.entity';

export const SKIP_AUDIT_KEY = 'skipAudit';
export const SkipAudit = () => SetMetadata(SKIP_AUDIT_KEY, true);

@Injectable()
export class AuditInterceptor implements NestInterceptor {
  constructor(
    @InjectRepository(AuditLog)
    private auditRepository: Repository<AuditLog>,
    private reflector: Reflector,
  ) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const req = context.switchToHttp().getRequest<Request>();
    const res = context.switchToHttp().getResponse<Response>();
    const startTime = Date.now();

    // Kontrollo nëse duhet të skip-ojmë audit-in
    const skipAudit = this.reflector.getAllAndOverride<boolean>(
      SKIP_AUDIT_KEY,
      [context.getHandler(), context.getClass()],
    );
    if (skipAudit) {
      return next.handle();
    }

    // Mos regjistro për GET kërkesat (opsionale)
    const method = req.method;
    const url = req.url;
    
    // GET kërkesat nuk regjistrohen (për të reduktuar volumin e të dhënave)
    if (method === 'GET') {
      return next.handle();
    }

    // Regjistro vetëm për endpoint-et e rëndësishme
    const excludedPaths = ['/health', '/metrics', '/swagger', '/api-docs'];
    if (excludedPaths.some(path => url.includes(path))) {
      return next.handle();
    }

    // Merr të dhënat e përdoruesit
    const user = (req as any).user;
    const userId = user?.id;
    const organizationId = user?.organizationId;

    // Merr IP adresën
    const ipAddress =
      req.ip ||
      req.connection?.remoteAddress ||
      (req.headers['x-forwarded-for'] as string)?.split(',')[0];

    const userAgent = req.headers['user-agent'];

    // Ruaj të dhënat e vjetra (nëse është PUT/PATCH)
    let oldValues: any = null;
    if (method === 'PUT' || method === 'PATCH') {
      oldValues = { ...req.body };
    }

    return next.handle().pipe(
      tap(async (responseBody) => {
        const responseTime = Date.now() - startTime;
        const statusCode = res.statusCode;

        // Krijo audit log
        const auditLog = this.auditRepository.create({
          userId,
          organizationId,
          action: `${method} ${url}`,
          method,
          url,
          entityType: this.extractEntityType(url),
          entityId: this.extractEntityId(url, req.params),
          oldValues: oldValues,
          newValues: method === 'POST' ? req.body : responseBody,
          ipAddress,
          userAgent,
          statusCode,
          responseTimeMs: responseTime,
        });

        await this.auditRepository.save(auditLog);
      }),
      catchError(async (error) => {
        const responseTime = Date.now() - startTime;
        const statusCode = error.status || 500;

        const auditLog = this.auditRepository.create({
          userId,
          organizationId,
          action: `${method} ${url}`,
          method,
          url,
          entityType: this.extractEntityType(url),
          entityId: this.extractEntityId(url, req.params),
          oldValues: oldValues,
          newValues: req.body,
          ipAddress,
          userAgent,
          statusCode,
          responseTimeMs: responseTime,
          errorMessage: error.message,
        });

        await this.auditRepository.save(auditLog);
        throw error;
      }),
    );
  }

  private extractEntityType(url: string): string {
    const parts = url.split('/').filter(p => p && !p.includes('?'));
    if (parts.length > 0) {
      let entity = parts[0];
      if (entity.endsWith('s')) {
        entity = entity.slice(0, -1);
      }
      return entity;
    }
    return 'unknown';
  }

  private extractEntityId(url: string, params: any): string | null {
    // Kontrollo nëse ka ID në params
    if (params.id) return params.id;
    if (params.shipmentId) return params.shipmentId;
    if (params.userId) return params.userId;
    if (params.organizationId) return params.organizationId;
    if (params.driverId) return params.driverId;
    if (params.productId) return params.productId;
    if (params.warehouseId) return params.warehouseId;

    // Nxjerr ID nga URL
    const parts = url.split('/').filter(p => p && !p.includes('?'));
    for (let i = 0; i < parts.length; i++) {
      if (parts[i].match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i)) {
        return parts[i];
      }
    }
    return null;
  }
}