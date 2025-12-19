import { Injectable, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy, ExtractJwt } from 'passport-jwt';
import { AuthGuard } from '@nestjs/passport';
import * as colors from 'colors';

@Injectable()
export class LibraryJwtStrategy extends PassportStrategy(Strategy, 'library-jwt') {
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
      console.log(colors.red('Library JWT Strategy - No payload found'));
      throw new UnauthorizedException('Invalid token');
    }

    if (!payload.sub || !payload.email || !payload.platform_id) {
      console.log(colors.red('Library JWT Strategy - Invalid payload structure'));
      throw new UnauthorizedException('Invalid token structure');
    }

    // Check token expiration
    const now = Math.floor(Date.now() / 1000);
    if (payload.exp && payload.exp < now) {
      console.log(colors.red('Library JWT Strategy - Token expired'));
      throw new UnauthorizedException('Token has expired');
    }

    return payload;
  }
}

@Injectable()
export class LibraryJwtGuard extends AuthGuard('library-jwt') {
  constructor() {
    super();
  }

  canActivate(context: ExecutionContext) {
    const request = context.switchToHttp().getRequest();
    const authHeader = request.headers.authorization;
    
    if (!authHeader) {
      console.log(colors.red('Library JWT Guard - No authorization header found'));
      return false;
    }

    if (!authHeader.startsWith('Bearer ')) {
      console.log(colors.red('Library JWT Guard - Invalid authorization header format'));
      return false;
    }

    return super.canActivate(context);
  }
}

