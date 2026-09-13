import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { FilterQuery, Model } from 'mongoose';
import { Expense, ExpenseDocument } from './schemas/expense.schema';

@Injectable()
export class ExpensesRepository {
  constructor(
    @InjectModel(Expense.name)
    private readonly expenseModel: Model<ExpenseDocument>,
  ) {}

  async create(data: Partial<Expense>): Promise<ExpenseDocument> {
    const created = new this.expenseModel(data);
    return created.save();
  }

  async findPaginated(
    filter: FilterQuery<ExpenseDocument>,
    skip: number,
    limit: number,
    sortBy = 'date',
    sortOrder: 'asc' | 'desc' = 'desc',
  ): Promise<{ items: ExpenseDocument[]; total: number }> {
    const sort: any = { [sortBy]: sortOrder === 'asc' ? 1 : -1 };
    const [items, total] = await Promise.all([
      this.expenseModel
        .find(filter)
        .populate('createdBy', 'name')
        .sort(sort)
        .skip(skip)
        .limit(limit)
        .exec(),
      this.expenseModel.countDocuments(filter).exec(),
    ]);

    return { items, total };
  }

  async findById(id: string): Promise<ExpenseDocument | null> {
    return this.expenseModel.findById(id).populate('createdBy', 'name email').exec();
  }

  async update(id: string, data: Partial<Expense>): Promise<ExpenseDocument | null> {
    return this.expenseModel.findByIdAndUpdate(id, { $set: data }, { new: true }).exec();
  }

  async delete(id: string): Promise<ExpenseDocument | null> {
    return this.expenseModel.findByIdAndDelete(id).exec();
  }

  async getCategoryTotals(from?: Date, to?: Date): Promise<Array<{ _id: string; total: number }>> {
    const match: any = {};
    if (from || to) {
      match.date = {};
      if (from) match.date.$gte = from;
      if (to) match.date.$lte = to;
    }

    return this.expenseModel.aggregate([
      { $match: match },
      { $group: { _id: '$category', total: { $sum: '$amount' } } },
      { $sort: { total: -1 } },
    ]);
  }
}
