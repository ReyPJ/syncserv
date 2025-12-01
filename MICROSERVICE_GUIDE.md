# MedControl Sync Microservice - Deployment Guide

Este documento proporciona instrucciones completas para crear y desplegar el microservicio de sincronización de MedControl en Railway.

## Índice

1. [Arquitectura](#arquitectura)
2. [Stack Tecnológico](#stack-tecnológico)
3. [Estructura del Proyecto](#estructura-del-proyecto)
4. [Código del Microservicio](#código-del-microservicio)
5. [Deployment en Railway](#deployment-en-railway)
6. [Variables de Entorno](#variables-de-entorno)
7. [Testing](#testing)

---

## Arquitectura

```
┌─────────────────┐         ┌──────────────────┐         ┌─────────────────┐
│   Electron App  │  HTTPS  │   Microservicio  │  Direct │   PostgreSQL    │
│   (SQLite)      │ ◄─────► │   (Node/Express) │ ◄─────► │   Multi-tenant  │
│   Local Data    │         │   Auth + Filter  │         │   Cloud Data    │
└─────────────────┘         └──────────────────┘         └─────────────────┘
```

**Flujo de Sincronización:**
1. Cliente autentica con JWT
2. Todas las requests incluyen `tenantId` extraído del token
3. Prisma automáticamente filtra queries por `tenantId`
4. El cliente compara `lastModified` timestamps
5. Gana el registro con timestamp más reciente

---

## Stack Tecnológico

- **Runtime:** Node.js 20+
- **Framework:** Express.js
- **ORM:** Prisma
- **Database:** PostgreSQL (Railway)
- **Auth:** JWT (jsonwebtoken + bcrypt)
- **Validación:** Zod
- **Logging:** Winston (opcional)

---

## Estructura del Proyecto

```
medcontrol-sync/
├── prisma/
│   └── schema.prisma          # Schema idéntico al de Electron (+ tenantId)
├── src/
│   ├── index.ts              # Entry point
│   ├── middleware/
│   │   ├── auth.ts           # JWT verification
│   │   └── tenantFilter.ts   # Auto-filter por tenantId
│   ├── routes/
│   │   ├── auth.ts           # Login/Register
│   │   ├── clientes.ts       # CRUD Clientes
│   │   ├── cases.ts          # CRUD Cases
│   │   └── invoices.ts       # CRUD Invoices
│   └── utils/
│       └── prismaExtension.ts # Prisma middleware
├── package.json
├── tsconfig.json
└── .env
```

---

## Código del Microservicio

### 1. `package.json`

\`\`\`json
{
  "name": "medcontrol-sync",
  "version": "1.0.0",
  "description": "MedControl Sync Microservice",
  "main": "dist/index.js",
  "scripts": {
    "dev": "tsx watch src/index.ts",
    "build": "tsc",
    "start": "node dist/index.js",
    "prisma:generate": "prisma generate",
    "prisma:migrate": "prisma migrate deploy"
  },
  "dependencies": {
    "express": "^4.18.2",
    "cors": "^2.8.5",
    "@prisma/client": "^5.22.0",
    "jsonwebtoken": "^9.0.2",
    "bcrypt": "^5.1.1",
    "zod": "^3.22.4",
    "dotenv": "^16.3.1"
  },
  "devDependencies": {
    "@types/express": "^4.17.21",
    "@types/cors": "^2.8.17",
    "@types/jsonwebtoken": "^9.0.5",
    "@types/bcrypt": "^5.0.2",
    "@types/node": "^20.10.0",
    "typescript": "^5.3.0",
    "tsx": "^4.7.0",
    "prisma": "^5.22.0"
  }
}
\`\`\`

### 2. `prisma/schema.prisma`

\`\`\`prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

// Tenant model for multi-tenancy
model Tenant {
  id        String   @id @default(cuid())
  email     String   @unique
  password  String   // hashed with bcrypt
  name      String?
  createdAt DateTime @default(now())
  
  clientes  Cliente[]
  cases     Case[]
  invoices  Invoice[]
}

model Cliente {
  id           Int       @id @default(autoincrement())
  tenantId     String
  nombre       String
  email        String?
  telefono     String?
  company      String?
  address      String?
  city         String?
  state        String?
  zipCode      String?
  country      String?
  standardPrice Float    @default(0)
  notes        String?
  createdAt    DateTime  @default(now())
  active       Boolean   @default(true)
  lastModified DateTime  @updatedAt
  lastSynced   DateTime?
  syncStatus   String    @default("synced")
  deviceId     String?

  tenant       Tenant    @relation(fields: [tenantId], references: [id], onDelete: Cascade)
  cases        Case[]

  @@index([tenantId])
  @@index([email])
  @@index([nombre])
}

model Case {
  id                Int       @id @default(autoincrement())
  tenantId          String
  clienteId         Int
  caseType          String
  status            String    @default("Active")
  billed            Boolean   @default(false)
  consultationCalls Int       @default(0)
  startDate         DateTime  @default(now())
  endDate           DateTime?
  notes             String?
  deleted           Boolean   @default(false)
  createdAt         DateTime  @default(now())
  lastModified      DateTime  @updatedAt
  lastSynced        DateTime?
  syncStatus        String    @default("synced")
  deviceId          String?

  tenant            Tenant    @relation(fields: [tenantId], references: [id], onDelete: Cascade)
  cliente           Cliente   @relation(fields: [clienteId], references: [id], onDelete: Cascade)
  invoices          Invoice[]

  @@index([tenantId])
  @@index([clienteId])
  @@index([status])
  @@index([caseType])
}

model Invoice {
  id            Int       @id @default(autoincrement())
  tenantId      String
  caseId        Int
  invoiceNumber String
  issueDate     DateTime
  dueDate       DateTime
  currency      String    @default("EUR")
  subtotal      Float
  taxRate       Float     @default(0)
  taxAmount     Float     @default(0)
  discount      Float     @default(0)
  total         Float
  status        String
  notes         String?
  paymentTerms  String?
  deleted       Boolean   @default(false)
  createdAt     DateTime  @default(now())
  lastModified  DateTime  @updatedAt
  lastSynced    DateTime?
  syncStatus    String    @default("synced")
  deviceId      String?

  tenant        Tenant    @relation(fields: [tenantId], references: [id], onDelete: Cascade)
  case          Case      @relation(fields: [caseId], references: [id], onDelete: Cascade)
  items         InvoiceItem[]

  @@index([tenantId])
  @@index([caseId])
  @@index([invoiceNumber])
  @@index([status])
}

model InvoiceItem {
  id          Int      @id @default(autoincrement())
  invoiceId   Int
  description String
  quantity    Int
  unitPrice   Float
  amount      Float
  patientName String?
  notes       String?
  lastModified DateTime @updatedAt
  syncStatus   String   @default("synced")
  deviceId     String?

  invoice     Invoice @relation(fields: [invoiceId], references: [id], onDelete: Cascade)

  @@index([invoiceId])
}
\`\`\`

### 3. `src/index.ts`

\`\`\`typescript
import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import authRoutes from './routes/auth'
import clientesRoutes from './routes/clientes'
import casesRoutes from './routes/cases'
import invoicesRoutes from './routes/invoices'

dotenv.config()

const app = express()
const PORT = process.env.PORT || 3000

// Middleware
app.use(cors())
app.use(express.json())

// Routes
app.use('/api/auth', authRoutes)
app.use('/api/clientes', clientesRoutes)
app.use('/api/cases', casesRoutes)
app.use('/api/invoices', invoicesRoutes)

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() })
})

app.listen(PORT, () => {
  console.log(\`🚀 Server running on port \${PORT}\`)
})
\`\`\`

### 4. `src/middleware/auth.ts`

\`\`\`typescript
import { Request, Response, NextFunction } from 'express'
import jwt from 'jsonwebtoken'

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production'

export interface AuthRequest extends Request {
  user?: {
    id: string
    email: string
    tenantId: string
  }
}

export function authMiddleware(req: AuthRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'No authorization token provided' })
  }

  const token = authHeader.substring(7)

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as {
      id: string
      email: string
      tenantId: string
    }

    req.user = decoded
    next()
  } catch (error) {
    return res.status(401).json({ message: 'Invalid or expired token' })
  }
}
\`\`\`

### 5. `src/middleware/tenantFilter.ts`

\`\`\`typescript
import { PrismaClient } from '@prisma/client'

const prismaBase = new PrismaClient()

export function createTenantPrismaClient(tenantId: string) {
  return prismaBase.$extends({
    query: {
      cliente: {
        async findMany({ args, query }) {
          args.where = { ...args.where, tenantId }
          return query(args)
        },
        async findFirst({ args, query }) {
          args.where = { ...args.where, tenantId }
          return query(args)
        },
        async findUnique({ args, query }) {
          args.where = { ...args.where, tenantId }
          return query(args)
        },
        async create({ args, query }) {
          args.data = { ...args.data, tenantId }
          return query(args)
        },
        async update({ args, query }) {
          args.where = { ...args.where, tenantId }
          return query(args)
        },
        async delete({ args, query }) {
          args.where = { ...args.where, tenantId }
          return query(args)
        }
      },
      case: {
        async findMany({ args, query }) {
          args.where = { ...args.where, tenantId }
          return query(args)
        },
        async create({ args, query }) {
          args.data = { ...args.data, tenantId }
          return query(args)
        },
        async update({ args, query }) {
          args.where = { ...args.where, tenantId }
          return query(args)
        }
      },
      invoice: {
        async findMany({ args, query }) {
          args.where = { ...args.where, tenantId }
          return query(args)
        },
        async create({ args, query }) {
          args.data = { ...args.data, tenantId }
          return query(args)
        },
        async update({ args, query }) {
          args.where = { ...args.where, tenantId }
          return query(args)
        }
      }
    }
  })
}

export { prismaBase as prisma }
\`\`\`

### 6. `src/routes/auth.ts`

\`\`\`typescript
import { Router } from 'express'
import bcrypt from 'bcrypt'
import jwt from 'jsonwebtoken'
import { prisma } from '../middleware/tenantFilter'

const router = Router()
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production'

// Register
router.post('/register', async (req, res) => {
  try {
    const { email, password, name } = req.body

    // Check if user exists
    const existing = await prisma.tenant.findUnique({ where: { email } })
    if (existing) {
      return res.status(400).json({ message: 'Email already registered' })
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10)

    // Create tenant
    const tenant = await prisma.tenant.create({
      data: {
        email,
        password: hashedPassword,
        name
      }
    })

    // Generate token
    const token = jwt.sign(
      { id: tenant.id, email: tenant.email, tenantId: tenant.id },
      JWT_SECRET,
      { expiresIn: '30d' }
    )

    res.json({
      success: true,
      user: {
        id: tenant.id,
        email: tenant.email,
        name: tenant.name,
        tenantId: tenant.id,
        token
      },
      token
    })
  } catch (error) {
    console.error('Register error:', error)
    res.status(500).json({ success: false, message: 'Registration failed' })
  }
})

// Login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body

    // Find tenant
    const tenant = await prisma.tenant.findUnique({ where: { email } })
    if (!tenant) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' })
    }

    // Verify password
    const valid = await bcrypt.compare(password, tenant.password)
    if (!valid) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' })
    }

    // Generate token
    const token = jwt.sign(
      { id: tenant.id, email: tenant.email, tenantId: tenant.id },
      JWT_SECRET,
      { expiresIn: '30d' }
    )

    res.json({
      success: true,
      user: {
        id: tenant.id,
        email: tenant.email,
        name: tenant.name,
        tenantId: tenant.id,
        token
      },
      token
    })
  } catch (error) {
    console.error('Login error:', error)
    res.status(500).json({ success: false, message: 'Login failed' })
  }
})

// Verify token
router.get('/verify', async (req, res) => {
  const authHeader = req.headers.authorization
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ valid: false })
  }

  const token = authHeader.substring(7)
  try {
    jwt.verify(token, JWT_SECRET)
    res.json({ valid: true })
  } catch {
    res.status(401).json({ valid: false })
  }
})

export default router
\`\`\`

### 7. `src/routes/clientes.ts`

\`\`\`typescript
import { Router } from 'express'
import { authMiddleware, AuthRequest } from '../middleware/auth'
import { createTenantPrismaClient } from '../middleware/tenantFilter'

const router = Router()

// Apply auth middleware to all routes
router.use(authMiddleware)

// GET all clientes
router.get('/', async (req: AuthRequest, res) => {
  try {
    const prisma = createTenantPrismaClient(req.user!.tenantId)
    const clientes = await prisma.cliente.findMany({
      orderBy: { nombre: 'asc' }
    })
    res.json(clientes)
  } catch (error) {
    console.error('Error fetching clientes:', error)
    res.status(500).json({ error: 'Failed to fetch clientes' })
  }
})

// PUT update cliente by ID
router.put('/:id', async (req: AuthRequest, res) => {
  try {
    const { id } = req.params
    const prisma = createTenantPrismaClient(req.user!.tenantId)
    
    const cliente = await prisma.cliente.update({
      where: { id: parseInt(id) },
      data: req.body
    })
    
    res.json(cliente)
  } catch (error) {
    console.error('Error updating cliente:', error)
    res.status(500).json({ error: 'Failed to update cliente' })
  }
})

// POST create cliente
router.post('/', async (req: AuthRequest, res) => {
  try {
    const prisma = createTenantPrismaClient(req.user!.tenantId)
    const cliente = await prisma.cliente.create({
      data: req.body
    })
    res.json(cliente)
  } catch (error) {
    console.error('Error creating cliente:', error)
    res.status(500).json({ error: 'Failed to create cliente' })
  }
})

export default router
\`\`\`

### 8. `src/routes/cases.ts` y `src/routes/invoices.ts`

**Similar a `clientes.ts`**, implementar los mismos endpoints (GET, POST, PUT) con el mismo patrón de autenticación y tenant filtering.

---

## Deployment en Railway

### Paso 1: Crear cuenta en Railway
1. Ve a https://railway.app/
2. Sign up con GitHub

### Paso 2: Crear nuevo proyecto
1. Click "New Project"
2. Selecciona "Deploy from GitHub repo"
3. Selecciona tu repositorio del microservicio

### Paso 3: Agregar PostgreSQL
1. En el proyecto, click "New"
2. Selecciona "Database" → "PostgreSQL"
3. Railway automáticamente creará la variable `DATABASE_URL`

### Paso 4: Configurar Variables de Entorno

En el dashboard de Railway, agrega:

\`\`\`env
NODE_ENV=production
JWT_SECRET=<genera-un-secret-seguro-aquí>
DATABASE_URL=${{Postgres.DATABASE_URL}}  # Auto-generated
PORT=3000
\`\`\`

### Paso 5: Configurar Build Command

En Settings → Deploy:
- **Build Command:** `npm install && npx prisma generate && npm run build`
- **Start Command:** `npx prisma migrate deploy && npm start`

### Paso 6: Deploy

1. Push tu código a GitHub
2. Railway automáticamente detectará cambios y deployará
3. Obtén la URL pública en Settings → Domains

---

## Variables de Entorno

### Electron App (.env local)

\`\`\`env
SYNC_API_URL=https://tu-app.railway.app
\`\`\`

### Microservicio (Railway)

\`\`\`env
NODE_ENV=production
DATABASE_URL=postgresql://...  # Auto-generated por Railway
JWT_SECRET=your-super-secret-jwt-key-min-32-chars
PORT=3000
\`\`\`

---

## Testing

### 1. Test de Auth

\`\`\`bash
# Register
curl -X POST https://tu-app.railway.app/api/auth/register \\
  -H "Content-Type: application/json" \\
  -d '{
    "email": "test@example.com",
    "password": "password123",
    "name": "Test User"
  }'

# Login
curl -X POST https://tu-app.railway.app/api/auth/login \\
  -H "Content-Type: application/json" \\
  -d '{
    "email": "test@example.com",
    "password": "password123"
  }'
\`\`\`

### 2. Test de Sync

\`\`\`bash
# Obtén token del login response
TOKEN="tu-jwt-token-aquí"

# Fetch clientes
curl https://tu-app.railway.app/api/clientes \\
  -H "Authorization: Bearer $TOKEN"

# Update cliente
curl -X PUT https://tu-app.railway.app/api/clientes/1 \\
  -H "Authorization: Bearer $TOKEN" \\
  -H "Content-Type: application/json" \\
  -d '{
    "nombre": "Updated Name",
    "email": "updated@example.com"
  }'
\`\`\`

---

## Próximos Pasos

1. **Actualizar URL en Electron:**
   - Edita `src/main/services/authService.ts`
   - Cambia `DEFAULT_API_URL` a tu URL de Railway

2. **Probar sincronización:**
   - Ejecuta `npm run dev` en Electron
   - Click en "Sync Now" en el sidebar
   - Verifica que los datos se sincronicen

3. **Monitoreo:**
   - Railway provee logs en tiempo real
   - Monitorea errores y performance en el dashboard

---

## Notas Importantes

- **JWT Secret:** Usa un string aleatorio de al menos 32 caracteres
- **CORS:** El código incluye CORS abierto (`cors()`). En producción, especifica origins:
  \`\`\`typescript
  app.use(cors({
    origin: ['https://tu-dominio.com']
  }))
  \`\`\`
- **Rate Limiting:** Considera agregar `express-rate-limit` para prevenir abuso
- **Validation:** Usa Zod para validar inputs en todos los endpoints

---

## Soporte

Si encuentras problemas:
1. Revisa logs en Railway dashboard
2. Verifica que `DATABASE_URL` y `JWT_SECRET` estén configurados
3. Asegúrate que las migraciones se ejecutaron correctamente

¡Listo! Tu sistema de sincronización multi-tenant está completo.
