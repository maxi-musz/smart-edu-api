import { Injectable, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import * as colors from 'colors';

/**
 * Unified JWT Guard that accepts both school users (jwt1 strategy) and library users (library-jwt strategy)
 * 
 * This guard attempts authentication in the following order:
 * 1. Try school JWT (jwt1 strategy)
 * 2. If that fails, try library JWT (library-jwt strategy)
 * 3. If both fail, throw UnauthorizedException
 * 
 * The authenticated user payload will be attached to request.user
 */
@Injectable()
export class UnifiedJwtGuard extends AuthGuard(['jwt1', 'library-jwt']) {
  constructor() {
    super();
  }

  canActivate(context: ExecutionContext) {
    const request = context.switchToHttp().getRequest();
    const authHeader = request.headers.authorization;

    if (!authHeader) {
      console.log(colors.red('Unified JWT Guard - No authorization header found'));
      throw new UnauthorizedException('No authorization header found');
    }

    if (!authHeader.startsWith('Bearer ')) {
      console.log(colors.red('Unified JWT Guard - Invalid authorization header format'));
      throw new UnauthorizedException('Invalid authorization header format');
    }

    return super.canActivate(context);
  }

  handleRequest(err: any, user: any, info: any, context: ExecutionContext) {
    if (err || !user) {
      console.log(colors.red(`Unified JWT Guard - Authentication failed: ${info?.message || 'Unknown error'}`));
      throw err || new UnauthorizedException('Invalid or expired token');
    }

    // Log successful authentication
    const userType = user.platform_id ? 'library_user' : 'school_user';
    console.log(colors.green(`Unified JWT Guard - Authenticated ${userType}: ${user.sub}`));

    return user;
  }
}
