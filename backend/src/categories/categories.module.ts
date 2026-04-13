import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Category } from './entities/category.entity';
import { CategoriesService } from './categories.service';
import { CategoriesController } from './categories.controller';
import { AdminCategoriesController } from './admin-categories.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Category])],
  controllers: [CategoriesController, AdminCategoriesController],
  providers: [CategoriesService],
  exports: [TypeOrmModule, CategoriesService],
})
export class CategoriesModule {}
