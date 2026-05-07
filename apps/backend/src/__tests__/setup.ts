import { vi } from 'vitest'

// Mock the DB pool so tests never need a real Postgres instance
vi.mock('../db/client.js', () => ({
  db: {
    query: vi.fn(),
    connect: vi.fn(),
  },
}))

// Silence console.log / console.error in test output
vi.spyOn(console, 'log').mockImplementation(() => {})
vi.spyOn(console, 'error').mockImplementation(() => {})
