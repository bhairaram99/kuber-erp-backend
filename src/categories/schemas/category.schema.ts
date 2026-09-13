import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';
import { ProductStatus } from '../../common/enums/product-status.enum';
import { User } from '../../users/schemas/user.schema';

export type CategoryDocument = Category & Document;

@Schema({ timestamps: true, collection: 'categories' })
export class Category {
  @Prop({ required: true, unique: true, trim: true, index: true })
  name: string;

  @Prop({ default: '', trim: true })
  description: string;

  @Prop({
    type: String,
    enum: Object.values(ProductStatus),
    default: ProductStatus.ACTIVE,
    index: true,
  })
  status: ProductStatus;

  @Prop({ type: MongooseSchema.Types.ObjectId, ref: User.name })
  createdBy: User | string;

  @Prop({ type: MongooseSchema.Types.ObjectId, ref: User.name })
  updatedBy: User | string;
}

export const CategorySchema = SchemaFactory.createForClass(Category);
