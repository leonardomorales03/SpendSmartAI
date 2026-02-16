import { test, expect } from '@playwright/test';

const TEST_EMAIL = process.env.TEST_EMAIL;
const TEST_PASSWORD = process.env.TEST_PASSWORD;
const hasCredentials = !!TEST_EMAIL && !!TEST_PASSWORD;

test.describe('Flujo básico autenticado', () => {
  test.skip(!hasCredentials, 'Faltan TEST_EMAIL y TEST_PASSWORD en el entorno de pruebas');

  test('login, dashboard y creación manual de transacción', async ({ page }) => {
    await page.goto('/login');

    await page.getByLabel('Correo electrónico').fill(TEST_EMAIL!);
    await page.getByLabel('Contraseña').fill(TEST_PASSWORD!);
    await page.getByRole('button', { name: 'Iniciar Sesión' }).click();

    await page.waitForURL(/\/$/, { timeout: 10000 });
    await expect(page.getByText(/Magic Input/i)).toBeVisible();

    await page.getByPlaceholder(/gastaste hoy|quieres saber/i).fill('Comida rápida 15000');
    await page.keyboard.press('Enter');

    await page.waitForTimeout(3000);

    await page.goto('/transactions');
    await expect(page.getByText(/Comida rápida/)).toBeVisible({ timeout: 10000 });
  });

  test('navegar a metas de ahorro y ver tarjeta principal', async ({ page }) => {
    await page.goto('/');

    await expect(page.getByText(/Metas de ahorro/i)).toBeVisible({ timeout: 10000 });
  });
});

