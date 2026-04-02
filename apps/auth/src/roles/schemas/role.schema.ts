import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type RoleDocument = Role & Document;

@Schema({ timestamps: true, collection: 'roles' })
export class Role {
  @Prop({ required: true, unique: true, uppercase: true })
  name: string;                              // 'ADMIN' | 'MANAGER' | 'USER' | 'VIEWER'

  @Prop({ type: [String], default: [] })
  permissions: string[];                     // 'inventory:read', 'sales:write', etc.

  @Prop()
  description?: string;
}

export const RoleSchema = SchemaFactory.createForClass(Role);