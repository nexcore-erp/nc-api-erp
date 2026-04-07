import { UsersRepository } from './users.repository';
import { User } from './schemas/user.schema';
export declare class UsersService {
    private readonly usersRepository;
    constructor(usersRepository: UsersRepository);
    createUser(userData: Partial<User>): Promise<User>;
    findByEmail(email: string): Promise<User | null>;
    findById(id: string): Promise<User | null>;
    updateUser(id: string, updateData: Partial<User>): Promise<User | null>;
    findAll(): Promise<User[]>;
    validatePassword(plainPassword: string, hashedPassword: string): Promise<boolean>;
}
