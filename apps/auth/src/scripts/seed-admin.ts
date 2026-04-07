import { NestFactory } from '@nestjs/core';
import { AppModule } from '../app.module';
import { RolesService } from '../roles/roles.service';
import { UsersService } from '../users/users.service';

async function seed() {
  const app = await NestFactory.createApplicationContext(AppModule);
  const rolesService = app.get(RolesService);
  const usersService = app.get(UsersService);

  const roleName = 'admin';
  let role = (await rolesService.findByName(roleName)) as any;

  if (!role) {
    role = await rolesService.createRole({
      name: roleName,
      description: 'Administrador con todos los permisos',
    });
    console.log('Rol admin creado', role);
  } else {
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
  } else {
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