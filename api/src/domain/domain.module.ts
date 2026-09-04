import { Global, Module } from '@nestjs/common';
import { InMemoryReferenceRegistry } from './in-memory-reference-registry.service.js';

@Global()
@Module({
  providers: [InMemoryReferenceRegistry],
  exports: [InMemoryReferenceRegistry],
})
export class DomainModule {}
