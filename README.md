# 💰 SpendSmart AI — Tu Dinero, Inteligente

![Dashboard Overview](public/screenshots/dashboard_overview.png)

**SpendSmart AI** es una plataforma de gestión financiera personal diseñada para brindarte claridad absoluta sobre tus gastos mediante el poder de la Inteligencia Artificial. No es solo un rastreador de gastos; es un copiloto financiero que aprende de tus hábitos y te ayuda a tomar decisiones más inteligentes.

---

## ✨ Características Principales

### 🧠 Magic Input (IA Generativa)
Olvida los formularios complicados. Registra tus gastos simplemente escribiendo o dictando frases naturales:
*   *"Almuerzo con el equipo 45k"*
*   *"Suscripción de Netflix 35,000 ayer"*
*   *"Mercado del mes por 250 USD"*
La IA (Llama 3.3 via Groq) extrae automáticamente el **monto**, la **categoría**, la **fecha** y la **moneda**.

### 📊 Dashboard de Análisis Premium
Visualiza tu salud financiera con gráficos dinámicos y KPIs en tiempo real:
*   **KPIs Críticos**: Gasto total, promedio diario, categoría top y conteo de transacciones.
*   **Distribución de Gastos**: Gráfico de barras detallado por categorías.
*   **Velocidad de Gasto**: Gráfico de flujo semanal para detectar picos de consumo.
*   **Próximos Pagos**: Calendario inteligente de facturas y suscripciones pendientes.

### 🤖 "Ask My Money" (Consultas Contextuales)
Interactúa con tus datos financieros mediante lenguaje natural. Pregunta a la IA sobre tus patrones de gasto y obtén respuestas basadas en tu historial real.

---

## 📸 Demostración de Voz/IA

![IA Processing Response](public/screenshots/ai_response.png)
*Ejemplo de procesamiento automático tras ingresar un gasto por el Magic Input.*

---

## 🛠️ Stack Tecnológico

*   **Frontend**: [Next.js 15+](https://nextjs.org/) (App Router), [React 19](https://react.dev/), [Tailwind CSS](https://tailwindcss.com/).
*   **Backend & DB**: [Supabase](https://supabase.com/) (PostgreSQL + Row Level Security).
*   **Inteligencia Artificial**: [Groq Cloud](https://groq.com/) (Llama 3.3 & Llama 3.2 Vision).
*   **Visualización**: [Recharts](https://recharts.org/) & [Framer Motion](https://www.framer.com/motion/).
*   **UI Components**: Radix UI + Lucide React.

---

## 🚀 Instalación y Configuración

1.  **Clonar el repositorio:**
    ```bash
    git clone https://github.com/leonardomorales03/SpendSmartAI.git
    cd SpendSmartAI
    ```

2.  **Instalar dependencias:**
    ```bash
    npm install
    ```

3.  **Configurar variables de entorno:**
    Crea un archivo `.env.local` en la raíz con las siguientes claves:
    ```env
    NEXT_PUBLIC_SUPABASE_URL=tu_url_de_supabase
    NEXT_PUBLIC_SUPABASE_ANON_KEY=tu_clave_anon_de_supabase
    GROQ_API_KEY=tu_api_key_de_groq
    ```

4.  **Ejecutar en desarrollo:**
    ```bash
    npm run dev
    ```
    Visita `http://localhost:3000` para ver la app en acción.

---

## 🗺️ Roadmap

### ✅ Fase 1: MVP Core (Completado)
- [x] Autenticación Segura (Supabase Auth & RLS).
- [x] CRUD de Transacciones en tiempo real.
- [x] Magic Input: Extracción de datos de gastos con IA.
- [x] Dashboard de Métricas Financieras.
- [x] Módulo de Presupuestos Inteligentes (Regla 50/30/20).

### 🚧 Fase 2: MVP Robusto (Calidad de Producto)
- [x] Pulir experiencia de captura:
  - [x] Estados vacíos y errores claros en Magic Input.
  - [x] Fallback manual sólido cuando la IA falle (formularios guiados).
- [x] Pulir experiencia de consulta (Chat IA):
  - [x] Indicadores de carga, reintentos y mensajes de error amigables.
  - [x] Respuestas explicando de dónde salen los números.
- [x] Robustez del dashboard:
  - [x] Skeletons / loading states en tarjetas y gráficos.
  - [x] Manejo consistente de “sin datos” en todos los módulos.
- [x] Metas de ahorro:
  - [x] UX de creación/edición pulida (categorías, progreso, finalización).
  - [x] Coherencia total con el resumen financiero (ahorro agregado).
- [x] Calidad técnica básica:
  - [x] Revisión de RLS y políticas de seguridad.
  - [x] Índices esenciales en tablas críticas (transacciones, metas, presupuestos).
  - [x] Tests e2e mínimos: login, creación de transacción, Magic Input, metas.

### 🤖 Fase 3: IA Financiera Avanzada
- [ ] Chat Contextual (RAG) afinado:
  - Mejor comprensión de consultas complejas y rango de fechas.
  - Explicaciones tipo “storytelling” de hábitos y tendencias.
- [ ] Detección de anomalías de gasto más inteligente.
- [ ] Insights predictivos mejorados:
  - Proyecciones de presupuesto y alertas de “te vas a pasar”.
  - Sugerencias accionables (recomendar recortes o metas concretas).

### 🔜 Fase 4: Expansión y Retención
- [ ] Reportes exportables (Opcional): generación de CSV/PDF mensuales para contabilidad.
- [ ] Gamificación avanzada: badges, niveles y retos de ahorro.
- [ ] Modo Offline (PWA): registro de gastos sin conexión.
- [ ] Integraciones futuras (bancos, APIs externas) según necesidades.

### 📦 Módulo de Suscripciones
- [x] CRUD completo de suscripciones recurrentes.
- [x] Motor de automatización mensual (`runMonthlySubscriptions`) que genera transacciones de cobro.
- [x] Calendario visual de días de cobro.
- [x] Presets de servicios populares con montos aproximados en COP usando tipo de cambio real (vía `getExchangeRate`).
- [x] Tests unitarios, de integración y E2E para el módulo:
  - [x] Helpers de negocio (`calculateTotalMonthly`, `calculateRemainingThisMonth`, `getDueToday`, `getCalendarCounts`).
  - [x] Flujo E2E de creación de suscripción y visualización en lista/calendario.
  - [x] Flujo E2E de automatización mensual y verificación de transacción generada.

### 💹 Análisis de valor agregado (futuro)
- **Módulo de Deudas/Crédito**
  - ROI esperado alto para usuarios con múltiples tarjetas y préstamos (mayor retención y ticket Pro).
  - Complejidad técnica media-alta: nuevas tablas (`debts`, `debt_payments`), simuladores y lógica de interés compuesto.
  - Beneficio usuario: claridad sobre fecha de pago, intereses ahorrados por abonos extra y estrategia de desendeudamiento.
  - Recomendación: implementar solo en fase de crecimiento una vez consolidado el core de gastos y suscripciones.
- **Financial Academy (Educación Financiera)**
  - ROI en retención y diferenciación de marca (más tiempo en app, mejor NPS).
  - Complejidad técnica media: contenido curado + micro-lecciones, se apoya fuertemente en la IA existente.
  - Beneficio usuario: mejora de mentalidad financiera y comprensión de recomendaciones del sistema.
  - Recomendación: mantener como módulo opcional, activable en planes Pro o como feature de engagement.


## 📄 Licencia
Este proyecto es privado y se desarrolla con fines de portafolio profesional.
