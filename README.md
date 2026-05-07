# Aeris Finance - Personal Finance Tracker

A comprehensive finance management application for tracking personal and business expenses across multiple platforms (Web, Mobile, Desktop).

## Features

- 📊 **Dashboard** - Visual overview of your finances with charts and statistics
- 💰 **Transaction Management** - Record income and expense transactions
- 🏷️ **Categories** - Organize transactions with custom categories
- 💵 **Budgeting** - Set and track budgets by category
- 📈 **Reports** - Detailed financial reports and analytics
- 👥 **Multi-User** - Shared wallets for families or business teams
- 🔐 **Secure** - JWT authentication and encrypted data

## Project Structure

```
aeris-finance/
├── apps/
│   ├── backend/      # Node.js + Express API
│   ├── web/          # React web application
│   ├── mobile/       # React Native app
│   └── desktop/      # Electron desktop app
├── packages/
│   ├── shared/       # Shared types and utilities
│   └── ui/           # Shared UI components
└── docs/            # Documentation
```

## Tech Stack

### Backend
- Node.js + Express
- PostgreSQL (Database)
- JWT (Authentication)
- TypeScript

### Frontend (Web)
- React 18
- React Router
- Zustand (State Management)
- Recharts (Charts)
- Tailwind CSS

### Mobile
- React Native + Expo
- React Navigation
- Zustand

### Desktop
- Electron
- React + Vite

## Getting Started

### Prerequisites
- Node.js >= 18.0.0
- pnpm >= 8.0.0
- PostgreSQL (for backend)

### Installation

1. **Clone the repository**
```bash
git clone <repository-url>
cd aeris-finance
```

2. **Install dependencies**
```bash
pnpm install
```

3. **Setup environment variables**
```bash
cp .env.example .env
# Edit .env with your configuration
```

4. **Setup database**
```bash
# TODO: Add database migration instructions
```

### Development

#### Start all services
```bash
pnpm dev
```

#### Start individual services
```bash
# Backend
cd apps/backend && pnpm dev

# Web
cd apps/web && pnpm dev

# Mobile
cd apps/mobile && pnpm dev

# Desktop
cd apps/desktop && pnpm dev
```

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `POST /api/auth/logout` - Logout user
- `POST /api/auth/refresh-token` - Refresh JWT token

### Transactions
- `GET /api/transactions` - Get all transactions
- `POST /api/transactions` - Create transaction
- `PUT /api/transactions/:id` - Update transaction
- `DELETE /api/transactions/:id` - Delete transaction

### Categories
- `GET /api/categories` - Get all categories
- `POST /api/categories` - Create category
- `PUT /api/categories/:id` - Update category
- `DELETE /api/categories/:id` - Delete category

### Budgets
- `GET /api/budgets` - Get all budgets
- `POST /api/budgets` - Create budget
- `PUT /api/budgets/:id` - Update budget
- `DELETE /api/budgets/:id` - Delete budget

### Users
- `GET /api/users/me` - Get current user
- `PUT /api/users/me` - Update current user
- `POST /api/users/:id/invite` - Invite user to shared wallet

## Development Roadmap

- [ ] Database schema and migrations
- [ ] Authentication system (Login, Register)
- [ ] Transaction CRUD operations
- [ ] Category management
- [ ] Budget tracking
- [ ] Reports and analytics
- [ ] Multi-user support
- [ ] Real-time synchronization
- [ ] Offline support
- [ ] Mobile app polish
- [ ] Desktop app deployment

## Contributing

Contributions are welcome! Please follow the existing code style and create feature branches for new work.

## License

MIT License - see LICENSE file for details
