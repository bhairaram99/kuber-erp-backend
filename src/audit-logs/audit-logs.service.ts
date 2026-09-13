import { Injectable } from '@nestjs/common';
import { AuditLogsRepository } from './audit-logs.repository';
import { PaginationQueryDto } from '../common/dto/pagination-query.dto';

@Injectable()
export class AuditLogsService {
  constructor(private readonly auditLogsRepository: AuditLogsRepository) {}

  private sanitize(obj: any): any {
    if (!obj || typeof obj !== 'object') return obj;
    const sanitized = { ...obj };
    const sensitiveKeys = ['password', 'passwordHash', 'secret', 'token', 'jwt'];
    for (const key of Object.keys(sanitized)) {
      if (sensitiveKeys.some((s) => key.toLowerCase().includes(s))) {
        sanitized[key] = '***REDACTED***';
      }
    }
    return sanitized;
  }

  async log(data: {
    userId?: string;
    action: string;
    module: string;
    entityType?: string;
    entityId?: string;
    previousData?: any;
    newData?: any;
    metadata?: Record<string, any>;
  }) {
    return this.auditLogsRepository.create({
      userId: data.userId || null,
      action: data.action,
      module: data.module,
      entityType: data.entityType || '',
      entityId: data.entityId || '',
      previousData: this.sanitize(data.previousData),
      newData: this.sanitize(data.newData),
      metadata: data.metadata || {},
    });
  }

  async findPaginated(
    query: PaginationQueryDto,
    module?: string,
    action?: string,
    userId?: string,
  ) {
    const page = Number(query.page) || 1;
    const limit = Number(query.limit) || 20;
    const skip = (page - 1) * limit;

    const filter: any = {};
    if (module) filter.module = module;
    if (action) filter.action = action;
    if (userId) filter.userId = userId;

    if (query.from || query.to) {
      filter.createdAt = {};
      if (query.from) filter.createdAt.$gte = new Date(query.from);
      if (query.to) filter.createdAt.$lte = new Date(query.to);
    }

    const { items, total } = await this.auditLogsRepository.findPaginated(
      filter,
      skip,
      limit,
      query.sortBy || 'createdAt',
      query.sortOrder || 'desc',
    );

    return {
      items,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit) || 1,
      },
    };
  }
}
