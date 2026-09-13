import {
  Injectable,
  ConflictException,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { RolesRepository } from './roles.repository';
import { CreateRoleDto } from './dto/create-role.dto';
import { UpdateRoleDto } from './dto/update-role.dto';
import { RoleDocument } from './schemas/role.schema';

@Injectable()
export class RolesService {
  constructor(private readonly rolesRepository: RolesRepository) {}

  async findAll(): Promise<RoleDocument[]> {
    return this.rolesRepository.findAll();
  }

  async findById(id: string): Promise<RoleDocument> {
    const role = await this.rolesRepository.findById(id);
    if (!role) {
      throw new NotFoundException(`Role with ID ${id} not found`);
    }
    return role;
  }

  async findByName(name: string): Promise<RoleDocument | null> {
    return this.rolesRepository.findByName(name);
  }

  async create(dto: CreateRoleDto): Promise<RoleDocument> {
    const existing = await this.rolesRepository.findByName(dto.name);
    if (existing) {
      throw new ConflictException(`Role '${dto.name.toUpperCase()}' already exists`);
    }
    return this.rolesRepository.create({
      name: dto.name.toUpperCase(),
      description: dto.description || '',
      permissions: dto.permissions,
      isActive: dto.isActive !== false,
      isSystem: false,
    });
  }

  async update(id: string, dto: UpdateRoleDto): Promise<RoleDocument> {
    const role = await this.findById(id);

    if (dto.name && dto.name.toUpperCase() !== role.name) {
      const existing = await this.rolesRepository.findByName(dto.name);
      if (existing) {
        throw new ConflictException(`Role '${dto.name.toUpperCase()}' already exists`);
      }
    }

    const updated = await this.rolesRepository.update(id, {
      ...dto,
      name: dto.name ? dto.name.toUpperCase() : role.name,
    });

    return updated;
  }

  async delete(id: string): Promise<void> {
    const role = await this.findById(id);
    if (role.isSystem) {
      throw new BadRequestException('System built-in roles cannot be deleted');
    }
    await this.rolesRepository.delete(id);
  }

  async seedRole(
    name: string,
    description: string,
    permissions: string[],
    isSystem = true,
  ): Promise<RoleDocument> {
    return this.rolesRepository.upsert(name, {
      name: name.toUpperCase(),
      description,
      permissions,
      isActive: true,
      isSystem,
    });
  }
}
