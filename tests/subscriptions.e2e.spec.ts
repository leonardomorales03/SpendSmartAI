import { test, expect } from '@playwright/test'

const TEST_EMAIL = process.env.TEST_EMAIL
const TEST_PASSWORD = process.env.TEST_PASSWORD
const hasCredentials = !!TEST_EMAIL && !!TEST_PASSWORD

test.describe('Suscripciones - flujos E2E', () => {
  test.skip(!hasCredentials, 'Faltan TEST_EMAIL y TEST_PASSWORD en el entorno de pruebas')

  test('crear suscripción y verla en la lista y calendario', async ({ page }) => {
    await page.goto('/login')

    await page.getByLabel('Correo electrónico').fill(TEST_EMAIL!)
    await page.getByLabel('Contraseña').fill(TEST_PASSWORD!)
    await page.getByRole('button', { name: 'Iniciar Sesión' }).click()

    await page.waitForURL(/\/$/, { timeout: 10000 })

    await page.goto('/subscriptions')
    await expect(page.getByRole('heading', { name: 'Suscripciones' })).toBeVisible()

    await page.getByRole('button', { name: 'Nueva suscripción' }).click()
    await expect(page.getByRole('heading', { name: /Nueva Suscripción|Editar Suscripción/ })).toBeVisible()

    const today = new Date()

    await page.getByLabel('Nombre del Servicio').fill('Suscripción de prueba')
    await page.getByLabel('Monto').fill('12345')
    await page.getByLabel('Categoría').selectOption({ index: 1 })
    await page.getByLabel('Día de Cobro').fill(String(today.getDate()))

    await page.getByRole('button', { name: 'Guardar Suscripción' }).click()

    await expect(page.getByText(/Suscripción creada|Suscripción actualizada/)).toBeVisible({
      timeout: 10000,
    })

    await page.reload()

    await expect(page.getByText('Suscripción de prueba')).toBeVisible({ timeout: 10000 })
    await expect(page.getByText(`Día ${today.getDate()}`)).toBeVisible()
  })

  test('registrar pagos del mes genera al menos un movimiento', async ({ page }) => {
    await page.goto('/login')

    await page.getByLabel('Correo electrónico').fill(TEST_EMAIL!)
    await page.getByLabel('Contraseña').fill(TEST_PASSWORD!)
    await page.getByRole('button', { name: 'Iniciar Sesión' }).click()

    await page.waitForURL(/\/$/, { timeout: 10000 })

    await page.goto('/subscriptions')

    await page.getByRole('button', { name: 'Nueva suscripción' }).click()

    await page.getByLabel('Nombre del Servicio').fill('AutoPay Test')
    await page.getByLabel('Monto').fill('5000')
    await page.getByLabel('Categoría').selectOption({ index: 1 })
    await page.getByLabel('Día de Cobro').fill('1')

    await page.getByRole('button', { name: 'Guardar Suscripción' }).click()

    await expect(page.getByText(/Suscripción creada|Suscripción actualizada/)).toBeVisible({
      timeout: 10000,
    })

    await page.reload()

    await page.getByRole('button', { name: 'Registrar pagos de este mes' }).click()

    await expect(
      page.getByText(/Se registraron \d+ pagos de suscripciones de este mes|No había pagos pendientes de este mes/),
    ).toBeVisible({
      timeout: 10000,
    })

    await page.goto('/transactions')
    await expect(page.getByText('AutoPay Test')).toBeVisible({ timeout: 10000 })
  })
})

