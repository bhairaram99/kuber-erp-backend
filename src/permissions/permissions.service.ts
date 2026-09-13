import { Injectable, ConflictException } from '@nestjs/common';
import { PermissionsRepository } from './permissions.repository';
import { CreatePermissionDto } from './dto/create-permission.dto';
import { PermissionDocument } from './schemas/permission.schema';

@Injectable()
export class PermissionsService {
  constructor(private readonly permissionsRepository: PermissionsRepository) {}

  async findAll(): Promise<PermissionDocument[]> {
    return this.permissionsRepository.findAll();
  }

  async create(dto: CreatePermissionDto): Promise<PermissionDocument> {
    const existing = await this.permissionsRepository.findByCode(dto.code);
    if (existing) {
      throw new ConflictException(`Permission with code ${dto.code} already exists`);
    }
    return this.permissionsRepository.create(dto);
  }

  async seedDefaultPermissions(
    permissions: Array<{ code: string; name: string; module: string; description?: string }>,
  ): Promise<void> {
    await this.permissionsRepository.bulkUpsert(permissions);
  }
}
