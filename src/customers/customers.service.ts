import {
  Injectable,
  ConflictException,
  NotFoundException,
  Optional,
} from '@nestjs/common';
import { CustomersRepository } from './customers.repository';
import { AuditLogsService } from '../audit-logs/audit-logs.service';
import { CreateCustomerDto } from './dto/create-customer.dto';
import { UpdateCustomerDto } from './dto/update-customer.dto';
import { PaginationQueryDto } from '../common/dto/pagination-query.dto';
import { CustomerDocument } from './schemas/customer.schema';

@Injectable()
export class CustomersService {
  constructor(
    private readonly customersRepository: CustomersRepository,
    @Optional() private readonly auditLogsService?: AuditLogsService,
  ) {}

  async findPaginated(query: PaginationQueryDto) {
    const page = Number(query.page) || 1;
    const limit = Number(query.limit) || 20;
    const skip = (page - 1) * limit;

    const filter: any = {};
    if (query.search) {
      filter.$or = [
        { name: { $regex: query.search, $options: 'i' } },
        { customerCode: { $regex: query.search, $options: 'i' } },
        { phone: { $regex: query.search, $options: 'i' } },
        { email: { $regex: query.search, $options: 'i' } },
        { company: { $regex: query.search, $options: 'i' } },
        { city: { $regex: query.search, $options: 'i' } },
      ];
    }

    const { items, total } = await this.customersRepository.findPaginated(
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

  async findAll(): Promise<CustomerDocument[]> {
    return this.customersRepository.findAll({ status: 'ACTIVE' });
  }

  async findById(id: string): Promise<CustomerDocument> {
    const customer = await this.customersRepository.findById(id);
    if (!customer) {
      throw new NotFoundException(`Customer with ID ${id} not found`);
    }
    return customer;
  }

  async create(dto: CreateCustomerDto): Promise<CustomerDocument> {
    let customerCode = dto.customerCode;
    if (!customerCode) {
      const count = await this.customersRepository.count();
      customerCode = `CUST-${String(count + 1).padStart(4, '0')}`;
    }

    const existing = await this.customersRepository.findByCode(customerCode);
    if (existing) {
      throw new ConflictException(`Customer code '${customerCode}' already exists`);
    }

    const customer = await this.customersRepository.create({
      ...dto,
      customerCode: customerCode.toUpperCase(),
      totalPurchases: 0,
      totalPaid: 0,
      totalDue: 0,
    });

    if (this.auditLogsService) {
      await this.auditLogsService.log({
        action: 'CREATE',
        module: 'CUSTOMERS',
        entityType: 'Customer',
        entityId: customer._id.toString(),
        newData: customer,
      });
    }

    return customer;
  }

  async update(id: string, dto: UpdateCustomerDto): Promise<CustomerDocument> {
    const customer = await this.findById(id);

    if (dto.customerCode && dto.customerCode.toUpperCase() !== customer.customerCode) {
      const existing = await this.customersRepository.findByCode(dto.customerCode);
      if (existing) {
        throw new ConflictException(`Customer code '${dto.customerCode}' already exists`);
      }
    }

    return this.customersRepository.update(id, {
      ...dto,
      customerCode: dto.customerCode ? dto.customerCode.toUpperCase() : customer.customerCode,
    });
  }

  async delete(id: string): Promise<void> {
    await this.findById(id);
    await this.customersRepository.delete(id);
  }

  async updateFinancials(id: string, purchaseDelta: number, paidDelta: number) {
    return this.customersRepository.updateFinancials(id, purchaseDelta, paidDelta);
  }
}
