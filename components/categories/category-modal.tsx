'use client'

import { useState } from 'react'
import { Category } from '@/lib/types'
import { createCategory, updateCategory } from '@/actions/categories'
import { toast } from 'sonner'
import { X, Save, Loader2, RotateCcw } from 'lucide-react'
import EmojiPicker, { Theme, EmojiClickData } from 'emoji-picker-react'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'

interface CategoryModalProps {
  category?: Category
  isOpen: boolean
  onClose: () => void
}

export function CategoryModal({ category, isOpen, onClose }: CategoryModalProps) {
  const [name, setName] = useState(category?.name || '')
  const [emoji, setEmoji] = useState(category?.emoji || '🏷️')
  const [isSaving, setIsSaving] = useState(false)

  if (!isOpen) return null

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSaving(true)

    try {
      let result
      if (category) {
        result = await updateCategory(category.id, { name, emoji })
      } else {
        result = await createCategory({ name, emoji })
      }

      if (result.success) {
        toast.success(category ? 'Categoría actualizada' : 'Categoría creada')
        onClose()
      } else {
        toast.error('Error: ' + result.error)
      }
    } catch {
      toast.error('Ocurrió un error inesperado')
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-card w-full max-w-sm rounded-xl shadow-xl border animate-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="text-lg font-semibold">
            {category ? 'Editar Categoría' : 'Nueva Categoría'}
          </h2>
          <button onClick={onClose} className="p-2 hover:bg-muted rounded-full transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          <div className="grid grid-cols-[80px_1fr] gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Icono</label>
              <Popover>
                <PopoverTrigger asChild>
                  <button
                    type="button"
                    className="w-full h-[42px] bg-background border rounded-md text-2xl hover:bg-muted/50 transition-colors focus:outline-none focus:ring-2 focus:ring-primary/20 flex items-center justify-center"
                  >
                    {emoji}
                  </button>
                </PopoverTrigger>
                <PopoverContent className="w-full p-0 border-none" align="start">
                  <EmojiPicker
                    theme={Theme.DARK}
                    onEmojiClick={(emojiData: EmojiClickData) => setEmoji(emojiData.emoji)}
                    searchPlaceHolder="Buscar icono..."
                    width={320}
                    height={400}
                    lazyLoadEmojis={true}
                    previewConfig={{ showPreview: false }}
                  />
                  <div className="p-2 bg-zinc-900 border-t border-white/10 flex justify-end">
                    <button
                      type="button"
                      onClick={() => setEmoji('🏷️')}
                      className="text-xs text-zinc-400 hover:text-white flex items-center gap-1 transition-colors"
                    >
                      <RotateCcw className="w-3 h-3" /> Restablecer
                    </button>
                  </div>
                </PopoverContent>
              </Popover>
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium">Nombre</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ej: Comida, Transporte..."
                className="w-full px-3 py-2 bg-background border rounded-md focus:outline-none focus:ring-2 focus:ring-primary/20"
                required
              />
            </div>
          </div>

          <div className="pt-2 flex gap-3 justify-end">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium hover:bg-muted rounded-md transition-colors"
              disabled={isSaving}
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="px-4 py-2 text-sm font-medium bg-primary text-primary-foreground hover:bg-primary/90 rounded-md transition-colors flex items-center gap-2"
            >
              {isSaving ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" /> Guardando...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" /> Guardar
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
