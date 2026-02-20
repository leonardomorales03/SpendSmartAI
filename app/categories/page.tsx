'use client'

import { useState, useEffect } from 'react'
import { Category } from '@/lib/types'
import { getCategories, deleteCategory } from '@/actions/categories'
import { CategoryModal } from '@/components/categories/category-modal'
import { Plus, Trash2, Edit2, ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import { toast } from 'sonner'
import '@/components/ui/custom-scrollbar.css' // Import optional custom scrollbar if it exists, otherwise use tailwind utilities

export default function CategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingCategory, setEditingCategory] = useState<Category | undefined>(undefined)

  const loadCategories = async () => {
    try {
      setIsLoading(true)
      const data = await getCategories()
      setCategories(data || [])
    } catch (error) {
      console.error('Error loading categories:', error)
      toast.error('Error al cargar las categorías')
      setCategories([])
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadCategories()
  }, [isModalOpen]) // Reload when modal closes (after create/update)

  const handleDelete = async (id: string) => {
    if (!confirm('¿Estás seguro? Esta acción no se puede deshacer.')) return

    const result = await deleteCategory(id)
    if (result.success) {
      toast.success('Categoría eliminada')
      loadCategories()
    } else {
      toast.error('Error: ' + result.error)
    }
  }

  const handleEdit = (category: Category) => {
    setEditingCategory(category)
    setIsModalOpen(true)
  }

  const handleCreate = () => {
    setEditingCategory(undefined)
    setIsModalOpen(true)
  }

  return (
    <div className="min-h-screen bg-black text-white p-4 pb-24 md:p-8">
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/" className="p-2 hover:bg-white/10 rounded-full transition-colors">
              <ArrowLeft className="w-6 h-6" />
            </Link>
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Categorías</h1>
              <p className="text-zinc-400">Personaliza cómo organizas tus gastos</p>
            </div>
          </div>
          <button
            onClick={handleCreate}
            className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2 rounded-full font-medium transition-all"
          >
            <Plus className="w-5 h-5" />
            <span className="hidden sm:inline">Nueva Categoría</span>
          </button>
        </div>

        {/* List */}
        {isLoading ? (
          <div className="text-center py-12">
            <div className="animate-spin w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full mx-auto mb-4"></div>
            <p className="text-zinc-500">Cargando categorías...</p>
          </div>
        ) : categories.length === 0 ? (
          <div className="text-center py-16 border border-dashed border-zinc-800 rounded-2xl">
            <p className="text-zinc-500 mb-4">No tienes categorías personalizadas.</p>
            <button onClick={handleCreate} className="text-indigo-400 hover:text-indigo-300">
              Crear la primera
            </button>
          </div>
        ) : (
          <div className="max-h-[60vh] overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-zinc-700 scrollbar-track-transparent">
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 md:gap-4">
              {categories.map((cat) => (
                <div
                  key={cat.id}
                  className="group relative flex flex-col items-center justify-center text-center p-4 min-h-[120px] bg-zinc-900/50 border border-white/5 rounded-2xl hover:border-indigo-500/30 hover:bg-zinc-800/50 transition-all"
                >
                  <div className="flex flex-col items-center gap-2">
                    <span className="text-4xl select-none mb-1">{cat.emoji}</span>
                    <span className="font-medium text-sm text-zinc-200 line-clamp-1">{cat.name}</span>
                  </div>

                  {cat.user_id && (
                    <div className="absolute top-2 right-2 flex flex-col gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={(e) => { e.stopPropagation(); handleEdit(cat); }}
                        className="p-1.5 text-zinc-400 hover:text-indigo-400 hover:bg-white/10 rounded-md bg-black/40 backdrop-blur-md"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={(e) => { e.stopPropagation(); handleDelete(cat.id); }}
                        className="p-1.5 text-zinc-400 hover:text-red-400 hover:bg-white/10 rounded-md bg-black/40 backdrop-blur-md"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <CategoryModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        category={editingCategory}
      />
    </div>
  )
}
