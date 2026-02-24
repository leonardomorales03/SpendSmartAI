"use client"

import { motion } from "framer-motion"
import { Star } from "lucide-react"

const testimonials = [
  {
    name: "María González",
    role: "Freelancer",
    content: "Desde que uso SpendSmart AI, he podido ahorrar un 20% más cada mes sin sentir que me estoy restringiendo. La IA realmente entiende mis hábitos.",
    avatar: "MG",
    color: "bg-blue-500",
  },
  {
    name: "Carlos Rodríguez",
    role: "Emprendedor",
    content: "La capacidad de predecir mis gastos recurrentes me ha salvado de varios apuros. Es como tener un contador personal en el bolsillo.",
    avatar: "CR",
    color: "bg-purple-500",
  },
  {
    name: "Ana Silva",
    role: "Estudiante",
    content: "Increíblemente fácil de usar. La interfaz es hermosa y las notificaciones inteligentes me ayudan a mantenerme en el camino correcto.",
    avatar: "AS",
    color: "bg-green-500",
  },
]

export function Testimonials() {
  return (
    <section className="py-24 bg-slate-50 dark:bg-slate-900/50">
      <div className="container px-4 mx-auto">
        <div className="text-center mb-16">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-3xl md:text-5xl font-bold text-gray-900 dark:text-white mb-6"
          >
            Lo que dicen nuestros usuarios
          </motion.h2>
          <p className="text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
            Únete a miles de personas que ya están transformando su relación con el dinero.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {testimonials.map((testimonial, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.2 }}
              className="bg-white dark:bg-slate-800 p-8 rounded-2xl shadow-sm border border-gray-100 dark:border-slate-700"
            >
              <div className="flex items-center gap-1 mb-6">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="w-5 h-5 fill-yellow-400 text-yellow-400" />
                ))}
              </div>
              <p className="text-gray-600 dark:text-gray-300 mb-8 italic">
                &quot;{testimonial.content}&quot;
              </p>
              <div className="flex items-center gap-4">
                <div className={`w-12 h-12 rounded-full flex items-center justify-center text-white font-bold ${testimonial.color}`}>
                  {testimonial.avatar}
                </div>
                <div>
                  <h4 className="font-bold text-gray-900 dark:text-white">{testimonial.name}</h4>
                  <p className="text-sm text-gray-500 dark:text-gray-400">{testimonial.role}</p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}
