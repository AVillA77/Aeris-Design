# Aeris Finance — CLAUDE.md

## Comportamiento esperado al terminar tareas

- Al terminar un bloque de trabajo, decir únicamente: **"Todo listo"** (o equivalente breve)
- Si hay errores pendientes de resolver, listarlos claramente
- NO enumerar todo lo que se implementó en el bloque

## Proyecto

Monorepo de finanzas personales y laborales. Rama de desarrollo: `claude/finance-tracker-app-FNHRB`.

## Stack

- **Backend:** Node.js + Express + PostgreSQL (apps/backend)
- **Web:** React + Vite + Zustand + Recharts + Tailwind CSS (apps/web)
- **Mobile:** React Native + Expo (apps/mobile)
- **Desktop:** Electron (apps/desktop)
- **Shared:** Tipos Zod compartidos (packages/shared)

## Comandos útiles

```bash
# Setup inicial (genera .env automáticamente)
pnpm setup

# Docker (opción recomendada)
docker-compose --env-file .env.docker up --build

# Desarrollo local
pnpm install
cd apps/backend && pnpm dev   # terminal 1
cd apps/web && pnpm dev       # terminal 2

# Tests
cd apps/backend && pnpm test
```

## Push

Usar siempre: `git push -u origin claude/finance-tracker-app-FNHRB`
