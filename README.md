# MedControl Sync Microservice

Microservicio de sincronización multi-tenant para MedControl, desplegado en Railway con PostgreSQL.

## Características

- 🔐 Autenticación JWT
- 👥 Multi-tenancy automático
- 🔄 Sincronización bidireccional
- 🚀 Deploy en Railway
- 📊 PostgreSQL como base de datos
- 🔒 Filtrado automático por tenant

## Requisitos Previos

- Node.js 20+
- npm o yarn
- Cuenta en Railway (para deployment)

## Instalación Local

```bash
# Instalar dependencias
npm install

# Generar Prisma client
npm run prisma:generate

# Configurar variables de entorno
cp .env.example .env
# Edita .env con tu DATABASE_URL y JWT_SECRET
```

## Desarrollo

```bash
# Ejecutar en modo desarrollo
npm run dev
```

El servidor estará disponible en `http://localhost:3000`

## Build para Producción

```bash
# Compilar TypeScript
npm run build

# Ejecutar en producción
npm start
```

## Deployment en Railway

### 1. Crear Proyecto

1. Ve a https://railway.app/
2. Sign up con GitHub
3. Click "New Project"
4. Selecciona "Deploy from GitHub repo"

### 2. Agregar PostgreSQL

1. En el proyecto, click "New"
2. Selecciona "Database" → "PostgreSQL"
3. Railway creará automáticamente `DATABASE_URL`

### 3. Variables de Entorno

Agrega en Settings → Variables:

```env
NODE_ENV=production
JWT_SECRET=<genera-un-secret-seguro-de-32+-caracteres>
DATABASE_URL=${{Postgres.DATABASE_URL}}
PORT=3000
```

### 4. Configurar Build

En Settings → Deploy:

- **Build Command:** `npm install && npx prisma generate && npm run build`
- **Start Command:** `npx prisma migrate deploy && npm start`

### 5. Deploy

Push a GitHub y Railway desplegará automáticamente.

## API Endpoints

### Autenticación

```bash
POST /api/auth/register
POST /api/auth/login
GET  /api/auth/verify
```

### Clientes

```bash
GET    /api/clientes
GET    /api/clientes/:id
POST   /api/clientes
PUT    /api/clientes/:id
DELETE /api/clientes/:id
```

### Cases

```bash
GET    /api/cases
GET    /api/cases/:id
POST   /api/cases
PUT    /api/cases/:id
DELETE /api/cases/:id
```

### Invoices

```bash
GET    /api/invoices
GET    /api/invoices/:id
POST   /api/invoices
PUT    /api/invoices/:id
DELETE /api/invoices/:id
```

## Testing

### Registro

```bash
curl -X POST https://your-app.railway.app/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "password123",
    "name": "Test User"
  }'
```

### Login

```bash
curl -X POST https://your-app.railway.app/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "password123"
  }'
```

### Obtener Clientes

```bash
curl https://your-app.railway.app/api/clientes \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

## Arquitectura

```
┌─────────────────┐         ┌──────────────────┐         ┌─────────────────┐
│   Electron App  │  HTTPS  │   Microservicio  │  Direct │   PostgreSQL    │
│   (SQLite)      │ ◄─────► │   (Node/Express) │ ◄─────► │   Multi-tenant  │
│   Local Data    │         │   Auth + Filter  │         │   Cloud Data    │
└─────────────────┘         └──────────────────┘         └─────────────────┘
```

## Seguridad

- JWT con expiración de 30 días
- Passwords hasheados con bcrypt (10 rounds)
- Filtrado automático por tenant en todas las queries
- CORS configurado (ajustar para producción)

## Scripts Disponibles

- `npm run dev` - Desarrollo con hot reload
- `npm run build` - Compilar TypeScript
- `npm start` - Ejecutar en producción
- `npm run prisma:generate` - Generar Prisma client
- `npm run prisma:migrate` - Ejecutar migraciones

## Estructura del Proyecto

```
medcontrol-sync/
├── prisma/
│   └── schema.prisma          # Schema multi-tenant
├── src/
│   ├── index.ts              # Entry point
│   ├── middleware/
│   │   ├── auth.ts           # JWT verification
│   │   └── tenantFilter.ts   # Filtrado por tenant
│   └── routes/
│       ├── auth.ts           # Autenticación
│       ├── clientes.ts       # CRUD Clientes
│       ├── cases.ts          # CRUD Cases
│       └── invoices.ts       # CRUD Invoices
├── package.json
├── tsconfig.json
└── .env
```

## Troubleshooting

### Error de conexión a base de datos

Verifica que `DATABASE_URL` esté correctamente configurado en Railway.

### Token inválido

Asegúrate de que `JWT_SECRET` sea el mismo en todas las instancias.

### Migraciones no aplicadas

Ejecuta manualmente: `npx prisma migrate deploy`

## Licencia

Privado - MedControl

## Soporte

Para problemas o preguntas, revisa los logs en Railway dashboard.
