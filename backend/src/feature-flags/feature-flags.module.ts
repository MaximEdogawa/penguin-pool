import { Module } from '@nestjs/common'
import { ConfigModule } from '@nestjs/config'
import { FeatureFlagsController } from './feature-flags.controller'
import { FeatureFlagsService } from './feature-flags.service'

@Module({
  imports: [ConfigModule],
  providers: [FeatureFlagsService],
  controllers: [FeatureFlagsController],
  exports: [FeatureFlagsService],
})
export class FeatureFlagsModule {}
