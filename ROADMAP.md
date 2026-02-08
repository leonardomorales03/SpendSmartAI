# 🚀 Roadmap a Producción & Nuevas Funcionalidades - SpendSmart AI

Este documento detalla los pasos necesarios para convertir la maqueta actual en una aplicación funcional al 100% y las nuevas secciones de análisis visual.

---

## 🛠 Fase 1: Roadmap a Producción (Infraestructura Real)

### 1. [x] Conexión Real a Base de Datos (Supabase)
*   **Estado actual:** ¡Completado! Los datos ya se guardan y leen desde Supabase.
*   **Meta:** Persistencia real de datos por usuario.
*   **Acción:** 
    *   [x] Configurar variables de entorno (`NEXT_PUBLIC_SUPABASE_URL`, `SUPABASE_ANON_KEY`).
    *   [x] Implementar el cliente de Supabase en el proyecto.
    *   [x] Reemplazar las funciones de mock en `actions/transaction.ts` por llamadas reales a la base de datos.

### 2. [x] Cerebro AI Real (Groq)
*   **Estado actual:** ¡Integrado! La app ahora usa Llama 3.3 de Groq para entender tus gastos y responder preguntas.
*   **Meta:** Procesamiento de lenguaje natural avanzado para entender cualquier frase.
*   **Acción:** 
    *   [x] Instalar SDK de Groq.
    *   [x] Crear cliente de conexión en `lib/groq.ts`.
    *   [x] Implementar extracción de datos real y modo "Ask My Money" con contexto de la DB.

### 3. Autenticación (Supabase Auth)
*   **Estado actual:** Acceso directo a un dashboard compartido/estático.
*   **Meta:** Privacidad de datos y perfiles de usuario.
*   **Acción:** 
    *   Crear página de Login/Registro.
    *   Configurar proveedores (Email/Password y Google).
    *   Implementar Row Level Security (RLS) en Supabase para que cada usuario solo vea sus propios gastos.

### 4. Despliegue (Vercel)
*   **Estado actual:** Ejecución local en puerto 3000/3001.
*   **Meta:** Aplicación accesible globalmente via URL.
*   **Acción:** 
    *   Vincular el repositorio de GitHub con Vercel.
    *   Configurar las variables de entorno en el panel de Vercel.

---
 
## 📊 Fase 2: [x] Panel de Análisis Avanzado (Inspirado en Diseño)
*   [x] **Fila de KPIs**: Implementado StatsGrid con Total, Conteo, Categoría Top y Promedio Diario real.
*   [x] **Análisis Detallado**: Gráficos de barra por categoría y flujo semanal dinámicos.
*   [x] **Integración Real**: Los cálculos se basan en los datos de Supabase en tiempo real.
 
## 🎙 Fase 3: Métodos de Entrada Omnicanal (Voz e Imagen)

Para que el registro de gastos sea lo más fluido posible, implementaremos tres formas adicionales de nutrir el "Magic Input":

### 1. Entrada por Voz (Audio-to-Text)
*   **Funcionalidad:** Permitir al usuario dictar sus gastos sin escribir.
*   **Tecnología Sugerida:**
    *   **Opción A (Gratis/Nativa):** `Web Speech API`. Funciona directamente en el navegador sin costo, convirtiendo la voz a texto en tiempo real.
    *   **Opción B (Alta Precisión):** `Groq Whisper-large-v3`. Increíblemente rápido y preciso incluso con ruido de fondo.
*   **Flujo de Usuario:**
    1.  Tocar icono de micrófono en el Input.
    2.  Escuchar tono de "Escuchando".
    3.  Dictar: *"Almuerzo ejecutivo por dieciocho mil quinientos"*.
    4.  El texto se inserta automáticamente y la IA lo procesa.

### 2. Reconocimiento de Facturas (Visión Artificial)
*   **Funcionalidad:** Cargar una foto de un ticket o factura y extraer los datos automáticamente.
*   **Tecnología Sugerida:**
    *   **Llama 3.2 Vision (vía Groq):** Capaz de "leer" imágenes y extraer JSON estructurado.
    *   **GPT-4o mini (Vision):** Alternativa de bajo costo con excelente precisión en OCR.
*   **Flujo de Usuario:**
    1.  Elegir icono de "Imagen" o "Cámara".
    2.  Subir foto del recibo.
    3.  La IA analiza la imagen, busca el **Total**, la **Fecha** y el **Comercio**.
    4.  Muestra una previsualización para confirmar antes de guardar.

### 3. Captura Directa con Cámara
*   **Funcionalidad:** Abrir la cámara nativa del celular desde la app para un registro instantáneo.
*   **Implementación:**
    *   Uso de `MediaDevices API` o el atributo HTML `<input type="file" capture="environment">` para invocar la interfaz de cámara del sistema operativo.
*   **Ventaja:** Elimina la fricción de tener que guardar la foto en la galería primero, ahorrando tiempo y almacenamiento.

## 🌍 Fase 4: Gestión de Moneda Inteligente (Multi-divisa)

Para evitar dejar la moneda "quemada" en el código y permitir que la app sea usada en cualquier parte del mundo o para viajes, implementaremos un sistema híbrido:

### 1. Perfil de Usuario (La Base Sólida)
*   **Funcionalidad:** Definir una moneda predeterminada por cuenta.
*   **Implementación:**
    *   Crear una tabla `profiles` en Supabase vinculada al `user_id`.
    *   Añadir un campo `base_currency` (ej: "COP", "USD", "EUR").
*   **Ventaja:** Todos los gráficos y el presupuesto inicial se formatearán automáticamente basándose en esta preferencia sin intervención del usuario.

### 2. Detección Contextual por IA (La Flexibilidad)
*   **Funcionalidad:** Identificar cuando un gasto específico se hace en una moneda diferente a la habitual.
*   **Flujo de IA:**
    *   Ajustar el *System Prompt* de la IA para extraer no solo el monto, sino también la divisa si se menciona.
    *   Ejemplo: Si el usuario escribe *"Suscripción 10 USD"*, la IA detectará que la moneda es Dólar, incluso si la base del usuario es Peso Colombiano.
*   **Lógica de Conversión:** Posibilidad de integrar una API de tipos de cambio (como *ExchangeRate-API*) para convertir automáticamente gastos extranjeros a la moneda base del usuario para un reporte consolidado.

## 💸 Fase 5: Centro de Gestión de Deuda & Crédito (Impacto Financiero)

Esta sección transformará la app de un simple "rastreador de gastos" a un "gestor de patrimonio", atacando uno de los mayores dolores de cabeza financieros: las deudas.

### 1. Monitor Inteligente de Tarjetas de Crédito
*   **Funcionalidad:** Seguimiento de cupo utilizado vs. disponible y alertas de fechas clave.
*   **Visualización:**
    *   Barra de progreso de "Utilización de Crédito" (mantenerla bajo el 30% para salud crediticia).
    *   Contador regresivo para **Fecha de Corte** y **Fecha Límite de Pago**.
*   **Valor:** Evita el pago de intereses por mora y ayuda a mejorar el score crediticio.

### 2. Simulador de Abonos Extra (Ahorro de Intereses)
*   **Funcionalidad:** Una calculadora donde el usuario pone su deuda actual y la tasa de interés.
*   **Impacto:** "Si abonas $200k extra hoy, te ahorras $1.5M en intereses y terminas 6 meses antes". 
*   **Valor:** Genera un efecto motivador inmediato (Gameficación del ahorro).

### 3. Planificador de Desendeudamiento (Snowball vs Avalanche)
*   **Funcionalidad:** Herramienta para organizar múltiples deudas (ej: Icetex, Banco, Amigo).
*   **Estrategias:**
    *   **Bola de Nieve:** Pagar primero la deuda más pequeña para ganar confianza.
    *   **Avalancha:** Pagar primero la de mayor interés para ahorrar más dinero.
*   **Valor:** Proporciona un mapa de ruta claro para salir de deudas de forma sistemática.

### 4. Seguimiento de Préstamos Personales (Cuentas por Pagar/Cobrar)
*   **Funcionalidad:** Gestionar ese dinero que prestaste a un amigo o que te prestaron a ti.
*   **Valor:** Centraliza todo tu flujo de caja en un solo lugar, eliminando el "se me olvidó que me debían esto".

### 5. Fundamentos Técnicos (El Backend de Deudas)
Para que esto funcione sin fricción, implementaremos:
*   **Evolución de DB (Supabase):** 
    *   Tabla `debts`: Almacena acreedor, monto total, tasa de interés (TEA), fecha de inicio y tipo de deuda.
    *   Tabla `debt_payments`: Vinculada a `transactions` para marcar qué gasto fue un abono a qué deuda.
*   **Lógica de IA Mejorada:** 
    *   **Detección de Intención de Deuda:** El "Magic Input" reconocerá frases como *"Debo 5 millones al Banco X"* para disparar el flujo de creación de deuda.
    *   **Auto-Abono:** Si pagas algo categorizado como "Deuda", la IA sugerirá vincularlo a una deuda activa.
*   **Automatización vía OCR (Fase 3):** 
    *   Uso de **Llama 3.2 Vision** para escanear extractos bancarios en PDF/Foto y extraer automáticamente el saldo y la fecha de pago, eliminando el registro manual.

## 🧠 Fase 6: Financial Academy & Mindset (Educación Financiera)

Elevar la experiencia de usuario de "herramienta de registro" a "coach financiero" mediante contenido educativo sutil y de alto valor.

### 1. Wisdom Banners (Píldoras Diarias)
*   **Concepto:** Frases minimalistas en el dashboard que invitan a la reflexión.
*   **Valor:** Genera un cambio de mentalidad (mindset) cada vez que el usuario abre la app para registrar un gasto.
*   **Implementación Técnica Dinámica (Pendiente):**
    *   **Nivel 1 (Inmediato):** Server Action que solicita a Groq 5 frases nuevas cada 24h, usando `next/cache` para optimizar costos de API.
    *   **Nivel 2 (Contextual):** Cuando se active la Autenticación, enviar un resumen anónimo de los gastos del usuario a la IA para generar consejos personalizados (ej: *"Noto que tus gastos en suscripciones subieron, ¿revisamos las que no usas?"*).
    *   **Almacenamiento:** Tabla `wisdom_history` en Supabase para evitar repeticiones y permitir al usuario consultar consejos pasados.

### 2. Micro-Learning (Mini-curso de objetivos)
*   **Concepto:** Tres niveles de aprendizaje rápido:
    *   **Nivel 1: Sobrevivencia** (Presupuesto base y ahorro de emergencia).
    *   **Nivel 2: Estabilidad** (Gestión de deuda y seguros).
    *   **Nivel 3: Libertad** (Inversión y diversificación).
*   **Formato:** Tarjetas visuales interactivas de lectura rápida (menos de 2 mins).

### 3. AI Financial Coach
*   **Funcionalidad:** La IA analiza tus patrones y te sugiere una "píldora" específica.
    *   *Ejemplo:* Si la IA detecta muchas suscripciones, te sugiere la lectura de "Suscripciones Vampiro: Cómo detectarlas".

---

## � Fase 7: Centro de Reportes & Exportación (Data Control)

Para los usuarios que necesitan un control granular o llevar sus datos a otras herramientas, crearemos un módulo de descarga y análisis profundo.

### 1. Tabla Maestra de Transacciones
*   **Funcionalidad:** Una vista dedicada con filtros avanzados (por fecha, categoría, rango de precios).
*   **Interactividad:** Posibilidad de editar o eliminar registros de forma masiva.

### 2. Motor de Exportación Multi-formato
*   **Excel/CSV:** Descarga de datos crudos para contadores o análisis personal en hojas de cálculo.
*   **PDF "Premium" de Cierre de Mes:** Un reporte visualmente impactante que resume el mes con los gráficos que ya creamos, listo para guardar o imprimir. 

### 3. Executive AI Summary (El reporte que "se lee solo")
*   **Funcionalidad:** Un botón para generar un informe escrito por la IA.
*   **Ejemplo:** *"Diciembre fue un mes de alto gasto en regalos (Fase 1 de Navidad), pero lograste ahorrar un 15% en transporte comparado con Noviembre."*

### 4. Automatización de Envío por Email
*   **Funcionalidad:** Programación de correos mensuales (Cron Jobs) con el resumen del mes.
*   **Tecnología:** Integración con **Resend** + **React Email** para plantillas modernas y responsivas.
*   **Valor:** Recordatorio pasivo de salud financiera que llega directo al buzón del usuario.

---

## 💎 Estrategia de Monetización (Modelo de Negocio)

Diseño híbrido para maximizar ingresos sin sacrificar el crecimiento de usuarios.

### 1. Modelo Freemium (El Gancho)
*   **Plan Gratuito:** Registro manual ilimitado, Dashboard básico y 5 consultas de IA al día.
*   **Objetivo:** Eliminar la barrera de entrada y generar hábito.

### 2. Suscripción "Pro" ($3 - $5 USD/mes)
*   **Entrada sin Fricción:** Voz y Escaneo de Facturas ilimitado (costo computacional cubierto).
*   **Analítica Profunda:** Reportes PDF, Email mensual y tendencias anuales.
*   **Gestión de Patrimonio:** Módulo de Deudas y Presupuestos avanzados.

### 3. Referidos Financieros Inteligentes (Lead Gen)
*   **La "Mina de Oro":** Uso de la IA para detectar ineficiencias financieras.
*   **Ejemplo:** *"Estás pagando $50k en comisiones bancarias. Este banco tiene costo $0. ¿Te ayudo a cambiarte?"*
*   **Modelo:** Comisión por lead calificado (CPA) con bancos y aseguradoras aliados.

---

## 🚀 Estrategia de Repositorio & Monetización

Para equilibrar el crecimiento profesional del usuario con el potencial de negocio de la aplicación, seguiremos este plan:

### 1. Fase de Crecimiento (Repo Público)
*   **Objetivo:** Actuar como portafolio de alto impacto para reclutadores y clientes.
*   **Estado:** Mantener el código abierto mientras terminamos de pulir las fases de Infraestructura y Análisis.
*   **Valor:** Demuestra habilidades en IA, Next.js, Supabase y diseño UI Premium.

### 2. Fase de Producto (Transición a Privado)
*   **Acción:** Una vez que las funcionalidades de la **Fase 3 (Voz/OCR)** y **Fase 5 (Deudas)** estén maduras, se evaluará mover el núcleo del negocio a un repositorio privado.
*   **Híbrido:** Se puede dejar una versión "Community" pública y una versión "Pro" con las lógicas de monetización protegidas.

### 3. Monetización Sugerida
*   **SaaS:** Cobrar por la gestión de deudas avanzada y almacenamiento en la nube.
*   **Educación:** Contenido exclusivo en la Fase 6 (Financial Academy).

---

## 🔒 Próximos Pasos Sugeridos
1.  **Configurar Variables de Entorno** para Supabase y Groq (API Key).
2.  **Modificar `actions/transaction.ts`** para usar el SDK de Groq y habilitar la lógica multianálisis.
3.  **Crear componentes de Stats** basados en la Fase 2 (Influencia visual).
4.  **Actualizar el `MagicInput`** con iconos de Voz y Cámara.
