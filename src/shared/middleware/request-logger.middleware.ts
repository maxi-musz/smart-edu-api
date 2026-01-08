import { Injectable, NestMiddleware, Logger } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import * as colors from 'colors';

@Injectable()
export class RequestLoggerMiddleware implements NestMiddleware {
  private logger = new Logger('HTTP');

  use(req: Request, res: Response, next: NextFunction) {
    const { method, originalUrl, body, query, params, headers } = req;
    const userAgent = headers['user-agent'] || '';

    // Log the incoming request
    this.logger.log(colors.cyan('========================================'));
    this.logger.log(colors.cyan(`📥 ${method} ${originalUrl}`));
    this.logger.log(colors.yellow(`🔗 Full URL: ${req.protocol}://${req.get('host')}${originalUrl}`));
    
    if (params && Object.keys(params).length > 0) {
      this.logger.log(colors.magenta(`📋 Params: ${JSON.stringify(params)}`));
    }
    
    if (query && Object.keys(query).length > 0) {
      this.logger.log(colors.magenta(`🔍 Query: ${JSON.stringify(query)}`));
    }
    
    if (body && Object.keys(body).length > 0) {
      this.logger.log(colors.green(`📦 Body: ${JSON.stringify(body, null, 2)}`));
    }
    this.logger.log(colors.cyan('========================================'));

    // Log response when it finishes
    const startTime = Date.now();
    res.on('finish', () => {
      const { statusCode } = res;
      const duration = Date.now() - startTime;
      const statusColor = statusCode >= 400 ? colors.red : colors.green;
      this.logger.log(statusColor(`✅ ${method} ${originalUrl} - ${statusCode} - ${duration}ms`));
    });

    next();
  }
}

