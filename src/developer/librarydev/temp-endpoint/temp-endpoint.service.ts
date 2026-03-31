import { Injectable } from '@nestjs/common';

/**
 * Throwaway / one-off maintenance actions for library dev.
 * Add methods here as needed; remove or gate them after use.
 */
@Injectable()
export class TempEndpointService {
  ping(): { ok: boolean; module: string } {
    return { ok: true, module: 'temp-endpoint' };
  }
}
