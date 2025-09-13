import { Injectable, UnauthorizedException } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { PassportStrategy } from "@nestjs/passport";
import { Strategy, ExtractJwt } from "passport-jwt";
import * as colors from 'colors';

@Injectable()
export class JwtStrategy extends PassportStrategy(
    Strategy,
    'jwt1'
) {
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
            console.log(colors.red('JWT Strategy - No payload found'));
            throw new UnauthorizedException('Invalid token');
        }

        if (!payload.sub || !payload.email || !payload.school_id) {
            console.log(colors.red('JWT Strategy - Invalid payload structure'));
            throw new UnauthorizedException('Invalid token structure');
        }

        // Check token expiration
        const now = Math.floor(Date.now() / 1000);
        if (payload.exp && payload.exp < now) {
            console.log(colors.red('JWT Strategy - Token expired'));
            console.log('Current time:', now);
            console.log('Expiration time:', payload.exp);
            throw new UnauthorizedException('Token has expired');
        }

        return payload;
    }
}