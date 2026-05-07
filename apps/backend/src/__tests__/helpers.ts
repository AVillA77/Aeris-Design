import { signAccessToken } from '../utils/jwt.js'

export const TEST_USER = {
  id: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
  email: 'test@example.com',
  name: 'Test User',
  role: 'user',
}

export const TEST_CATEGORY = {
  id: 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
  name: 'Food',
  color: '#6366f1',
  user_id: TEST_USER.id,
  transaction_count: 0,
  total_expenses: 0,
  created_at: new Date(),
  updated_at: new Date(),
}

export const TEST_TRANSACTION = {
  id: 'cccccccc-cccc-cccc-cccc-cccccccccccc',
  type: 'expense',
  amount: 50,
  description: 'Lunch',
  date: '2025-05-01',
  payment_method: 'cash',
  category_id: TEST_CATEGORY.id,
  category_name: TEST_CATEGORY.name,
  category_color: TEST_CATEGORY.color,
  user_id: TEST_USER.id,
  created_at: new Date(),
  updated_at: new Date(),
}

export const TEST_BUDGET = {
  id: 'dddddddd-dddd-dddd-dddd-dddddddddddd',
  limit_amount: 500,
  period: 'monthly',
  category_id: TEST_CATEGORY.id,
  category_name: TEST_CATEGORY.name,
  category_color: TEST_CATEGORY.color,
  user_id: TEST_USER.id,
  spent: 50,
  remaining: 450,
  created_at: new Date(),
  updated_at: new Date(),
}

export function authHeader() {
  const token = signAccessToken({ userId: TEST_USER.id, email: TEST_USER.email, role: TEST_USER.role })
  return { Authorization: `Bearer ${token}` }
}
