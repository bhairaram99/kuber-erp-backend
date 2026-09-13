import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { FilterQuery, Model } from 'mongoose';
import { Category, CategoryDocument } from './schemas/category.schema';

@Injectable()
export class CategoriesRepository {
  constructor(
    @InjectModel(Category.name)
    private readonly categoryModel: Model<CategoryDocument>,
  ) {}

  async findAll(filter: FilterQuery<CategoryDocument> = {}): Promise<CategoryDocument[]> {
    return this.categoryModel.find(filter).sort({ name: 1 }).exec();
  }

  async findPaginated(
    filter: FilterQuery<CategoryDocument>,
    skip: number,
    limit: number,
  ): Promise<{ items: CategoryDocument[]; total: number }> {
    const [items, total] = await Promise.all([
      this.categoryModel.find(filter).sort({ name: 1 }).skip(skip).limit(limit).exec(),
      this.categoryModel.countDocuments(filter).exec(),
    ]);
    return { items, total };
  }

  async findById(id: string): Promise<CategoryDocument | null> {
    return this.categoryModel.findById(id).exec();
  }

  async findByName(name: string): Promise<CategoryDocument | null> {
    return this.categoryModel.findOne({ name: new RegExp(`^${name}$`, 'i') }).exec();
  }

  async create(data: Partial<Category>): Promise<CategoryDocument> {
    const created = new this.categoryModel(data);
    return created.save();
  }

  async update(id: string, data: Partial<Category>): Promise<CategoryDocument | null> {
    return this.categoryModel.findByIdAndUpdate(id, { $set: data }, { new: true }).exec();
  }

  async delete(id: string): Promise<CategoryDocument | null> {
    return this.categoryModel.findByIdAndDelete(id).exec();
  }

  async upsert(name: string, data: Partial<Category>): Promise<CategoryDocument> {
    return this.categoryModel
      .findOneAndUpdate(
        { name: new RegExp(`^${name}$`, 'i') },
        { $set: data },
        { upsert: true, new: true },
      )
      .exec();
  }
}
