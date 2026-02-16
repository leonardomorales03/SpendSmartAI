"use client"

import { LeadForm } from "./LeadForm"
import { motion } from "framer-motion"
import { Twitter, Linkedin, Facebook } from "lucide-react"

export function CTA() {
  return (
    <section className="relative py-24 bg-gray-900 text-white overflow-hidden">
      <div className="absolute inset-0 opacity-20 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] filter contrast-125 brightness-150"></div>
      
      <div className="container px-4 mx-auto relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="space-y-8"
          >
            <h2 className="text-4xl md:text-5xl font-extrabold tracking-tight leading-tight">
              ¿Listo para tomar el control de tu futuro financiero?
            </h2>
            <p className="text-xl text-gray-300 leading-relaxed">
              No dejes que el dinero te controle. Únete a la comunidad de SpendSmart AI y empieza a construir tu libertad financiera hoy mismo.
            </p>
            
            <div className="pt-8">
              <p className="text-sm text-gray-400 mb-4 uppercase tracking-widest font-semibold">Comparte la revolución</p>
              <div className="flex gap-4">
                <button className="p-3 bg-gray-800 hover:bg-blue-600 rounded-full transition-colors duration-300">
                  <Twitter className="w-5 h-5" />
                </button>
                <button className="p-3 bg-gray-800 hover:bg-blue-700 rounded-full transition-colors duration-300">
                  <Linkedin className="w-5 h-5" />
                </button>
                <button className="p-3 bg-gray-800 hover:bg-blue-800 rounded-full transition-colors duration-300">
                  <Facebook className="w-5 h-5" />
                </button>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 50 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="w-full"
          >
            <LeadForm />
          </motion.div>
        </div>
      </div>
    </section>
  )
}
