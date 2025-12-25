import { Injectable, CanActivate, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { Socket } from 'socket.io';
import * as colors from 'colors';

/**
 * JWT Authentication Guard for Socket.IO connections
 * Validates JWT token from socket handshake auth
 */
@Injectable()
export class SocketJwtGuard implements CanActivate {
  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    try {
      const client: Socket = context.switchToWs().getClient();
      
      // Extract token from handshake auth
      const token = client.handshake.auth?.token || 
                   client.handshake.headers?.authorization?.replace('Bearer ', '');
      
      if (!token) {
        this.logger('SocketJwtGuard - No token provided');
        throw new UnauthorizedException('Authentication token required');
      }

      // Verify and decode token
      const secret = this.configService.get<string>('JWT_SECRET');
      const payload = await this.jwtService.verifyAsync(token, { secret });

      if (!payload) {
        this.logger('SocketJwtGuard - Invalid token payload');
        throw new UnauthorizedException('Invalid token');
      }

      // Log the actual payload for debugging
      // this.logger(`SocketJwtGuard - Token payload received: ${JSON.stringify(payload, null, 2)}`);
      // this.logger(`SocketJwtGuard - Payload keys: ${Object.keys(payload).join(', ')}`);

      // Validate payload structure - only require sub and email
      // school_id can be fetched from database if not in token
      const missingFields: string[] = [];
      if (!payload.sub) missingFields.push('sub');
      if (!payload.email) missingFields.push('email');

      if (missingFields.length > 0) {
        this.logger(`SocketJwtGuard - Invalid payload structure. Missing fields: ${missingFields.join(', ')}`);
        this.logger(`SocketJwtGuard - Available fields: ${Object.keys(payload).join(', ')}`);
        throw new UnauthorizedException(`Invalid token structure. Missing required fields: ${missingFields.join(', ')}`);
      }

      // Log if school_id is missing (we'll fetch it from DB or use default for library users)
      if (!payload.school_id) {
        if (payload.platform_id) {
          this.logger(`SocketJwtGuard - Library user detected (platform_id: ${payload.platform_id}), will use default library school`);
        } else {
          this.logger(`SocketJwtGuard - school_id not in token, will fetch from database`);
        }
      }

      // Check token expiration
      const now = Math.floor(Date.now() / 1000);
      if (payload.exp && payload.exp < now) {
        this.logger('SocketJwtGuard - Token expired');
        throw new UnauthorizedException('Token has expired');
      }

      // Attach user data to socket for later use
      client.data.user = payload;
      client.data.userId = payload.sub;
      client.data.schoolId = payload.school_id;

      return true;
    } catch (error) {
      this.logger(`SocketJwtGuard - Authentication failed: ${error.message}`);
      throw new UnauthorizedException(`Authentication failed: ${error.message}`);
    }
  }

  private logger(message: string) {
    console.log(colors.yellow(`[${new Date().toISOString()}] ${message}`));
  }
}

