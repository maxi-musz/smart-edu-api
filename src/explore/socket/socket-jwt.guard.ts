import { Injectable, CanActivate, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { Socket } from 'socket.io';
import * as colors from 'colors';

/**
 * JWT Authentication Guard for Socket.IO connections in Explore Chat
 * Validates JWT token from socket handshake auth
 */
@Injectable()
export class ExploreChatSocketJwtGuard implements CanActivate {
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
        this.logger('ExploreChatSocketJwtGuard - No token provided');
        throw new UnauthorizedException('Authentication token required');
      }

      // Verify and decode token
      const secret = this.configService.get<string>('JWT_SECRET');
      const payload = await this.jwtService.verifyAsync(token, { secret });

      if (!payload) {
        this.logger('ExploreChatSocketJwtGuard - Invalid token payload');
        throw new UnauthorizedException('Invalid token');
      }

      // Validate payload structure - require sub and email
      const missingFields: string[] = [];
      if (!payload.sub) missingFields.push('sub');
      if (!payload.email) missingFields.push('email');

      if (missingFields.length > 0) {
        this.logger(`ExploreChatSocketJwtGuard - Invalid payload structure. Missing fields: ${missingFields.join(', ')}`);
        throw new UnauthorizedException(`Invalid token structure. Missing required fields: ${missingFields.join(', ')}`);
      }

      // Check token expiration
      const now = Math.floor(Date.now() / 1000);
      if (payload.exp && payload.exp < now) {
        this.logger('ExploreChatSocketJwtGuard - Token expired');
        throw new UnauthorizedException('Token has expired');
      }

      // Attach user data to socket for later use
      client.data.user = payload;
      client.data.userId = payload.sub;
      client.data.schoolId = payload.school_id;

      return true;
    } catch (error) {
      this.logger(`ExploreChatSocketJwtGuard - Authentication failed: ${error.message}`);
      throw new UnauthorizedException(`Authentication failed: ${error.message}`);
    }
  }

  private logger(message: string) {
    console.log(colors.yellow(`[${new Date().toISOString()}] ${message}`));
  }
}
