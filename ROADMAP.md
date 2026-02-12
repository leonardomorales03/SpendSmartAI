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

### 3. [x] Autenticación (Supabase Auth)
*   **Estado actual:** ¡Seguro! Sistema de login, registro y protección de rutas implementado.
*   **Meta:** Privacidad de datos y perfiles de usuario.
*   **Acción:** 
    *   [x] Crear página de Login/Registro.
    *   [x] Configurar proveedores (Email/Password).
    *   [x] Implementar Row Level Security (RLS) en Supabase para que cada usuario solo vea sus propios gastos.
    *   [ ] Integrar autenticación con Google (OAuth) (Fase futura).

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

---

## 🎙 Fase 3: [x] Métodos de Entrada Omnicanal (Voz e Imagen)

Ahora el registro de gastos es ultra fluido gracias a la integración de inteligencia artificial para audio y visión:

### 1. Entrada por Voz (Audio-to-Text) [x]
*   **Funcionalidad:** Implementado con **Groq Whisper v3**. Transcribe dictados en milisegundos directamente en el input.

### 2. Reconocimiento de Facturas (Visión Artificial) [x]
*   **Funcionalidad:** Implementado con **Llama 3.2 Vision**. Extrae monto, categoría y descripción de fotos de recibos automáticamente.

### 3. Captura Directa con Cámara [x]
*   **Funcionalidad:** Integrado mediante el selector de archivos nativo que permite disparar la cámara en móviles.

---

## 🛡️ Fase 4: Consolidación del Core (MVP Robusto) - [PRÓXIMA SESIÓN]

Esta fase es crítica para cerrar el ciclo funcional de la aplicación y permitir una personalización real.

### 1. Gestión de Categorías (Prioridad Alta)
*   **Problema:** Actualmente las categorías son estáticas o predefinidas.
*   **Solución:** CRUD completo de categorías.
*   **Acciones:**
    *   [ ] Crear tabla `categories` vinculada al usuario (o globales + personalizadas).
    *   [ ] Interfaz para crear, editar y eliminar categorías.
    *   [ ] Asignación de colores e iconos (emojis) personalizados.

### 2. Módulo de Presupuestos (Budget)
*   **Problema:** El usuario registra gastos pero no tiene una meta o límite visual.
*   **Solución:** Sistema de alertas y barras de progreso.
*   **Acciones:**
    *   [ ] Definir presupuesto mensual global.
    *   [ ] Definir presupuestos por categoría (ej: "Solo $200k en comida").
    *   [ ] Visualización en el Dashboard: Barra de progreso "Gastado vs Presupuesto".
    *   [ ] Alertas visuales (amarillo/rojo) al acercarse al límite.

### 3. Perfil y Ajustes
*   **Problema:** No se pueden cambiar datos personales ni preferencias.
*   **Solución:** Sección de configuración de usuario.
*   **Acciones:**
    *   [ ] Página `/settings` o `/profile`.
    *   [ ] Cambio de contraseña y actualización de foto de perfil.
    *   [ ] Configuración de moneda base (COP/USD) y formato de fecha.

### 4. Gestión Real de Suscripciones
*   **Problema:** El widget de suscripciones es informativo/estático en algunos casos.
*   **Solución:** Motor de gastos recurrentes.
*   **Acciones:**
    *   [ ] Tabla `subscriptions` en Supabase.
    *   [ ] CRUD para agregar Netflix, Spotify, Arriendo, etc.
    *   [ ] Lógica para generar automáticamente la transacción cada mes o enviar recordatorio.
    *   [ ] Calendario de próximos pagos.

---

## 🌍 Fase 5: Gestión de Moneda Inteligente (Multi-divisa)
*   **Funcionalidad:** Perfil de usuario con moneda base.
*   **Detección Contextual:** IA detecta moneda si se menciona (ej: "10 USD").
*   **Conversión:** Integrar API de tipos de cambio.

---

## 💸 Fase 6: Centro de Gestión de Deuda & Crédito (Impacto Financiero)

### 1. Monitor Inteligente de Tarjetas de Crédito
*   Seguimiento de cupo y fechas de pago.

### 2. Simulador de Abonos Extra
*   Cálculo de ahorro en intereses por prepagos.

### 3. Planificador de Desendeudamiento
*   Estrategias Snowball vs Avalanche.

### 4. Seguimiento de Préstamos Personales
*   Gestión de cuentas por pagar/cobrar.

### 5. Fundamentos Técnicos (El Backend de Deudas)
*   **Evolución de DB (Supabase):** Tablas `debts` y `debt_payments`.
*   **IA:** Detección automática de intención de deuda y abono.

---

## 🧠 Fase 7: Financial Academy & Mindset (Educación Financiera)

### 1. Wisdom Banners (Píldoras Diarias) [x]
*   [x] Implementado WisdomBanner con frases minimalistas.
*   **Mejora Dinámica (Pendiente):** Generación diaria por IA y personalización contextual.

### 2. Micro-Learning (Mini-curso de objetivos)
*   Tarjetas interactivas de lectura rápida.

---

## 📊 Fase 8: Centro de Reportes & Exportación (Data Control)

### 1. Tabla Maestra de Transacciones [x]
*   [x] Implementada página `/transactions` con filtros y edición.

### 2. Motor de Exportación Multi-formato
*   Excel/CSV y PDF "Premium" mensual.

### 3. Executive AI Summary
*   Informe escrito por la IA analizando el comportamiento del mes.

### 4. Automatización de Envío por Email
*   Envío mensual via **Resend** + **React Email**.

---

## 💎 Estrategia de Monetización (Modelo de Negocio)

### 1. Modelo Freemium
*   Plan gratuito con IA limitada (5 consultas/día).

### 2. Suscripción "Pro" ($3 - $5 USD/mes)
*   Voz e imágenes ilimitadas, reportes avanzados, gestión de deudas.

### 3. Referidos Financieros Inteligentes (Lead Gen)
*   Recomendación ética de productos bancarios (comisión por CPA).

---

## 🚀 Estrategia de Repositorio & Monetización

### 1. Fase de Crecimiento (Repo Público)
*   Portafolio de alto impacto.

### 2. Fase de Producto (Transición a Privado)
*   Cerrar el núcleo del negocio cuando sea monetizable.
