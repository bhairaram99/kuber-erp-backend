import { Injectable, NotFoundException } from '@nestjs/common';
import { ExpensesRepository } from './expenses.repository';
import { TransactionsService } from '../transactions/transactions.service';
import { CreateExpenseDto } from './dto/create-expense.dto';
import { UpdateExpenseDto } from './dto/update-expense.dto';
import { PaginationQueryDto } from '../common/dto/pagination-query.dto';
import { CentralTransactionType } from '../common/enums/transaction-type.enum';

@Injectable()
export class ExpensesService {
  constructor(
    private readonly expensesRepository: ExpensesRepository,
    private readonly transactionsService: TransactionsService,
  ) {}

  async create(dto: CreateExpenseDto, userId?: string) {
    const expenseDate = dto.date ? new Date(dto.date) : new Date();

    const expense = await this.expensesRepository.create({
      ...dto,
      date: expenseDate,
      createdBy: userId,
    });

    await this.transactionsService.recordTransaction({
      type: CentralTransactionType.EXPENSE,
      referenceType: 'EXPENSE',
      referenceId: expense._id.toString(),
      amount: expense.amount,
      description: `${expense.title} [${expense.category}]`,
      createdBy: userId,
    });

    return expense;
  }

  async findPaginated(query: PaginationQueryDto, category?: string) {
    const page = Number(query.page) || 1;
    const limit = Number(query.limit) || 20;
    const skip = (page - 1) * limit;

    const filter: any = {};
    if (category) {
      filter.category = category;
    }
    if (query.search) {
      filter.$or = [
        { title: { $regex: query.search, $options: 'i' } },
        { description: { $regex: query.search, $options: 'i' } },
        { category: { $regex: query.search, $options: 'i' } },
      ];
    }
    if (query.from || query.to) {
      filter.date = {};
      if (query.from) {
        filter.date.$gte = new Date(query.from);
      }
      if (query.to) {
        filter.date.$lte = new Date(query.to);
      }
    }

    const { items, total } = await this.expensesRepository.findPaginated(
      filter,
      skip,
      limit,
      query.sortBy || 'date',
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

  async findById(id: string) {
    const expense = await this.expensesRepository.findById(id);
    if (!expense) {
      throw new NotFoundException(`Expense with ID ${id} not found`);
    }
    return expense;
  }

  async update(id: string, dto: UpdateExpenseDto) {
    await this.findById(id);
    const updateData: any = { ...dto };
    if (dto.date) {
      updateData.date = new Date(dto.date);
    }
    return this.expensesRepository.update(id, updateData);
  }

  async delete(id: string) {
    await this.findById(id);
    await this.expensesRepository.delete(id);
  }

  async getCategoryBreakdown(from?: string, to?: string) {
    const fromDate = from ? new Date(from) : undefined;
    const toDate = to ? new Date(to) : undefined;
    return this.expensesRepository.getCategoryTotals(fromDate, toDate);
  }
}
