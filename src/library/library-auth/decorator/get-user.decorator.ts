import { createParamDecorator, ExecutionContext } from '@nestjs/common';

/**
 * Get library user from request
 * Extracts the user object that was set by the LibraryJwtGuard
 */
export const GetUser = createParamDecorator(
  (data: unknown, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    return request.user;
  },
);
