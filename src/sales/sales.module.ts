import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Sale, SaleSchema } from './schemas/sale.schema';
import { SalesRepository } from './sales.repository';
import { SalesService } from './sales.service';
import { SalesController } from './sales.controller';
import { CustomersModule } from '../customers/customers.module';
import { ProductsModule } from '../products/products.module';
import { InventoryModule } from '../inventory/inventory.module';
import { PaymentsModule } from '../payments/payments.module';
import { TransactionsModule } from '../transactions/transactions.module';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Sale.name, schema: SaleSchema }]),
    CustomersModule,
    ProductsModule,
    InventoryModule,
    PaymentsModule,
    TransactionsModule,
  ],
  controllers: [SalesController],
  providers: [SalesRepository, SalesService],
  exports: [SalesService, SalesRepository],
})
export class SalesModule {}
