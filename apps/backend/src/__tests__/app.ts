import express from 'express'
import cors from 'cors'
import { authRoutes } from '../routes/auth.js'
import { transactionRoutes } from '../routes/transactions.js'
import { categoryRoutes } from '../routes/categories.js'
import { budgetRoutes } from '../routes/budgets.js'
import { userRoutes } from '../routes/users.js'
import { errorHandler } from '../middleware/errorHandler.js'

// Minimal Express app used by tests (no DB migration, no listen)
const app = express()
app.use(express.json())
app.use(cors())
app.use('/api/auth', authRoutes)
app.use('/api/transactions', transactionRoutes)
app.use('/api/categories', categoryRoutes)
app.use('/api/budgets', budgetRoutes)
app.use('/api/users', userRoutes)
app.use(errorHandler)

export { app }
