import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';
import {
  PaymentMethod,
  PaymentType,
} from '../../common/enums/payment.enum';
import { Customer } from '../../customers/schemas/customer.schema';
import { Supplier } from '../../suppliers/schemas/supplier.schema';
import { User } from '../../users/schemas/user.schema';

export type PaymentDocument = Payment & Document;

@Schema({ timestamps: true, collection: 'payments' })
export class Payment {
  @Prop({ required: true, unique: true, uppercase: true, trim: true, index: true })
  paymentNumber: string;

  @Prop({
    type: String,
    enum: Object.values(PaymentType),
    required: true,
    index: true,
  })
  type: PaymentType; // RECEIVED or SENT

  @Prop({ default: 'DIRECT', trim: true, index: true })
  referenceType: string; // 'SALE', 'PURCHASE', 'DIRECT'

  @Prop({ default: '', trim: true, index: true })
  referenceId: string;

  @Prop({ type: MongooseSchema.Types.ObjectId, ref: Customer.name, default: null, index: true })
  customerId: Customer | string;

  @Prop({ type: MongooseSchema.Types.ObjectId, ref: Supplier.name, default: null, index: true })
  supplierId: Supplier | string;

  @Prop({ required: true, min: 0.01 })
  amount: number;

  @Prop({
    type: String,
    enum: Object.values(PaymentMethod),
    default: PaymentMethod.CASH,
  })
  paymentMethod: PaymentMethod;

  @Prop({ default: Date.now, index: true })
  paymentDate: Date;

  @Prop({ default: '', trim: true })
  notes: string;

  @Prop({ type: MongooseSchema.Types.ObjectId, ref: User.name })
  createdBy: User | string;
}

export const PaymentSchema = SchemaFactory.createForClass(Payment);

PaymentSchema.index({ paymentDate: -1 });
PaymentSchema.index({ customerId: 1, paymentDate: -1 });
PaymentSchema.index({ supplierId: 1, paymentDate: -1 });
