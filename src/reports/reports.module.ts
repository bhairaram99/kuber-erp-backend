import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Sale, SaleSchema } from '../sales/schemas/sale.schema';
import { Purchase, PurchaseSchema } from '../purchases/schemas/purchase.schema';
import { Product, ProductSchema } from '../products/schemas/product.schema';
import { Expense, ExpenseSchema } from '../expenses/schemas/expense.schema';
import { Customer, CustomerSchema } from '../customers/schemas/customer.schema';
import {
  InventoryTransaction,
  InventoryTransactionSchema,
} from '../inventory/schemas/inventory-transaction.schema';
import { ReportsService } from './reports.service';
import { ReportsController } from './reports.controller';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Sale.name, schema: SaleSchema },
      { name: Purchase.name, schema: PurchaseSchema },
      { name: Product.name, schema: ProductSchema },
      { name: Expense.name, schema: ExpenseSchema },
      { name: Customer.name, schema: CustomerSchema },
      { name: InventoryTransaction.name, schema: InventoryTransactionSchema },
    ]),
  ],
  controllers: [ReportsController],
  providers: [ReportsService],
  exports: [ReportsService],
})
export class ReportsModule {}
