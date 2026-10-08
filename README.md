# Better Auth Service

Microservicio de autenticación central (Identity Provider) para el sistema ASTC.

## Stack Tecnológico

- Node.js + Express
- TypeScript
- Prisma ORM
- PostgreSQL
- JWT (RS256)
- bcryptjs

## Descripción

El Better Auth Service es el **proveedor de identidad central** del sistema ASTC. Maneja:

- Autenticación de usuarios (login)
- Validación de contraseñas con bcrypt
- Generación de tokens JWT (RS256)
- Validación de sesiones (/me)
- Control de acceso basado en roles (RBAC)

**Puerto:** 3010

## Arquitectura

```
better-auth/
├── src/
│   ├── index.ts           # Entry point (Express)
│   ├── db.ts              # Prisma client
│   ├── middleware/
│   │   └── authMiddleware.ts  # JWT validation
│   └── routes/
│       └── me.ts          # /me endpoint
├── prisma/                # Prisma schema
├── private.pem            # Private key JWT (RS256)
└── public.pem             # Public key JWT
```

## Endpoints

### POST /login

Autenticar usuario y retornar token JWT.

**Request:**
```json
{
  "email": "user@astc.com",
  "password": "123456"
}
```

**Response:**
```json
{
  "token": "jwt_token_here",
  "user": {
    "id": "uuid",
    "email": "user@astc.com",
    "username": "user",
    "role": {
      "id": "uuid",
      "code": "TEAM_MEMBER",
      "name": "Team Member"
    }
  }
}
```

### GET /me

Obtener información del usuario autenticado.

**Headers:**
```
Authorization: Bearer <token>
```

**Response:**
```json
{
  "user": {
    "sub": "uuid",
    "email": "user@astc.com",
    "role": "TEAM_MEMBER",
    "iat": 1700000000,
    "exp": 1800000000
  }
}
```

## Variables de Entorno

| Variable | Descripción | Default |
|----------|-------------|---------|
| `DATABASE_URL` | URL de conexión PostgreSQL | - |
| `JWT_SECRET` | Secreto para firmar JWT | - |
| `PORT` | Puerto del servidor | `3010` |

## JWT Payload

```json
{
  "sub": "user_id",
  "email": "user@astc.com",
  "username": "user",
  "firstName": "John",
  "lastName": "Doe",
  "role": "TEAM_MEMBER",
  "groups": ["TEAM_MEMBER"],
  "iat": 1700000000,
  "exp": 1800000000,
  "issuer": "better-auth-verify"
}
```

**Expiración:** 24 horas

## Base de Datos

### Tabla users

| Campo | Tipo | Descripción |
|-------|------|-------------|
| id | UUID | Identificador único |
| username | String | Nombre de usuario (único) |
| email | String | Email (único) |
| password_hash | String | Hash bcrypt de contraseña |
| first_name | String | Nombre |
| last_name | String | Apellido |
| full_name | String | Nombre completo |
| phone | String | Teléfono |
| avatar_url | String | URL de avatar |
| role_id | UUID | FK → roles.id |
| created_at | DateTime | Fecha de creación |
| updated_at | DateTime | Fecha de actualización |
| deleted_at | DateTime | Soft delete |

### Tabla roles

| Campo | Tipo | Descripción |
|-------|------|-------------|
| id | UUID | Identificador único |
| code | String | Código del rol |
| name | String | Nombre del rol |

### Roles disponibles

| Código | Nombre |
|--------|--------|
| ADMIN | Administrator |
| PROJECT_MANAGER | Project Manager |
| TEAM_MEMBER | Team Member |

## Ejecución Local

```bash
# Instalar dependencias
npm install

# Ejecutar migraciones
npx prisma migrate dev

# Desarrollo
npm run dev

# Build
npm run build

# Producción
npm start
```

## Docker

```bash
# Puerto mapeado: 3010:3010
docker compose up -d better-auth
```

## Seguridad

- Contraseñas hasheadas con bcryptjs
- JWT firmado con RS256 (clave privada)
- Middleware de autenticación en rutas protegidas
- Stateless authentication (sin sesiones en servidor)
- Roles embebidos en el token

## Integraciones

- **frontend-auth**: Consumo del endpoint /login
- **Gateway (Apollo)**: Validación de JWT para routing
- **assistance-service**: Validación de JWT
- **project-assistance-service**: Validación de JWT
- **backoffice-service**: Validación de JWT

## Generar Claves JWT

```bash
# Generar clave privada
openssl genrsa -out private.pem 2048

# Generar clave pública
openssl rsa -in private.pem -pubout -out public.pem
```
