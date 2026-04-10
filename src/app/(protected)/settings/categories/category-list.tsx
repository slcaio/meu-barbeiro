'use client'

import { Button } from '@/components/ui/button'
import { Trash2 } from 'lucide-react'
import { deleteCategory } from '@/app/categories/actions'
import { useTransition } from 'react'

interface Category {
  id: string
  name: string
  type: 'income' | 'expense'
}

export function CategoryList({ categories }: { categories: Category[] }) {
  const [isPending, startTransition] = useTransition()

  const handleDelete = (id: string, name: string) => {
    if (confirm(`Tem certeza que deseja excluir a categoria "${name}"?`)) {
      startTransition(async () => {
        const result = await deleteCategory(id)
        if (result?.error) {
          alert(result.error)
        }
      })
    }
  }

  if (categories.length === 0) {
    return (
      <p className="text-sm text-muted-foreground text-center py-4">
        Nenhuma categoria cadastrada.
      </p>
    )
  }

  return (
    <div className="space-y-2">
      {categories.map((category) => (
        <div
          key={category.id}
          className="flex items-center justify-between rounded-md border px-4 py-3"
        >
          <span className="text-sm font-medium">{category.name}</span>
          <Button
            variant="ghost"
            size="icon"
            className="text-muted-foreground hover:text-red-500"
            onClick={() => handleDelete(category.id, category.name)}
            disabled={isPending}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      ))}
    </div>
  )
}
