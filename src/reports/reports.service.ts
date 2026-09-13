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
        .select('name sku currentStock minimumStock unit location')
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

  async getDashboardSummary() {
    const pnl = await this.getProfitAndLoss({});
    const inv = await this.getInventoryReport();

    const [recentSales, recentPurchases, customerCount, salesTrend] = await Promise.all([
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
      this.saleModel.aggregate([
        { $match: { status: 'CONFIRMED' } },
        {
          $group: {
            _id: { $dateToString: { format: '%Y-%m-%d', date: '$saleDate' } },
            sales: { $sum: '$total' },
          },
        },
        { $sort: { _id: -1 } },
        { $limit: 14 },
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
      },
      salesTrend: salesTrend.reverse(),
      recentSales,
      recentPurchases,
      lowStockItems: inv.lowStockProducts.slice(0, 5),
    };
  }
}
