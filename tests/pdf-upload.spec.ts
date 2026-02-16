import { test, expect } from '@playwright/test';
import path from 'node:path';

const TEST_EMAIL = process.env.TEST_EMAIL;
const TEST_PASSWORD = process.env.TEST_PASSWORD;
const hasCredentials = !!TEST_EMAIL && !!TEST_PASSWORD;

test.describe('Subida de PDF', () => {
  test.skip(!hasCredentials, 'Faltan TEST_EMAIL y TEST_PASSWORD en el entorno de pruebas');

  test('acepta PDF y dispara el análisis sin error visible', async ({ page }) => {
    await page.goto('/login');

    await page.getByLabel('Correo electrónico').fill(TEST_EMAIL!);
    await page.getByLabel('Contraseña').fill(TEST_PASSWORD!);
    await page.getByRole('button', { name: 'Iniciar Sesión' }).click();

    await page.waitForURL(/\/$/, { timeout: 10000 });

    const fileInput = page.locator('input[type="file"][accept*="pdf"]');
    await expect(fileInput).toBeAttached({ timeout: 10000 });

    const pdfPath = path.resolve(__dirname, 'fixtures/sample.pdf');

    await fileInput.setInputFiles(pdfPath);

    await page.waitForTimeout(4000);

    await expect(page.getByText(/Error al procesar el PDF/)).not.toBeVisible();
  });
});
