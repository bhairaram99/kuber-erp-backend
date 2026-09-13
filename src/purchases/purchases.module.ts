import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Purchase, PurchaseSchema } from './schemas/purchase.schema';
import { PurchasesRepository } from './purchases.repository';
import { PurchasesService } from './purchases.service';
import { PurchasesController } from './purchases.controller';
import { SuppliersModule } from '../suppliers/suppliers.module';
import { ProductsModule } from '../products/products.module';
import { InventoryModule } from '../inventory/inventory.module';
import { PaymentsModule } from '../payments/payments.module';
import { TransactionsModule } from '../transactions/transactions.module';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Purchase.name, schema: PurchaseSchema }]),
    SuppliersModule,
    ProductsModule,
    InventoryModule,
    PaymentsModule,
    TransactionsModule,
  ],
  controllers: [PurchasesController],
  providers: [PurchasesRepository, PurchasesService],
  exports: [PurchasesService, PurchasesRepository],
})
export class PurchasesModule {}
