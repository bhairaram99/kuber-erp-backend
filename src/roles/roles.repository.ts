import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Role, RoleDocument } from './schemas/role.schema';

@Injectable()
export class RolesRepository {
  constructor(
    @InjectModel(Role.name)
    private readonly roleModel: Model<RoleDocument>,
  ) {}

  async findAll(): Promise<RoleDocument[]> {
    return this.roleModel.find().sort({ createdAt: 1 }).exec();
  }

  async findById(id: string): Promise<RoleDocument | null> {
    return this.roleModel.findById(id).exec();
  }

  async findByName(name: string): Promise<RoleDocument | null> {
    return this.roleModel.findOne({ name: name.toUpperCase() }).exec();
  }

  async create(data: Partial<Role>): Promise<RoleDocument> {
    const created = new this.roleModel(data);
    return created.save();
  }

  async update(id: string, data: Partial<Role>): Promise<RoleDocument | null> {
    return this.roleModel.findByIdAndUpdate(id, { $set: data }, { new: true }).exec();
  }

  async delete(id: string): Promise<RoleDocument | null> {
    return this.roleModel.findByIdAndDelete(id).exec();
  }

  async upsert(name: string, data: Partial<Role>): Promise<RoleDocument> {
    return this.roleModel
      .findOneAndUpdate(
        { name: name.toUpperCase() },
        { $set: data },
        { upsert: true, new: true },
      )
      .exec();
  }
}
