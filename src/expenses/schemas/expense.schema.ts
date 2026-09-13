import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';
import { PaymentMethod } from '../../common/enums/payment.enum';
import { User } from '../../users/schemas/user.schema';

export type ExpenseDocument = Expense & Document;

@Schema({ timestamps: true, collection: 'expenses' })
export class Expense {
  @Prop({ required: true, trim: true })
  title: string;

  @Prop({ required: true, trim: true, index: true })
  category: string; // Rent, Electricity, Sawmill Maintenance, Transportation, Staff Wages, Machine Oil, Packaging, Office Supplies

  @Prop({ required: true, min: 0.01 })
  amount: number;

  @Prop({ default: Date.now, index: true })
  date: Date;

  @Prop({
    type: String,
    enum: Object.values(PaymentMethod),
    default: PaymentMethod.CASH,
  })
  paymentMethod: PaymentMethod;

  @Prop({ default: '', trim: true })
  description: string;

  @Prop({ default: '' })
  receipt: string;

  @Prop({ type: MongooseSchema.Types.ObjectId, ref: User.name })
  createdBy: User | string;
}

export const ExpenseSchema = SchemaFactory.createForClass(Expense);

ExpenseSchema.index({ date: -1 });
ExpenseSchema.index({ category: 1, date: -1 });
