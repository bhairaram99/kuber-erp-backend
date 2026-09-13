import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import { ProductStatus } from '../../common/enums/product-status.enum';

export type SupplierDocument = Supplier & Document;

@Schema({ timestamps: true, collection: 'suppliers' })
export class Supplier {
  @Prop({ required: true, unique: true, uppercase: true, trim: true, index: true })
  supplierCode: string;

  @Prop({ required: true, trim: true, index: true })
  name: string;

  @Prop({ default: '', trim: true, index: true })
  phone: string;

  @Prop({ default: '', lowercase: true, trim: true, index: true })
  email: string;

  @Prop({ default: '', trim: true })
  company: string;

  @Prop({ default: '', trim: true })
  address: string;

  @Prop({ default: '', trim: true })
  taxNumber: string;

  @Prop({ default: 0 })
  totalPurchases: number;

  @Prop({ default: 0 })
  totalPaid: number;

  @Prop({ default: 0 })
  totalDue: number;

  @Prop({ default: '', trim: true })
  notes: string;

  @Prop({
    type: String,
    enum: Object.values(ProductStatus),
    default: ProductStatus.ACTIVE,
    index: true,
  })
  status: ProductStatus;
}

export const SupplierSchema = SchemaFactory.createForClass(Supplier);

SupplierSchema.index({ name: 'text', company: 'text', supplierCode: 'text' });
