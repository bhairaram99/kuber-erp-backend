import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';
import { ProductStatus } from '../../common/enums/product-status.enum';
import { Category } from '../../categories/schemas/category.schema';
import { User } from '../../users/schemas/user.schema';

export type ProductDocument = Product & Document;

@Schema({ timestamps: true, collection: 'products' })
export class Product {
  @Prop({ required: true, trim: true, index: true })
  name: string;

  @Prop({ required: true, unique: true, uppercase: true, trim: true, index: true })
  sku: string;

  @Prop({ default: '', trim: true, index: true })
  barcode: string;

  @Prop({
    type: MongooseSchema.Types.ObjectId,
    ref: Category.name,
    required: true,
    index: true,
  })
  categoryId: Category | string;

  @Prop({ default: '', trim: true })
  description: string;

  // Wood specific attributes
  @Prop({ default: 'Teak', trim: true })
  woodType: string;

  @Prop({ default: 'A-Grade', trim: true })
  grade: string;

  @Prop({ default: 'Premium', trim: true })
  quality: string;

  @Prop({ default: 0 })
  thickness: number; // in mm or inches

  @Prop({ default: 0 })
  width: number; // in inches or mm

  @Prop({ default: 0 })
  length: number; // in feet or meters

  @Prop({ default: 'cft', trim: true })
  unit: string; // cft, sqft, piece, bundle, kg, etc.

  @Prop({ default: '', trim: true })
  color: string;

  @Prop({ default: 'Raw Sawn', trim: true })
  finish: string;

  @Prop({ default: 'Generic', trim: true })
  brand: string;

  // Pricing
  @Prop({ required: true, min: 0 })
  purchasePrice: number;

  @Prop({ required: true, min: 0 })
  sellingPrice: number;

  @Prop({ default: 0, min: 0 })
  wholesalePrice: number;

  @Prop({ default: 18, min: 0 })
  taxPercentage: number; // GST 18% standard for wood/timber in India

  // Inventory
  @Prop({ default: 0, min: 0 })
  openingStock: number;

  @Prop({ default: 0 })
  currentStock: number;

  @Prop({ default: 10, min: 0 })
  minimumStock: number;

  @Prop({ default: 1000, min: 0 })
  maximumStock: number;

  @Prop({ default: 'Main Yard - Rack A1', trim: true })
  location: string;

  @Prop({ default: '' })
  image: string;

  @Prop({
    type: String,
    enum: Object.values(ProductStatus),
    default: ProductStatus.ACTIVE,
    index: true,
  })
  status: ProductStatus;

  @Prop({ default: '', trim: true })
  notes: string;

  @Prop({ type: MongooseSchema.Types.ObjectId, ref: User.name })
  createdBy: User | string;

  @Prop({ type: MongooseSchema.Types.ObjectId, ref: User.name })
  updatedBy: User | string;
}

export const ProductSchema = SchemaFactory.createForClass(Product);

// Compound indexes for high search performance
ProductSchema.index({ name: 'text', description: 'text', woodType: 'text', sku: 'text' });
ProductSchema.index({ categoryId: 1, status: 1 });
ProductSchema.index({ currentStock: 1, minimumStock: 1 });
