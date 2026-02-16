-- Indices para mejorar rendimiento en metas de ahorro y presupuestos por categoría

-- Índice para filtrar metas de ahorro por usuario
CREATE INDEX IF NOT EXISTS idx_saving_goals_user ON saving_goals(user_id);

-- Índice para filtrar presupuestos de categoría por usuario y categoría
CREATE INDEX IF NOT EXISTS idx_category_budgets_user_category ON category_budgets(user_id, category_id);

