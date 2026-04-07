import { Repository } from 'typeorm';
import { Role } from './schemas/role.schema';
export declare class RolesService {
    private roleRepository;
    constructor(roleRepository: Repository<Role>);
    createRole(roleData: Partial<Role>): Promise<Role>;
    findAll(): Promise<Role[]>;
    findByName(name: string): Promise<Role | null>;
    findById(id: string): Promise<Role | null>;
    updateRole(id: string, updateData: Partial<Role>): Promise<Role | null>;
    deleteRole(id: string): Promise<void>;
}
