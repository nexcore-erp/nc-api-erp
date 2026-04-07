import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Role } from './schemas/role.schema';

@Injectable()
export class RolesService {
  constructor(
    @InjectRepository(Role) private roleRepository: Repository<Role>,
  ) {}

  async createRole(roleData: Partial<Role>): Promise<Role> {
    const role = this.roleRepository.create(roleData as any);
    const saved = await this.roleRepository.save(role as any);
    return Array.isArray(saved) ? (saved[0] as Role) : (saved as Role);
  }

  async findAll(): Promise<Role[]> {
    return this.roleRepository.find();
  }

  async findByName(name: string): Promise<Role | null> {
    return this.roleRepository.findOne({ where: { name } });
  }

  async findById(id: string): Promise<Role | null> {
    return this.roleRepository.findOne({ where: { id } });
  }

  async updateRole(id: string, updateData: Partial<Role>): Promise<Role | null> {
    const role = await this.roleRepository.preload({ id, ...(updateData as any) } as any);
    if (!role) return null;
    const saved = await this.roleRepository.save(role as any);
    return Array.isArray(saved) ? (saved[0] as Role) : (saved as Role);
  }

  async deleteRole(id: string): Promise<void> {
    await this.roleRepository.delete(id);
  }
}