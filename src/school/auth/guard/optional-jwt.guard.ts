import { AuthGuard } from "@nestjs/passport";
import { Injectable, ExecutionContext } from "@nestjs/common";
import * as colors from 'colors';

@Injectable()
export class OptionalJwtGuard extends AuthGuard("jwt1") {
    constructor() {
        super();
    }

    canActivate(context: ExecutionContext) {
        const request = context.switchToHttp().getRequest();
        const authHeader = request.headers.authorization;
        
        // If no auth header or invalid format, allow request to proceed without user
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            console.log(colors.gray('Optional JWT Guard - No valid auth header, proceeding without user'));
            return true; // Allow request to proceed
        }

        // If valid header exists, validate the token
        return super.canActivate(context);
    }

    handleRequest(err: any, user: any, info: any) {
        // If there's an error or no user, return null instead of throwing
        if (err || !user) {
            console.log(colors.yellow('Optional JWT Guard - Token invalid or expired, proceeding without user'));
            return null;
        }
        
        console.log(colors.green(`Optional JWT Guard - User authenticated: ${user.sub}`));
        return user;
    }
}

