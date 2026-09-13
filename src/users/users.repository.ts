import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { FilterQuery, Model } from 'mongoose';
import { User, UserDocument } from './schemas/user.schema';

@Injectable()
export class UsersRepository {
  constructor(
    @InjectModel(User.name)
    private readonly userModel: Model<UserDocument>,
  ) {}

  async findAll(filter: FilterQuery<UserDocument> = {}): Promise<UserDocument[]> {
    return this.userModel.find(filter).populate('role').sort({ createdAt: -1 }).exec();
  }

  async findPaginated(
    filter: FilterQuery<UserDocument>,
    skip: number,
    limit: number,
    sortBy = 'createdAt',
    sortOrder: 'asc' | 'desc' = 'desc',
  ): Promise<{ items: UserDocument[]; total: number }> {
    const sort: any = { [sortBy]: sortOrder === 'asc' ? 1 : -1 };
    const [items, total] = await Promise.all([
      this.userModel
        .find(filter)
        .populate('role')
        .sort(sort)
        .skip(skip)
        .limit(limit)
        .exec(),
      this.userModel.countDocuments(filter).exec(),
    ]);

    return { items, total };
  }

  async findById(id: string): Promise<UserDocument | null> {
    return this.userModel.findById(id).populate('role').exec();
  }

  async findByEmail(email: string, includePassword = false): Promise<UserDocument | null> {
    const query = this.userModel.findOne({ email: email.toLowerCase() }).populate('role');
    if (includePassword) {
      query.select('+passwordHash');
    }
    return query.exec();
  }

  async create(data: Partial<User>): Promise<UserDocument> {
    const created = new this.userModel(data);
    return created.save();
  }

  async update(id: string, data: Partial<User>): Promise<UserDocument | null> {
    return this.userModel
      .findByIdAndUpdate(id, { $set: data }, { new: true })
      .populate('role')
      .exec();
  }

  async delete(id: string): Promise<UserDocument | null> {
    return this.userModel.findByIdAndDelete(id).exec();
  }

  async updateLastLogin(id: string): Promise<void> {
    await this.userModel.findByIdAndUpdate(id, { $set: { lastLoginAt: new Date() } }).exec();
  }
}
