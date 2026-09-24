import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Sale, SaleDocument } from '../sales/schemas/sale.schema';
import { Purchase, PurchaseDocument } from '../purchases/schemas/purchase.schema';
import { Product, ProductDocument } from '../products/schemas/product.schema';
import { Expense, ExpenseDocument } from '../expenses/schemas/expense.schema';
import { Customer, CustomerDocument } from '../customers/schemas/customer.schema';
import { InventoryTransaction, InventoryTransactionDocument } from '../inventory/schemas/inventory-transaction.schema';
import { ReportQueryDto } from './dto/report-query.dto';

@Injectable()
export class ReportsService {
  constructor(
    @InjectModel(Sale.name)
    private readonly saleModel: Model<SaleDocument>,
    @InjectModel(Purchase.name)
    private readonly purchaseModel: Model<PurchaseDocument>,
    @InjectModel(Product.name)
    private readonly productModel: Model<ProductDocument>,
    @InjectModel(Expense.name)
    private readonly expenseModel: Model<ExpenseDocument>,
    @InjectModel(Customer.name)
    private readonly customerModel: Model<CustomerDocument>,
    @InjectModel(InventoryTransaction.name)
    private readonly inventoryTxModel: Model<InventoryTransactionDocument>,
  ) {}

  private parseDateFilter(from?: string, to?: string, field = 'saleDate') {
    const filter: any = {};
    if (from || to) {
      filter[field] = {};
      if (from) filter[field].$gte = new Date(from);
      if (to) {
        const toDate = new Date(to);
        toDate.setHours(23, 59, 59, 999);
        filter[field].$lte = toDate;
      }
    }
    return filter;
  }

  async getProfitAndLoss(query: ReportQueryDto) {
    const saleMatch: any = {
      status: 'CONFIRMED',
      ...this.parseDateFilter(query.from, query.to, 'saleDate'),
    };

    const expenseMatch: any = this.parseDateFilter(query.from, query.to, 'date');

    const [salesAgg, expensesAgg, monthlyTrend] = await Promise.all([
      this.saleModel.aggregate([
        { $match: saleMatch },
        {
          $group: {
            _id: null,
            totalRevenue: { $sum: '$total' },
            totalCogs: { $sum: '$costOfGoodsSold' },
            totalGrossProfit: { $sum: '$grossProfit' },
            count: { $sum: 1 },
          },
        },
      ]),
      this.expenseModel.aggregate([
        { $match: expenseMatch },
        {
          $group: {
            _id: null,
            totalExpenses: { $sum: '$amount' },
            count: { $sum: 1 },
          },
        },
      ]),
      this.saleModel.aggregate([
        { $match: saleMatch },
        {
          $group: {
            _id: { $dateToString: { format: '%Y-%m', date: '$saleDate' } },
            revenue: { $sum: '$total' },
            cogs: { $sum: '$costOfGoodsSold' },
            grossProfit: { $sum: '$grossProfit' },
          },
        },
        { $sort: { _id: 1 } },
      ]),
    ]);

    const revenue = salesAgg[0]?.totalRevenue || 0;
    const cogs = salesAgg[0]?.totalCogs || 0;
    const grossProfit = salesAgg[0]?.totalGrossProfit || (revenue - cogs);
    const operatingExpenses = expensesAgg[0]?.totalExpenses || 0;
    const netProfit = grossProfit - operatingExpenses;

    return {
      revenue,
      costOfGoodsSold: cogs,
      grossProfit,
      operatingExpenses,
      netProfit,
      profitMargin: revenue > 0 ? ((netProfit / revenue) * 100).toFixed(2) : 0,
      monthlyTrend,
    };
  }

  async getSalesReport(query: ReportQueryDto) {
    const saleMatch: any = {
      status: 'CONFIRMED',
      ...this.parseDateFilter(query.from, query.to, 'saleDate'),
    };

    const [summary, topProducts, paymentMethods, trend] = await Promise.all([
      this.saleModel.aggregate([
        { $match: saleMatch },
        {
          $group: {
            _id: null,
            totalSales: { $sum: '$total' },
            totalInvoices: { $sum: 1 },
            totalPaid: { $sum: '$paidAmount' },
            totalDue: { $sum: '$dueAmount' },
          },
        },
      ]),
      this.saleModel.aggregate([
        { $match: saleMatch },
        { $unwind: '$items' },
        {
          $group: {
            _id: '$items.productId',
            productName: { $first: '$items.productNameSnapshot' },
            sku: { $first: '$items.skuSnapshot' },
            unit: { $first: '$items.unitSnapshot' },
            totalQuantitySold: { $sum: '$items.quantity' },
            totalRevenue: { $sum: '$items.total' },
          },
        },
        { $sort: { totalRevenue: -1 } },
        { $limit: 10 },
      ]),
      this.saleModel.aggregate([
        { $match: saleMatch },
        {
          $group: {
            _id: '$paymentMethod',
            total: { $sum: '$total' },
            count: { $sum: 1 },
          },
        },
      ]),
      this.saleModel.aggregate([
        { $match: saleMatch },
        {
          $group: {
            _id: { $dateToString: { format: '%Y-%m-%d', date: '$saleDate' } },
            sales: { $sum: '$total' },
            count: { $sum: 1 },
          },
        },
        { $sort: { _id: 1 } },
      ]),
    ]);

    return {
      summary: summary[0] || { totalSales: 0, totalInvoices: 0, totalPaid: 0, totalDue: 0 },
      topProducts,
      paymentMethods,
      trend,
    };
  }

  async getPurchasesReport(query: ReportQueryDto) {
    const purchaseMatch: any = {
      status: 'CONFIRMED',
      ...this.parseDateFilter(query.from, query.to, 'purchaseDate'),
    };

    const [summary, trend, bySupplier] = await Promise.all([
      this.purchaseModel.aggregate([
        { $match: purchaseMatch },
        {
          $group: {
            _id: null,
            totalPurchases: { $sum: '$total' },
            totalOrders: { $sum: 1 },
            totalPaid: { $sum: '$paidAmount' },
            totalDue: { $sum: '$dueAmount' },
          },
        },
      ]),
      this.purchaseModel.aggregate([
        { $match: purchaseMatch },
        {
          $group: {
            _id: { $dateToString: { format: '%Y-%m-%d', date: '$purchaseDate' } },
            purchases: { $sum: '$total' },
            count: { $sum: 1 },
          },
        },
        { $sort: { _id: 1 } },
      ]),
      this.purchaseModel.aggregate([
        { $match: purchaseMatch },
        {
          $group: {
            _id: '$supplierId',
            totalSpent: { $sum: '$total' },
            ordersCount: { $sum: 1 },
          },
        },
        {
          $lookup: {
            from: 'suppliers',
            localField: '_id',
            foreignField: '_id',
            as: 'supplier',
          },
        },
        { $unwind: { path: '$supplier', preserveNullAndEmptyArrays: true } },
        {
          $project: {
            supplierName: '$supplier.name',
            company: '$supplier.company',
            totalSpent: 1,
            ordersCount: 1,
          },
        },
        { $sort: { totalSpent: -1 } },
      ]),
    ]);

    return {
      summary: summary[0] || { totalPurchases: 0, totalOrders: 0, totalPaid: 0, totalDue: 0 },
      trend,
      bySupplier,
    };
  }

  async getInventoryReport() {
    const [stats, categoryBreakdown, lowStockProducts] = await Promise.all([
      this.productModel.aggregate([
        { $match: { status: 'ACTIVE' } },
        {
          $group: {
            _id: null,
            totalProducts: { $sum: 1 },
            totalStockUnits: { $sum: '$currentStock' },
            totalStockValueCost: {
              $sum: { $multiply: ['$currentStock', '$purchasePrice'] },
            },
            totalStockValueRetail: {
              $sum: { $multiply: ['$currentStock', '$sellingPrice'] },
            },
          },
        },
      ]),
      this.productModel.aggregate([
        { $match: { status: 'ACTIVE' } },
        {
          $group: {
            _id: '$categoryId',
            units: { $sum: '$currentStock' },
            valuation: { $sum: { $multiply: ['$currentStock', '$purchasePrice'] } },
            productCount: { $sum: 1 },
          },
        },
        {
          $lookup: {
            from: 'categories',
            localField: '_id',
            foreignField: '_id',
            as: 'category',
          },
        },
        { $unwind: { path: '$category', preserveNullAndEmptyArrays: true } },
        {
          $project: {
            categoryName: '$category.name',
            units: 1,
            valuation: 1,
            productCount: 1,
          },
        },
      ]),
      this.productModel
        .find({
          status: 'ACTIVE',
          $expr: { $lte: ['$currentStock', '$minimumStock'] },
        })
        .select('name sku currentStock minimumStock unit location woodType grade thickness width length categoryId')
        .populate('categoryId', 'name')
        .sort({ currentStock: 1, name: 1 })
        .exec(),
    ]);

    return {
      overview: stats[0] || {
        totalProducts: 0,
        totalStockUnits: 0,
        totalStockValueCost: 0,
        totalStockValueRetail: 0,
      },
      categoryBreakdown,
      lowStockProducts,
    };
  }

  async getDashboardSummary(days = 14) {
    const lookbackDays = [7, 14, 30, 90].includes(Number(days)) ? Number(days) : 14;
    const pnl = await this.getProfitAndLoss({});
    const inv = await this.getInventoryReport();
    const since = this.trendStartDate(lookbackDays);

    const [recentSales, recentPurchases, customerCount, outstandingAgg, outstandingAccounts, salesTrendRaw] = await Promise.all([
      this.saleModel
        .find({ status: 'CONFIRMED' })
        .populate('customerId', 'name company')
        .sort({ saleDate: -1 })
        .limit(5)
        .exec(),
      this.purchaseModel
        .find({ status: 'CONFIRMED' })
        .populate('supplierId', 'name company')
        .sort({ purchaseDate: -1 })
        .limit(5)
        .exec(),
      this.customerModel.countDocuments({ status: 'ACTIVE' }).exec(),
      this.customerModel.aggregate([
        { $match: { status: 'ACTIVE' } },
        { $group: { _id: null, totalDue: { $sum: '$totalDue' } } },
      ]),
      this.customerModel
        .find({ status: 'ACTIVE', totalDue: { $gt: 0 } })
        .select('name company customerType phone totalDue')
        .sort({ totalDue: -1 })
        .limit(200)
        .lean()
        .exec(),
      this.saleModel.aggregate([
        {
          $match: {
            status: 'CONFIRMED',
            saleDate: { $gte: since },
          },
        },
        {
          $group: {
            _id: {
              $dateToString: { format: '%Y-%m-%d', date: '$saleDate', timezone: 'Asia/Kolkata' },
            },
            sales: { $sum: '$total' },
          },
        },
        { $sort: { _id: 1 } },
      ]),
    ]);

    return {
      kpi: {
        totalSales: pnl.revenue,
        grossProfit: pnl.grossProfit,
        netProfit: pnl.netProfit,
        totalExpenses: pnl.operatingExpenses,
        currentStockValue: inv.overview.totalStockValueCost,
        lowStockCount: inv.lowStockProducts.length,
        totalCustomers: customerCount,
        customerOutstanding: outstandingAgg[0]?.totalDue || 0,
      },
      salesTrend: this.buildSalesTrend(salesTrendRaw, lookbackDays),
      recentSales,
      recentPurchases,
      lowStockItems: inv.lowStockProducts,
      outstandingAccounts,
    };
  }

  private trendStartDate(days: number): Date {
    const since = new Date();
    since.setHours(0, 0, 0, 0);
    const lookback = days <= 31 ? days - 1 : Math.ceil(days / 7) * 7 - 1;
    since.setDate(since.getDate() - lookback);
    return since;
  }

  private toYmd(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  private formatTrendLabel(date: Date, withYear = false): string {
    return date.toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      ...(withYear ? { year: '2-digit' } : {}),
    });
  }

  private buildSalesTrend(rows: Array<{ _id: string; sales: number }>, days: number) {
    const map = new Map(rows.map((row) => [row._id, Number(row.sales || 0)]));
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (days <= 31) {
      const points: Array<{ _id: string; sales: number }> = [];
      for (let i = days - 1; i >= 0; i -= 1) {
        const day = new Date(today);
        day.setDate(today.getDate() - i);
        points.push({
          _id: this.formatTrendLabel(day, days > 14),
          sales: map.get(this.toYmd(day)) || 0,
        });
      }
      return points;
    }

    const weeks = Math.ceil(days / 7);
    const points: Array<{ _id: string; sales: number }> = [];
    for (let week = weeks - 1; week >= 0; week -= 1) {
      const weekEnd = new Date(today);
      weekEnd.setDate(today.getDate() - week * 7);
      const weekStart = new Date(weekEnd);
      weekStart.setDate(weekEnd.getDate() - 6);
      let sales = 0;
      for (let offset = 0; offset < 7; offset += 1) {
        const day = new Date(weekStart);
        day.setDate(weekStart.getDate() + offset);
        sales += map.get(this.toYmd(day)) || 0;
      }
      points.push({
        _id: this.formatTrendLabel(weekStart, true),
        sales,
      });
    }
    return points;
  }
}
