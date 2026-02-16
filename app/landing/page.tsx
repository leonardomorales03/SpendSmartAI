import type { Metadata } from "next"
import { Hero } from "@/components/landing/Hero"
import { Features } from "@/components/landing/Features"
import { Testimonials } from "@/components/landing/Testimonials"
import { CTA } from "@/components/landing/CTA"
import Link from "next/link"
import { Wallet } from "lucide-react"

export const metadata: Metadata = {
  title: "SpendSmart AI - El futuro de las finanzas personales",
  description: "Toma el control de tus finanzas con la ayuda de inteligencia artificial avanzada. Ahorra más, gasta mejor.",
  openGraph: {
    title: "SpendSmart AI - El futuro de las finanzas personales",
    description: "Toma el control de tus finanzas con la ayuda de inteligencia artificial avanzada. Ahorra más, gasta mejor.",
    url: "https://spendsmart.ai",
    siteName: "SpendSmart AI",
    images: [
      {
        url: "/og-image.jpg", // Assuming an image exists or will be added
        width: 1200,
        height: 630,
      },
    ],
    locale: "es_ES",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "SpendSmart AI - El futuro de las finanzas personales",
    description: "Toma el control de tus finanzas con la ayuda de inteligencia artificial avanzada.",
    images: ["/og-image.jpg"],
  },
}

export default function LandingPage() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    "name": "SpendSmart AI",
    "applicationCategory": "FinanceApplication",
    "operatingSystem": "Web",
    "offers": {
      "@type": "Offer",
      "price": "0",
      "priceCurrency": "USD"
    },
    "description": "SpendSmart AI analiza tus patrones de gasto, predice tendencias y te ayuda a ahorrar automáticamente.",
    "aggregateRating": {
      "@type": "AggregateRating",
      "ratingValue": "4.8",
      "ratingCount": "1250"
    }
  }

  return (
    <div className="min-h-screen bg-white dark:bg-slate-950 font-sans selection:bg-blue-100 selection:text-blue-900">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      
      {/* Simple Navigation */}
      <nav className="absolute top-0 w-full z-50 border-b border-transparent">
        <div className="container px-4 mx-auto h-20 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="bg-gradient-to-tr from-blue-600 to-indigo-600 p-2 rounded-lg">
              <Wallet className="w-6 h-6 text-white" />
            </div>
            <span className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-gray-900 to-gray-600 dark:from-white dark:to-gray-300">
              SpendSmart AI
            </span>
          </div>
          <div className="hidden md:flex items-center gap-8">
            <a href="#features" className="text-sm font-medium text-gray-600 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
              Características
            </a>
            <a href="#testimonials" className="text-sm font-medium text-gray-600 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
              Testimonios
            </a>
            <Link 
              href="/login" 
              className="px-5 py-2.5 rounded-full bg-gray-900 dark:bg-white text-white dark:text-gray-900 text-sm font-semibold hover:bg-gray-800 dark:hover:bg-gray-100 transition-all shadow-lg hover:shadow-xl hover:-translate-y-0.5"
            >
              Iniciar Sesión
            </Link>
          </div>
        </div>
      </nav>

      <main>
        <Hero />
        <div id="features">
          <Features />
        </div>
        <div id="testimonials">
          <Testimonials />
        </div>
        <CTA />
      </main>

      <footer className="py-12 bg-gray-50 dark:bg-slate-950 border-t border-gray-100 dark:border-slate-900">
        <div className="container px-4 mx-auto">
          <div className="flex flex-col md:flex-row justify-between items-center gap-6">
            <div className="flex items-center gap-2">
              <div className="bg-gray-200 dark:bg-slate-800 p-1.5 rounded-lg">
                <Wallet className="w-5 h-5 text-gray-600 dark:text-gray-400" />
              </div>
              <span className="text-lg font-bold text-gray-900 dark:text-white">
                SpendSmart AI
              </span>
            </div>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              © {new Date().getFullYear()} SpendSmart AI. Todos los derechos reservados.
            </p>
            <div className="flex gap-6">
              <a href="#" className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors">
                Privacidad
              </a>
              <a href="#" className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors">
                Términos
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
