import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';
import { OrderStatus } from '../../common/enums/order-status.enum';
import { PaymentMethod, PaymentStatus } from '../../common/enums/payment.enum';
import { Product } from '../../products/schemas/product.schema';
import { Supplier } from '../../suppliers/schemas/supplier.schema';
import { User } from '../../users/schemas/user.schema';

export type PurchaseDocument = Purchase & Document;

@Schema({ _id: false })
export class PurchaseItemSnapshot {
  @Prop({ type: MongooseSchema.Types.ObjectId, ref: Product.name, required: true })
  productId: Product | string;

  @Prop({ required: true })
  productNameSnapshot: string;

  @Prop({ required: true })
  skuSnapshot: string;

  @Prop({ default: 'cft' })
  unitSnapshot: string;

  @Prop({ required: true, min: 0.01 })
  quantity: number;

  @Prop({ required: true, min: 0 })
  purchasePrice: number;

  @Prop({ default: 0, min: 0 })
  tax: number;

  @Prop({ default: 0, min: 0 })
  discount: number;

  @Prop({ required: true, min: 0 })
  subtotal: number;

  @Prop({ required: true, min: 0 })
  total: number;
}

export const PurchaseItemSnapshotSchema =
  SchemaFactory.createForClass(PurchaseItemSnapshot);

@Schema({ timestamps: true, collection: 'purchases' })
export class Purchase {
  @Prop({ required: true, unique: true, uppercase: true, trim: true, index: true })
  purchaseNumber: string;

  @Prop({
    type: MongooseSchema.Types.ObjectId,
    ref: Supplier.name,
    required: true,
    index: true,
  })
  supplierId: Supplier | string;

  @Prop({ type: [PurchaseItemSnapshotSchema], required: true })
  items: PurchaseItemSnapshot[];

  @Prop({ required: true, min: 0 })
  subtotal: number;

  @Prop({ default: 0, min: 0 })
  discount: number;

  @Prop({ default: 0, min: 0 })
  tax: number;

  @Prop({ required: true, min: 0 })
  total: number;

  @Prop({ default: 0, min: 0 })
  paidAmount: number;

  @Prop({ default: 0, min: 0 })
  dueAmount: number;

  @Prop({
    type: String,
    enum: Object.values(PaymentStatus),
    default: PaymentStatus.DUE,
    index: true,
  })
  paymentStatus: PaymentStatus;

  @Prop({
    type: String,
    enum: Object.values(PaymentMethod),
    default: PaymentMethod.BANK_TRANSFER,
  })
  paymentMethod: PaymentMethod;

  @Prop({
    type: String,
    enum: Object.values(OrderStatus),
    default: OrderStatus.CONFIRMED,
    index: true,
  })
  status: OrderStatus;

  @Prop({ default: Date.now, index: true })
  purchaseDate: Date;

  @Prop({ default: '', trim: true })
  notes: string;

  @Prop({ type: MongooseSchema.Types.ObjectId, ref: User.name })
  createdBy: User | string;

  @Prop({ type: MongooseSchema.Types.ObjectId, ref: User.name })
  updatedBy: User | string;
}

export const PurchaseSchema = SchemaFactory.createForClass(Purchase);

PurchaseSchema.index({ supplierId: 1, purchaseDate: -1 });
PurchaseSchema.index({ purchaseDate: -1 });
