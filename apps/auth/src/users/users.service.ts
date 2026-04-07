import { Injectable, ConflictException, NotFoundException } from '@nestjs/common';
import { UsersRepository } from './users.repository';
import { User } from './schemas/user.schema';
import * as bcrypt from 'bcrypt';

@Injectable()
export class UsersService {
  constructor(private readonly usersRepository: UsersRepository) {}

  async createUser(userData: Partial<User>): Promise<User> {
    const existingUser = await this.usersRepository.findByEmail(userData.email!);
    if (existingUser) {
      throw new ConflictException('User with this email already exists');
    }

    const hashedPassword = await bcrypt.hash(userData.password!, 12);
    const user = await this.usersRepository.create({
      ...userData,
      password: hashedPassword,
    });

    return user;
  }

  async findByEmail(email: string): Promise<User | null> {
    const user = await this.usersRepository.findByEmail(email);
    return user || null;
  }

  async findById(id: string): Promise<User | null> {
    const user = await this.usersRepository.findById(id);
    return user || null;
  }

  async updateUser(id: string, updateData: Partial<User>): Promise<User | null> {
    if (updateData.password) {
      updateData.password = await bcrypt.hash(updateData.password, 12);
    }
    const user = await this.usersRepository.updateById(id, updateData);
    return user || null;
  }

  async findAll(): Promise<User[]> {
    const users = await this.usersRepository.findAll();
    return users;
  }

  async validatePassword(plainPassword: string, hashedPassword: string): Promise<boolean> {
    return bcrypt.compare(plainPassword, hashedPassword);
  }
}