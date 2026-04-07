"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const core_1 = require("@nestjs/core");
const app_module_1 = require("../app.module");
const roles_service_1 = require("../roles/roles.service");
const users_service_1 = require("../users/users.service");
async function seed() {
    const app = await core_1.NestFactory.createApplicationContext(app_module_1.AppModule);
    const rolesService = app.get(roles_service_1.RolesService);
    const usersService = app.get(users_service_1.UsersService);
    const roleName = 'admin';
    let role = (await rolesService.findByName(roleName));
    if (!role) {
        role = await rolesService.createRole({
            name: roleName,
            description: 'Administrador con todos los permisos',
        });
        console.log('Rol admin creado', role);
    }
    else {
        console.log('Rol admin ya existe', role);
    }
    const roleId = role?.id;
    const adminEmail = 'admin@nextcore.app';
    const adminPassword = 'NextCore123!';
    let adminUser = await usersService.findByEmail(adminEmail);
    if (!adminUser) {
        adminUser = await usersService.createUser({
            email: adminEmail,
            password: adminPassword,
            firstName: 'Administrador',
            lastName: 'NextCore',
            roles: [roleId],
            isEmailVerified: true,
        });
        console.log('Usuario admin creado', { email: adminUser.email, id: adminUser.id });
    }
    else {
        console.log('Usuario admin ya existe', { email: adminUser.email, id: adminUser.id });
        if (!adminUser.roles?.some((r) => r.toString() === roleId?.toString())) {
            await usersService.updateUser(adminUser.id, { roles: [...(adminUser.roles || []), roleId] });
            console.log('Rol admin asignado a usuario existente');
        }
    }
    await app.close();
    process.exit(0);
}
seed().catch((error) => {
    console.error('Error al ejecutar seed-admin:', error);
    process.exit(1);
});
//# sourceMappingURL=seed-admin.js.map