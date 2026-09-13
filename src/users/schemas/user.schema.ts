import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';
import { UserStatus } from '../../common/enums/user-status.enum';
import { Role } from '../../roles/schemas/role.schema';

export type UserDocument = User & Document;

@Schema({ timestamps: true, collection: 'users' })
export class User {
  @Prop({ required: true, trim: true })
  name: string;

  @Prop({ required: true, unique: true, lowercase: true, trim: true, index: true })
  email: string;

  @Prop({ default: '', trim: true })
  phone: string;

  @Prop({ required: true })
  passwordHash: string;

  @Prop({ type: MongooseSchema.Types.ObjectId, ref: Role.name, required: true, index: true })
  role: Role | string;

  @Prop({
    type: String,
    enum: Object.values(UserStatus),
    default: UserStatus.ACTIVE,
    index: true,
  })
  status: UserStatus;

  @Prop({ default: '' })
  avatar: string;

  @Prop({ default: null })
  lastLoginAt: Date;
}

export const UserSchema = SchemaFactory.createForClass(User);

// Ensure passwordHash is not returned in default queries unless explicitly asked
UserSchema.set('toJSON', {
  transform: (_, ret) => {
    delete ret.passwordHash;
    return ret;
  },
});
