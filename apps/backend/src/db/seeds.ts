import { db } from './client.js';

const DEFAULT_CATEGORIES = [
  { name: 'Alimentación',   color: '#f97316' },
  { name: 'Transporte',     color: '#3b82f6' },
  { name: 'Vivienda',       color: '#8b5cf6' },
  { name: 'Salud',          color: '#10b981' },
  { name: 'Entretenimiento',color: '#ec4899' },
  { name: 'Ropa',           color: '#f59e0b' },
  { name: 'Educación',      color: '#06b6d4' },
  { name: 'Trabajo',        color: '#6366f1' },
  { name: 'Ahorro',         color: '#14b8a6' },
  { name: 'Otros',          color: '#6b7280' },
];

export async function seedDefaultCategories(userId: string) {
  const values = DEFAULT_CATEGORIES.map((_, i) => {
    const base = i * 3;
    return `($${base + 1}, $${base + 2}, $${base + 3})`;
  }).join(', ');

  const params: string[] = [];
  for (const cat of DEFAULT_CATEGORIES) {
    params.push(cat.name, cat.color, userId);
  }

  await db.query(
    `INSERT INTO categories (name, color, user_id) VALUES ${values}
     ON CONFLICT DO NOTHING`,
    params,
  );
}
