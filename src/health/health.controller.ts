import { Controller, Get, HttpStatus, Res } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { InjectConnection } from '@nestjs/mongoose';
import { Connection } from 'mongoose';
import { ConfigService } from '@nestjs/config';
import { Response } from 'express';

@ApiTags('Health')
@Controller()
export class HealthController {
  constructor(
    @InjectConnection() private readonly connection: Connection,
    private readonly configService: ConfigService,
  ) {}

  @Get(['', '/'])
  @ApiOperation({ summary: 'Root service ping' })
  getRoot() {
    return {
      service: 'Wood Business ERP API',
      status: 'online',
      version: '1.0.0',
      documentation: '/api/docs',
      health: '/api/v1/health',
    };
  }

  @Get(['health', 'api/v1/health'])
  @ApiOperation({ summary: 'Service & MongoDB Health Check' })
  @ApiResponse({ status: 200, description: 'Service and database are healthy' })
  @ApiResponse({ status: 503, description: 'Database disconnected or unhealthy' })
  async check(@Res() res: Response) {
    const isDbConnected = this.connection.readyState === 1;

    const dbStatusMap: Record<number, string> = {
      0: 'disconnected',
      1: 'connected',
      2: 'connecting',
      3: 'disconnecting',
    };

    const healthData = {
      status: isDbConnected ? 'healthy' : 'unhealthy',
      service: 'wood-business-erp-backend',
      timestamp: new Date().toISOString(),
      uptimeSeconds: Math.floor(process.uptime()),
      environment: this.configService.get<string>('nodeEnv') || 'development',
      database: {
        status: dbStatusMap[this.connection.readyState] || 'unknown',
        readyState: this.connection.readyState,
      },
      memory: {
        rssMb: Math.round(process.memoryUsage().rss / (1024 * 1024)),
        heapUsedMb: Math.round(process.memoryUsage().heapUsed / (1024 * 1024)),
      },
    };

    const statusCode = isDbConnected ? HttpStatus.OK : HttpStatus.SERVICE_UNAVAILABLE;

    return res.status(statusCode).json({
      success: isDbConnected,
      ...healthData,
    });
  }
}
