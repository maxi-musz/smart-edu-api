import { Injectable, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy, ExtractJwt } from 'passport-jwt';
import { AuthGuard } from '@nestjs/passport';
import * as colors from 'colors';

/**
 * Universal JWT Strategy that accepts both school and library tokens
 * School tokens have: sub, email, school_id
 * Library tokens have: sub, email, platform_id
 */
@Injectable()
export class UniversalJwtStrategy extends PassportStrategy(Strategy, 'universal-jwt') {
  constructor(config: ConfigService) {
    const secret = config.get('JWT_SECRET');
    
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      secretOrKey: secret,
      ignoreExpiration: false,
    });
  }

  async validate(payload: any) {
    if (!payload) {
      console.log(colors.red('Universal JWT Strategy - No payload found'));
      throw new UnauthorizedException('Invalid token');
    }

    // Accept either school_id (school users) or platform_id (library users)
    const hasSchoolId = payload.sub && payload.email && payload.school_id;
    const hasPlatformId = payload.sub && payload.email && payload.platform_id;

    if (!hasSchoolId && !hasPlatformId) {
      console.log(colors.red('Universal JWT Strategy - Invalid payload structure'));
      console.log(colors.yellow(`Available fields: ${Object.keys(payload).join(', ')}`));
      throw new UnauthorizedException('Invalid token structure');
    }

    // Check token expiration
    const now = Math.floor(Date.now() / 1000);
    if (payload.exp && payload.exp < now) {
      console.log(colors.red('Universal JWT Strategy - Token expired'));
      throw new UnauthorizedException('Token has expired');
    }

    return payload;
  }
}

@Injectable()
export class UniversalJwtGuard extends AuthGuard('universal-jwt') {
  constructor() {
    super();
  }

  canActivate(context: ExecutionContext) {
    const request = context.switchToHttp().getRequest();
    const authHeader = request.headers.authorization;
    
    if (!authHeader) {
      console.log(colors.red('Universal JWT Guard - No authorization header found'));
      return false;
    }

    if (!authHeader.startsWith('Bearer ')) {
      console.log(colors.red('Universal JWT Guard - Invalid authorization header format'));
      return false;
    }

    return super.canActivate(context);
  }
}
