import express from 'express'
import cors from 'cors'
import { authRoutes } from '../routes/auth.js'
import { transactionRoutes } from '../routes/transactions.js'
import { categoryRoutes } from '../routes/categories.js'
import { budgetRoutes } from '../routes/budgets.js'
import { userRoutes } from '../routes/users.js'
import { errorHandler } from '../middleware/errorHandler.js'
import { authLimiter, apiLimiter } from '../middleware/rateLimit.js'

// Minimal Express app used by tests (no DB migration, no listen)
const app = express()
app.use(express.json())
app.use(cors())
app.use('/api/auth', authLimiter, authRoutes)
app.use('/api/transactions', apiLimiter, transactionRoutes)
app.use('/api/categories', apiLimiter, categoryRoutes)
app.use('/api/budgets', apiLimiter, budgetRoutes)
app.use('/api/users', apiLimiter, userRoutes)
app.use(errorHandler)

export { app }
