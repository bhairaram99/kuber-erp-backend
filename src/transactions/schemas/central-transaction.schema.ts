import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';
import { CentralTransactionType } from '../../common/enums/transaction-type.enum';
import { PaymentStatus } from '../../common/enums/payment.enum';
import { Customer } from '../../customers/schemas/customer.schema';
import { Supplier } from '../../suppliers/schemas/supplier.schema';
import { User } from '../../users/schemas/user.schema';

export type CentralTransactionDocument = CentralTransaction & Document;

@Schema({ timestamps: true, collection: 'transactions' })
export class CentralTransaction {
  @Prop({ required: true, unique: true, uppercase: true, trim: true, index: true })
  transactionNumber: string;

  @Prop({
    type: String,
    enum: Object.values(CentralTransactionType),
    required: true,
    index: true,
  })
  type: CentralTransactionType;

  @Prop({ required: true, trim: true, index: true })
  referenceType: string; // 'SALE', 'PURCHASE', 'PAYMENT', 'EXPENSE', 'INVENTORY'

  @Prop({ default: '', trim: true, index: true })
  referenceId: string;

  @Prop({ required: true, min: 0 })
  amount: number;

  @Prop({ type: MongooseSchema.Types.ObjectId, ref: Customer.name, default: null, index: true })
  customerId: Customer | string;

  @Prop({ type: MongooseSchema.Types.ObjectId, ref: Supplier.name, default: null, index: true })
  supplierId: Supplier | string;

  @Prop({
    type: String,
    enum: Object.values(PaymentStatus),
    default: PaymentStatus.PAID,
  })
  paymentStatus: PaymentStatus;

  @Prop({ default: 'COMPLETED', trim: true, index: true })
  status: string; // 'COMPLETED', 'CANCELLED', 'PENDING'

  @Prop({ default: '', trim: true })
  description: string;

  @Prop({ type: MongooseSchema.Types.ObjectId, ref: User.name })
  createdBy: User | string;
}

export const CentralTransactionSchema =
  SchemaFactory.createForClass(CentralTransaction);

CentralTransactionSchema.index({ createdAt: -1 });
CentralTransactionSchema.index({ type: 1, createdAt: -1 });
CentralTransactionSchema.index({ customerId: 1, createdAt: -1 });
CentralTransactionSchema.index({ supplierId: 1, createdAt: -1 });
