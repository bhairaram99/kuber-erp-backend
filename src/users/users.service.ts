import {
  Injectable,
  ConflictException,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { UsersRepository } from './users.repository';
import { RolesService } from '../roles/roles.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { PaginationQueryDto } from '../common/dto/pagination-query.dto';
import { UserDocument } from './schemas/user.schema';

@Injectable()
export class UsersService {
  constructor(
    private readonly usersRepository: UsersRepository,
    private readonly rolesService: RolesService,
  ) {}

  async findPaginated(query: PaginationQueryDto) {
    const page = Number(query.page) || 1;
    const limit = Number(query.limit) || 20;
    const skip = (page - 1) * limit;

    const filter: any = {};
    if (query.search) {
      filter.$or = [
        { name: { $regex: query.search, $options: 'i' } },
        { email: { $regex: query.search, $options: 'i' } },
        { phone: { $regex: query.search, $options: 'i' } },
      ];
    }

    const { items, total } = await this.usersRepository.findPaginated(
      filter,
      skip,
      limit,
      query.sortBy || 'createdAt',
      query.sortOrder || 'desc',
    );

    return {
      items,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit) || 1,
      },
    };
  }

  async findById(id: string): Promise<UserDocument> {
    const user = await this.usersRepository.findById(id);
    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }
    return user;
  }

  async findByEmail(email: string, includePassword = false): Promise<UserDocument | null> {
    return this.usersRepository.findByEmail(email, includePassword);
  }

  async create(dto: CreateUserDto): Promise<UserDocument> {
    const existing = await this.usersRepository.findByEmail(dto.email);
    if (existing) {
      throw new ConflictException(`User with email '${dto.email}' already exists`);
    }

    await this.rolesService.findById(dto.roleId);

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(dto.password, salt);

    return this.usersRepository.create({
      name: dto.name,
      email: dto.email.toLowerCase(),
      phone: dto.phone || '',
      passwordHash,
      role: dto.roleId,
      status: dto.status,
      avatar: dto.avatar || '',
    });
  }

  async update(id: string, dto: UpdateUserDto): Promise<UserDocument> {
    await this.findById(id);

    const updateData: any = { ...dto };

    if (dto.email) {
      const existing = await this.usersRepository.findByEmail(dto.email);
      if (existing && existing._id.toString() !== id) {
        throw new ConflictException(`User with email '${dto.email}' already exists`);
      }
      updateData.email = dto.email.toLowerCase();
    }

    if (dto.roleId) {
      await this.rolesService.findById(dto.roleId);
      updateData.role = dto.roleId;
      delete updateData.roleId;
    }

    if (dto.password) {
      const salt = await bcrypt.genSalt(10);
      updateData.passwordHash = await bcrypt.hash(dto.password, salt);
      delete updateData.password;
    }

    return this.usersRepository.update(id, updateData);
  }

  async delete(id: string): Promise<void> {
    await this.findById(id);
    await this.usersRepository.delete(id);
  }

  async updateLastLogin(id: string): Promise<void> {
    await this.usersRepository.updateLastLogin(id);
  }
}
