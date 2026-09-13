import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';
import { OrderStatus } from '../../common/enums/order-status.enum';
import { PaymentMethod, PaymentStatus } from '../../common/enums/payment.enum';
import { Customer } from '../../customers/schemas/customer.schema';
import { Product } from '../../products/schemas/product.schema';
import { User } from '../../users/schemas/user.schema';

export type SaleDocument = Sale & Document;

@Schema({ _id: false })
export class SaleItemSnapshot {
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
  purchasePriceSnapshot: number; // For COGS calculations

  @Prop({ required: true, min: 0 })
  sellingPrice: number;

  @Prop({ default: 0, min: 0 })
  discount: number;

  @Prop({ default: 0, min: 0 })
  tax: number;

  @Prop({ required: true, min: 0 })
  subtotal: number;

  @Prop({ required: true, min: 0 })
  total: number;
}

export const SaleItemSnapshotSchema = SchemaFactory.createForClass(SaleItemSnapshot);

@Schema({ timestamps: true, collection: 'sales' })
export class Sale {
  @Prop({ required: true, unique: true, uppercase: true, trim: true, index: true })
  invoiceNumber: string;

  @Prop({
    type: MongooseSchema.Types.ObjectId,
    ref: Customer.name,
    required: true,
    index: true,
  })
  customerId: Customer | string;

  @Prop({ type: [SaleItemSnapshotSchema], required: true })
  items: SaleItemSnapshot[];

  @Prop({ required: true, min: 0 })
  subtotal: number;

  @Prop({ default: 0, min: 0 })
  discount: number;

  @Prop({ default: 0, min: 0 })
  tax: number;

  @Prop({ required: true, min: 0 })
  total: number;

  @Prop({ default: 0, min: 0 })
  costOfGoodsSold: number; // COGS = sum(quantity * purchasePriceSnapshot)

  @Prop({ default: 0, min: 0 })
  grossProfit: number; // total - COGS

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
    default: PaymentMethod.CASH,
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
  saleDate: Date;

  @Prop({ default: '', trim: true })
  notes: string;

  @Prop({ type: MongooseSchema.Types.ObjectId, ref: User.name })
  createdBy: User | string;

  @Prop({ type: MongooseSchema.Types.ObjectId, ref: User.name })
  updatedBy: User | string;
}

export const SaleSchema = SchemaFactory.createForClass(Sale);

SaleSchema.index({ customerId: 1, saleDate: -1 });
SaleSchema.index({ saleDate: -1, status: 1 });
