# NextCore ERP - Auth Microservice

Microservicio de autenticación para NextCore ERP construido con NestJS, MongoDB, Redis y RabbitMQ.

## Características

- Autenticación JWT con Access y Refresh Tokens
- Registro y gestión de usuarios
- Roles y permisos (RBAC)
- Recuperación de contraseña por email
- Autenticación de dos factores (2FA) con TOTP
- Blacklist de tokens en Redis
- Rate limiting
- Comunicación vía RabbitMQ

## Stack Tecnológico

- **Framework**: NestJS 10+
- **Base de datos**: MongoDB 7+ con Mongoose
- **Cache/Tokens**: Redis 7+ con ioredis
- **Mensajería**: RabbitMQ con @nestjs/microservices
- **Autenticación**: Passport.js + @nestjs/jwt
- **2FA**: otplib + qrcode
- **Email**: Nodemailer + Handlebars
- **Validación**: class-validator + class-transformer
- **Hashing**: bcrypt (rounds: 12)

## Instalación

1. Clona el repositorio
2. Instala dependencias:
   ```bash
   npm install
   ```

3. Configura las variables de entorno en `.env` (copia de `.env.example`)

4. Levanta los servicios con Docker:
   ```bash
   docker-compose up -d
   ```

5. Ejecuta el proyecto:
   ```bash
   npm run start:dev
   ```

## Endpoints API

### Autenticación
- `POST /auth/login` - Login de usuario
- `POST /auth/logout` - Logout
- `POST /auth/refresh` - Refrescar tokens
- `POST /auth/register` - Registro de usuario
- `POST /auth/forgot-password` - Solicitar reset de contraseña
- `POST /auth/reset-password` - Resetear contraseña
- `GET /auth/2fa/setup` - Configurar 2FA
- `POST /auth/2fa/confirm` - Confirmar 2FA
- `POST /auth/2fa/disable` - Deshabilitar 2FA
- `GET /auth/me` - Perfil del usuario actual

## Documentación API

La documentación Swagger está disponible en `http://localhost:3001/api` cuando el servicio está ejecutándose.

## Arquitectura

El microservicio sigue una arquitectura limpia con:

- **Controllers**: Manejan las peticiones HTTP
- **Services**: Contienen la lógica de negocio
- **Repositories**: Abstracción de la base de datos
- **Strategies**: Estrategias de Passport para autenticación
- **Guards**: Protección de rutas
- **DTOs**: Validación de datos de entrada
- **Modules**: Organización modular

## Seguridad

- Passwords hasheados con bcrypt (12 rounds)
- Refresh tokens almacenados hasheados en Redis
- JTI único por token para invalidación
- Rate limiting en endpoints sensibles
- Bloqueo de cuenta tras 5 intentos fallidos
- Headers de seguridad con Helmet
- Sanitización de inputs

## Eventos RabbitMQ

El servicio publica los siguientes eventos:

- `user.registered`
- `user.logged_in`
- `user.logged_out`
- `user.password_changed`
- `user.2fa_enabled`
- `user.account_locked`

## Desarrollo

### Comandos disponibles

- `npm run start:dev` - Modo desarrollo con hot reload
- `npm run build` - Compilar para producción
- `npm run test` - Ejecutar tests
- `npm run lint` - Ejecutar linter

### Estructura del proyecto

```
apps/auth/src/
├── auth/           # Módulo de autenticación
├── users/          # Gestión de usuarios
├── tokens/         # Gestión de tokens en Redis
├── roles/          # Roles y permisos
├── mail/           # Servicio de email
├── two-factor/     # Autenticación de dos factores
├── config/         # Configuraciones
└── main.ts         # Punto de entrada
```

## Contribución

1. Crea una rama para tu feature
2. Implementa los cambios
3. Asegúrate de que los tests pasan
4. Crea un Pull Request

## Licencia

Este proyecto está bajo la Licencia UNLICENSED.
