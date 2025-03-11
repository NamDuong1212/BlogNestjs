import {
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Category } from './category.entity';
import { Repository } from 'typeorm';

@Injectable()
export class CategoryService {
  constructor(
    @InjectRepository(Category)
    private readonly categoryRepository: Repository<Category>,
  ) {}

  async getAllCategories(): Promise<Category[]> {
    const allCategories = await this.categoryRepository.find({ 
      relations: ['parent', 'children'] 
  });
  
  const rootCategories = allCategories.filter(category => !category.parent);

  for (const rootCategory of rootCategories) {
      this.buildCategoryTree(rootCategory, allCategories);
  }
  
  return rootCategories;
}
private buildCategoryTree(parent: Category, allCategories: Category[]): void {
  const children = allCategories.filter(
      category => category.parent && category.parent.id === parent.id
  );
  parent.children = children;
  for (const child of children) {
      this.buildCategoryTree(child, allCategories);
  }
}

  async getCategoryById(id: string): Promise<Category> {
    const category = await this.categoryRepository.findOne({ where: { id }, relations: ['parent', 'children'] });

    if (!category) {
      throw new NotFoundException('Category not found');
    }

    return category;
  }

}
