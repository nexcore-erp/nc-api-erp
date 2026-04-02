import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Role, RoleDocument } from './schemas/role.schema';

@Injectable()
export class RolesService {
  constructor(
    @InjectModel(Role.name) private roleModel: Model<RoleDocument>,
  ) {}

  async createRole(roleData: Partial<Role>): Promise<Role> {
    const role = new this.roleModel(roleData);
    return role.save();
  }

  async findAll(): Promise<Role[]> {
    return this.roleModel.find().exec();
  }

  async findByName(name: string): Promise<Role | null> {
    const role = await this.roleModel.findOne({ name }).exec();
    return role ? role.toObject() : null;
  }

  async findById(id: string): Promise<Role | null> {
    const role = await this.roleModel.findById(id).exec();
    return role ? role.toObject() : null;
  }

  async updateRole(id: string, updateData: Partial<Role>): Promise<Role | null> {
    const role = await this.roleModel.findByIdAndUpdate(id, updateData, { new: true }).exec();
    return role ? role.toObject() : null;
  }

  async deleteRole(id: string): Promise<void> {
    await this.roleModel.findByIdAndDelete(id).exec();
  }
}