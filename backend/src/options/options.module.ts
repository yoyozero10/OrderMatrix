import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { OptionType } from '../products/entities/option-type.entity';
import { OptionValue } from '../products/entities/option-value.entity';
import { OptionsService } from './options.service';
import { OptionsController } from './options.controller';

@Module({
  imports: [TypeOrmModule.forFeature([OptionType, OptionValue])],
  controllers: [OptionsController],
  providers: [OptionsService],
  exports: [TypeOrmModule, OptionsService],
})
export class OptionsModule {}
