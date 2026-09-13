import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Permission, PermissionDocument } from './schemas/permission.schema';

@Injectable()
export class PermissionsRepository {
  constructor(
    @InjectModel(Permission.name)
    private readonly permissionModel: Model<PermissionDocument>,
  ) {}

  async findAll(): Promise<PermissionDocument[]> {
    return this.permissionModel.find().sort({ module: 1, code: 1 }).exec();
  }

  async findByCode(code: string): Promise<PermissionDocument | null> {
    return this.permissionModel.findOne({ code }).exec();
  }

  async create(data: Partial<Permission>): Promise<PermissionDocument> {
    const created = new this.permissionModel(data);
    return created.save();
  }

  async bulkUpsert(
    permissions: Array<{ code: string; name: string; module: string; description?: string }>,
  ): Promise<void> {
    const ops = permissions.map((p) => ({
      updateOne: {
        filter: { code: p.code },
        update: { $set: p },
        upsert: true,
      },
    }));
    await this.permissionModel.bulkWrite(ops);
  }
}
