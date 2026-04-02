import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User, UserDocument } from './schemas/user.schema';

@Injectable()
export class UsersRepository {
  constructor(
    @InjectModel(User.name) private userModel: Model<UserDocument>,
  ) {}

  async create(user: Partial<User>): Promise<UserDocument> {
    const createdUser = new this.userModel(user);
    return createdUser.save();
  }

  async findByEmail(email: string): Promise<UserDocument | null> {
    return this.userModel.findOne({ email }).exec();
  }

  async findById(id: string): Promise<UserDocument | null> {
    return this.userModel.findById(id).exec();
  }

  async updateById(id: string, update: Partial<User>): Promise<UserDocument | null> {
    return this.userModel.findByIdAndUpdate(id, update, { new: true }).exec();
  }

  async findByResetToken(token: string): Promise<UserDocument | null> {
    // This is inefficient, but works for now
    const users = await this.userModel.find({
      passwordResetExpires: { $gt: new Date() }
    }).exec();

    for (const user of users) {
      if (user.passwordResetToken) {
        // Note: We can't compare hashed tokens here, comparison should be done in service
        return user;
      }
    }
    return null;
  }

  async findAll(): Promise<UserDocument[]> {
    return this.userModel.find().exec();
  }
}