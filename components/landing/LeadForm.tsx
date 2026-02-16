"use client"

import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { motion } from "framer-motion"
import { Loader2, CheckCircle, ArrowRight } from "lucide-react"
import { cn } from "@/lib/utils"

const formSchema = z.object({
  name: z.string().min(2, {
    message: "El nombre debe tener al menos 2 caracteres.",
  }),
  email: z.string().email({
    message: "Por favor ingresa un email válido.",
  }),
  interest: z.enum(["personal", "business", "enterprise"], {
    required_error: "Por favor selecciona un tipo de uso.",
  }),
})

export function LeadForm() {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      email: "",
      interest: "personal",
    },
  })

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsSubmitting(true)
    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1500))
    console.log(values)
    setIsSubmitting(false)
    setIsSuccess(true)
    form.reset()
  }

  if (isSuccess) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-green-50/10 backdrop-blur-sm border border-green-200 dark:border-green-800 p-8 rounded-2xl text-center"
      >
        <div className="flex justify-center mb-4">
          <div className="bg-green-100 dark:bg-green-900/30 p-3 rounded-full">
            <CheckCircle className="w-8 h-8 text-green-600 dark:text-green-400" />
          </div>
        </div>
        <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
          ¡Gracias por tu interés!
        </h3>
        <p className="text-gray-600 dark:text-gray-300">
          Te hemos enviado los detalles a tu correo. Pronto serás parte de la revolución financiera.
        </p>
        <button
          onClick={() => setIsSuccess(false)}
          className="mt-6 text-sm font-medium text-green-600 hover:text-green-700 dark:text-green-400 dark:hover:text-green-300 transition-colors"
        >
          Enviar otro registro
        </button>
      </motion.div>
    )
  }

  return (
    <div className="w-full max-w-md mx-auto bg-white/5 backdrop-blur-lg border border-white/10 p-8 rounded-2xl shadow-xl">
      <div className="text-center mb-8">
        <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
          Únete a la lista de espera
        </h3>
        <p className="text-gray-600 dark:text-gray-300 text-sm">
          Sé el primero en experimentar el futuro de las finanzas personales con IA.
        </p>
      </div>

      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <div className="space-y-2">
          <label htmlFor="name" className="text-sm font-medium text-gray-700 dark:text-gray-300">
            Nombre completo
          </label>
          <input
            {...form.register("name")}
            id="name"
            className={cn(
              "w-full px-4 py-3 rounded-lg bg-gray-50 dark:bg-gray-800/50 border focus:ring-2 focus:ring-blue-500 outline-none transition-all",
              form.formState.errors.name
                ? "border-red-500 focus:ring-red-500"
                : "border-gray-200 dark:border-gray-700"
            )}
            placeholder="Juan Pérez"
          />
          {form.formState.errors.name && (
            <p className="text-red-500 text-xs mt-1">{form.formState.errors.name.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <label htmlFor="email" className="text-sm font-medium text-gray-700 dark:text-gray-300">
            Correo electrónico
          </label>
          <input
            {...form.register("email")}
            id="email"
            type="email"
            className={cn(
              "w-full px-4 py-3 rounded-lg bg-gray-50 dark:bg-gray-800/50 border focus:ring-2 focus:ring-blue-500 outline-none transition-all",
              form.formState.errors.email
                ? "border-red-500 focus:ring-red-500"
                : "border-gray-200 dark:border-gray-700"
            )}
            placeholder="juan@ejemplo.com"
          />
          {form.formState.errors.email && (
            <p className="text-red-500 text-xs mt-1">{form.formState.errors.email.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <label htmlFor="interest" className="text-sm font-medium text-gray-700 dark:text-gray-300">
            Me interesa para uso
          </label>
          <select
            {...form.register("interest")}
            id="interest"
            className="w-full px-4 py-3 rounded-lg bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 focus:ring-2 focus:ring-blue-500 outline-none transition-all appearance-none"
          >
            <option value="personal">Personal</option>
            <option value="business">Negocio Pequeño</option>
            <option value="enterprise">Empresarial</option>
          </select>
        </div>

        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full group relative flex items-center justify-center gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-semibold py-3 px-6 rounded-lg transition-all duration-200 transform hover:scale-[1.02] active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed shadow-lg hover:shadow-blue-500/25"
        >
          {isSubmitting ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : (
            <>
              Unirme ahora
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </>
          )}
        </button>
        
        <p className="text-xs text-center text-gray-500 dark:text-gray-400 mt-4">
          No compartiremos tus datos. Puedes darte de baja en cualquier momento.
        </p>
      </form>
    </div>
  )
}
