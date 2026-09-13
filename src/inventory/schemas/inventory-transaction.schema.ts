import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';
import { InventoryTransactionType } from '../../common/enums/inventory-transaction-type.enum';
import { Product } from '../../products/schemas/product.schema';
import { User } from '../../users/schemas/user.schema';

export type InventoryTransactionDocument = InventoryTransaction & Document;

@Schema({ timestamps: { createdAt: true, updatedAt: false }, collection: 'inventory_transactions' })
export class InventoryTransaction {
  @Prop({
    type: MongooseSchema.Types.ObjectId,
    ref: Product.name,
    required: true,
    index: true,
  })
  productId: Product | string;

  @Prop({
    type: String,
    enum: Object.values(InventoryTransactionType),
    required: true,
    index: true,
  })
  type: InventoryTransactionType;

  @Prop({ required: true })
  quantity: number; // Positive for additions, negative for reductions

  @Prop({ required: true })
  previousStock: number;

  @Prop({ required: true })
  newStock: number;

  @Prop({ default: 'MANUAL', trim: true, index: true })
  referenceType: string; // 'SALE', 'PURCHASE', 'MANUAL_ADJUSTMENT', 'RESET', etc.

  @Prop({ default: '', trim: true, index: true })
  referenceId: string;

  @Prop({ default: '', trim: true })
  reason: string;

  @Prop({ default: '', trim: true })
  notes: string;

  @Prop({ type: MongooseSchema.Types.ObjectId, ref: User.name, index: true })
  createdBy: User | string;
}

export const InventoryTransactionSchema =
  SchemaFactory.createForClass(InventoryTransaction);

InventoryTransactionSchema.index({ productId: 1, createdAt: -1 });
InventoryTransactionSchema.index({ referenceType: 1, referenceId: 1 });
InventoryTransactionSchema.index({ createdAt: -1 });
