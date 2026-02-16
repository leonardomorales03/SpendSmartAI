"use client"

import { motion } from "framer-motion"
import { BarChart3, BrainCircuit, Globe, Lock, PieChart, Zap } from "lucide-react"

const features = [
  {
    icon: <BrainCircuit className="w-8 h-8 text-purple-600" />,
    title: "IA Predictiva",
    description: "Nuestros algoritmos aprenden de tus hábitos para predecir gastos futuros y evitar sorpresas.",
  },
  {
    icon: <BarChart3 className="w-8 h-8 text-blue-600" />,
    title: "Análisis Profundo",
    description: "Visualiza a dónde va cada centavo con gráficos interactivos y desgloses detallados.",
  },
  {
    icon: <Globe className="w-8 h-8 text-green-600" />,
    title: "Multimoneda Real",
    description: "Soporte para más de 150 monedas con tipos de cambio actualizados en tiempo real.",
  },
  {
    icon: <Zap className="w-8 h-8 text-yellow-500" />,
    title: "Sincronización Instantánea",
    description: "Tus datos se actualizan al instante en todos tus dispositivos, sin retrasos.",
  },
  {
    icon: <PieChart className="w-8 h-8 text-red-500" />,
    title: "Presupuestos Dinámicos",
    description: "Presupuestos que se ajustan automáticamente según tus ingresos y gastos recurrentes.",
  },
  {
    icon: <Lock className="w-8 h-8 text-slate-700" />,
    title: "Privacidad Primero",
    description: "Tus datos financieros son tuyos. Encriptación de extremo a extremo y cero venta de datos.",
  },
]

export function Features() {
  return (
    <section className="py-24 bg-white dark:bg-slate-950">
      <div className="container px-4 mx-auto">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-3xl md:text-5xl font-bold text-gray-900 dark:text-white mb-6"
          >
            Todo lo que necesitas para <br />
            <span className="text-blue-600">dominar tus finanzas</span>
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
            className="text-lg text-gray-600 dark:text-gray-400"
          >
            SpendSmart AI no es solo una app de gastos. Es tu asistente financiero personal disponible 24/7.
          </motion.p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
              whileHover={{ y: -5 }}
              className="p-8 rounded-2xl bg-gray-50 dark:bg-slate-900 border border-gray-100 dark:border-slate-800 hover:shadow-lg transition-all"
            >
              <div className="mb-6 p-4 bg-white dark:bg-slate-800 rounded-xl w-fit shadow-sm">
                {feature.icon}
              </div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-3">
                {feature.title}
              </h3>
              <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
                {feature.description}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}
