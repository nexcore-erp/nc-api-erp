"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.UsersRepository = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const user_schema_1 = require("./schemas/user.schema");
let UsersRepository = class UsersRepository {
    constructor(userRepository) {
        this.userRepository = userRepository;
    }
    async create(user) {
        const created = this.userRepository.create(user);
        const saved = await this.userRepository.save(created);
        return Array.isArray(saved) ? saved[0] : saved;
    }
    async findByEmail(email) {
        return this.userRepository
            .createQueryBuilder('user')
            .leftJoinAndSelect('user.roles', 'role')
            .addSelect('user.password')
            .where('user.email = :email', { email })
            .getOne();
    }
    async findById(id) {
        return this.userRepository.findOne({ where: { id }, relations: ['roles'] });
    }
    async updateById(id, update) {
        const user = await this.userRepository.preload({ id, ...update });
        if (!user)
            return null;
        const saved = await this.userRepository.save(user);
        return Array.isArray(saved) ? saved[0] : saved;
    }
    async findByResetToken(token) {
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
    async findAll() {
        return this.userRepository.find({ relations: ['roles'] });
    }
};
exports.UsersRepository = UsersRepository;
exports.UsersRepository = UsersRepository = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(user_schema_1.User)),
    __metadata("design:paramtypes", [typeorm_2.Repository])
], UsersRepository);
//# sourceMappingURL=users.repository.js.map