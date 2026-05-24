// src/common/interceptors/audit.interceptor.ts
import { Injectable, NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AuditLog } from '../../modules/audit/audit-log.entity';

@Injectable()
export class AuditInterceptor implements NestInterceptor {
  constructor(
    @InjectRepository(AuditLog)
    private auditRepository: Repository<AuditLog>,
  ) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const req = context.switchToHttp().getRequest();
    const startTime = Date.now();
    
    // ✅ Përdor VETËM fushat që ekzistojnë në tabelë
    const auditData: any = {
      organizationId: req.user?.organizationId,
      userId: req.user?.id,
      action: `${req.method} ${context.getClass().name}.${context.getHandler().name}`,
      entityType: context.getClass().name.replace('Controller', '').toLowerCase(),
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
    };

    return next.handle().pipe(
      tap({
        next: (data) => {
          auditData.newValues = { response: 'success', data: data?.id || data };
          this.auditRepository.save(auditData).catch(err => console.error('Audit save error:', err));
        },
        error: (err) => {
          auditData.oldValues = { error: err.message };
          this.auditRepository.save(auditData).catch(e => console.error('Audit save error:', e));
        },
      }),
    );
  }
}