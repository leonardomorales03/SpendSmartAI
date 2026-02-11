'use client'

import * as React from 'react'
import * as Dialog from '@radix-ui/react-dialog'
import * as ScrollArea from '@radix-ui/react-scroll-area'
import { X } from 'lucide-react'

interface TermsModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function TermsModal({ open, onOpenChange }: TermsModalProps) {
  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 animate-in fade-in duration-200" />
        <Dialog.Content className="fixed left-[50%] top-[50%] z-50 w-full max-w-lg translate-x-[-50%] translate-y-[-50%] gap-4 border border-white/10 bg-zinc-900 p-6 shadow-2xl duration-200 animate-in fade-in zoom-in-95 sm:rounded-lg">
          <div className="flex items-center justify-between mb-4">
            <Dialog.Title className="text-lg font-semibold text-white">
              Términos y Condiciones
            </Dialog.Title>
            <Dialog.Close className="rounded-full p-1.5 hover:bg-white/10 text-zinc-400 hover:text-white transition-colors">
              <X className="h-4 w-4" />
              <span className="sr-only">Cerrar</span>
            </Dialog.Close>
          </div>

          <ScrollArea.Root className="h-[60vh] w-full rounded-md border border-white/5 bg-black/20 p-4">
            <ScrollArea.Viewport className="h-full w-full">
              <div className="space-y-4 text-sm text-zinc-300 pr-4">
                <section>
                  <h3 className="font-semibold text-white mb-2">1. Aceptación de los Términos</h3>
                  <p>
                    Al acceder y utilizar SpendSmart AI, usted acepta estar sujeto a estos Términos y Condiciones. Si no está de acuerdo con alguna parte de estos términos, no podrá acceder al servicio.
                  </p>
                </section>

                <section>
                  <h3 className="font-semibold text-white mb-2">2. Política de Privacidad y Datos Personales</h3>
                  <p>
                    Su privacidad es importante para nosotros. Recopilamos y procesamos sus datos personales (nombre, correo electrónico, transacciones) únicamente para proporcionar el servicio de gestión financiera. Sus datos están protegidos y no serán vendidos a terceros sin su consentimiento explícito. Cumplimos con las normativas locales de protección de datos.
                  </p>
                </section>

                <section>
                  <h3 className="font-semibold text-white mb-2">3. Condiciones de Uso</h3>
                  <p>
                    Usted se compromete a utilizar la aplicación solo para fines legales y personales de gestión financiera. Está prohibido intentar vulnerar la seguridad de la aplicación, realizar ingeniería inversa o utilizar el servicio para actividades ilícitas.
                  </p>
                </section>

                <section>
                  <h3 className="font-semibold text-white mb-2">4. Propiedad Intelectual</h3>
                  <p>
                    El servicio y su contenido original (excluyendo el contenido proporcionado por los usuarios), características y funcionalidad son y seguirán siendo propiedad exclusiva de SpendSmart AI y sus licenciantes.
                  </p>
                </section>

                <section>
                  <h3 className="font-semibold text-white mb-2">5. Limitación de Responsabilidad</h3>
                  <p>
                    SpendSmart AI no se hace responsable de decisiones financieras tomadas basándose en la información proporcionada por la aplicación. La aplicación es una herramienta de ayuda y no sustituye el asesoramiento financiero profesional.
                  </p>
                </section>

                <section>
                  <h3 className="font-semibold text-white mb-2">6. Cancelación y Suspensión</h3>
                  <p>
                    Podemos cancelar o suspender su cuenta inmediatamente, sin previo aviso ni responsabilidad, por cualquier motivo, incluido el incumplimiento de los Términos.
                  </p>
                </section>

                <section>
                  <h3 className="font-semibold text-white mb-2">7. Modificaciones</h3>
                  <p>
                    Nos reservamos el derecho de modificar o reemplazar estos Términos en cualquier momento. Si una revisión es material, intentaremos proporcionar un aviso de al menos 30 días antes de que entren en vigor los nuevos términos.
                  </p>
                </section>

                <section>
                  <h3 className="font-semibold text-white mb-2">8. Ley Aplicable</h3>
                  <p>
                    Estos Términos se regirán e interpretarán de acuerdo con las leyes del país donde opera principalmente SpendSmart AI, sin tener en cuenta sus disposiciones sobre conflictos de leyes.
                  </p>
                </section>

                <section>
                  <h3 className="font-semibold text-white mb-2">9. Consentimiento de Datos</h3>
                  <p>
                    Al aceptar estos términos, usted otorga su consentimiento expreso para el tratamiento de sus datos personales según lo descrito en nuestra Política de Privacidad, incluyendo el almacenamiento seguro, análisis para reportes de gastos y comunicaciones relacionadas con el servicio.
                  </p>
                </section>
                
                <p className="text-xs text-zinc-500 mt-8">
                  Versión 1.0 - Última actualización: {new Date().toLocaleDateString()}
                </p>
              </div>
            </ScrollArea.Viewport>
            <ScrollArea.Scrollbar orientation="vertical" className="flex select-none touch-none p-0.5 bg-white/5 transition-colors duration-[160ms] ease-out hover:bg-white/10 data-[orientation=vertical]:w-2.5 data-[orientation=horizontal]:flex-col data-[orientation=horizontal]:h-2.5">
              <ScrollArea.Thumb className="flex-1 bg-zinc-600 rounded-[10px] relative before:content-[''] before:absolute before:top-1/2 before:left-1/2 before:-translate-x-1/2 before:-translate-y-1/2 before:w-full before:h-full before:min-w-[44px] before:min-h-[44px]" />
            </ScrollArea.Scrollbar>
          </ScrollArea.Root>

          <div className="mt-6 flex justify-end">
            <button
              onClick={() => onOpenChange(false)}
              className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              Entendido
            </button>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}
