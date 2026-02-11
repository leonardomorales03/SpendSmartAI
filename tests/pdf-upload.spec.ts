import { test, expect } from '@playwright/test';
import path from 'node:path';

test.describe('Subida de PDF', () => {
  test('acepta PDF y dispara el análisis sin error visible', async ({ page }) => {
    await page.goto('/');

    // Esperar a que el input principal esté visible (dashboard cargado)
    await expect(page.getByPlaceholder(/gastaste hoy|quieres saber/)).toBeVisible({ timeout: 10000 });

    // Input de tipo file (oculto, asociado al botón de cámara)
    const fileInput = page.locator('input[type="file"][accept*="pdf"]');
    await expect(fileInput).toBeAttached();

    const pdfPath = path.resolve(__dirname, 'fixtures/sample.pdf');

    // Disparar la subida del PDF
    await fileInput.setInputFiles(pdfPath);

    // Esperar a que desaparezca el toast "Analizando PDF..." o que aparezca éxito/error
    // Si hay error, el toast de error aparecerá; si éxito, el de éxito
    await page.waitForTimeout(4000);

    // No debe mostrarse el mensaje de error de procesamiento
    await expect(page.getByText(/Error al procesar el PDF/)).not.toBeVisible();
  });
});
