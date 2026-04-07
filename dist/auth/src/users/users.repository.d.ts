import { Repository } from 'typeorm';
import { User } from './schemas/user.schema';
export declare class UsersRepository {
    private userRepository;
    constructor(userRepository: Repository<User>);
    create(user: Partial<User>): Promise<User>;
    findByEmail(email: string): Promise<User | null>;
    findById(id: string): Promise<User | null>;
    updateById(id: string, update: Partial<User>): Promise<User | null>;
    findByResetToken(token: string): Promise<User | null>;
    findAll(): Promise<User[]>;
}
