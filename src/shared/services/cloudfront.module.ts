import { Global, Module } from '@nestjs/common';
import { CloudFrontService } from './cloudfront.service';

@Global() // Makes this service available everywhere without importing the module
@Module({
  providers: [CloudFrontService],
  exports: [CloudFrontService],
})
export class CloudFrontModule {}
