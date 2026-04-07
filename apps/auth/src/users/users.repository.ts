import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './schemas/user.schema';

@Injectable()
export class UsersRepository {
  constructor(
    @InjectRepository(User) private userRepository: Repository<User>,
  ) {}

  async create(user: Partial<User>): Promise<User> {
    const created = this.userRepository.create(user as any);
    const saved = await this.userRepository.save(created as any);
    return Array.isArray(saved) ? (saved[0] as User) : (saved as User);
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.userRepository
      .createQueryBuilder('user')
      .leftJoinAndSelect('user.roles', 'role')
      .addSelect('user.password')
      .where('user.email = :email', { email })
      .getOne();
  }

  async findById(id: string): Promise<User | null> {
    return this.userRepository.findOne({ where: { id }, relations: ['roles'] });
  }

  async updateById(id: string, update: Partial<User>): Promise<User | null> {
    const user = await this.userRepository.preload({ id, ...(update as any) } as any);
    if (!user) return null;
    const saved = await this.userRepository.save(user as any);
    return Array.isArray(saved) ? (saved[0] as User) : (saved as User);
  }

  async findByResetToken(token: string): Promise<User | null> {
    // keep previous inefficient approach: find users with valid expiry and let service compare hashed token
    const users = await this.userRepository
      .createQueryBuilder('user')
      .where('user.passwordResetExpires > :now', { now: new Date() })
      .getMany();

    for (const user of users) {
      if (user.passwordResetToken) {
        return user;
      }
    }
    return null;
  }

  async findAll(): Promise<User[]> {
    return this.userRepository.find({ relations: ['roles'] });
  }
}