#!/bin/bash
echo "=== Verificación del Proyecto MedControl Sync ==="
echo ""
echo "1. Verificando schema de Prisma..."
npx prisma validate
echo ""
echo "2. Verificando compilación TypeScript..."
npx tsc --noEmit
echo ""
echo "3. Archivos generados:"
ls -lh dist/*.js 2>/dev/null || echo "No compilado aún - ejecuta npm run build"
echo ""
echo "✅ Verificación completa"
