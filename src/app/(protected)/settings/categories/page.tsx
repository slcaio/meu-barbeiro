import { getCategories } from '@/app/categories/actions'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { CreateCategoryDialog } from './create-category-dialog'
import { CategoryList } from './category-list'

export default async function CategoriesPage() {
  const categories = await getCategories()

  const incomeCategories = categories.filter(c => c.type === 'income')
  const expenseCategories = categories.filter(c => c.type === 'expense')

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Categorias</h1>
          <p className="text-muted-foreground">
            Gerencie as categorias de receitas e despesas.
          </p>
        </div>
        <CreateCategoryDialog />
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-green-600">Receitas</CardTitle>
          </CardHeader>
          <CardContent>
            <CategoryList categories={incomeCategories} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-red-600">Despesas</CardTitle>
          </CardHeader>
          <CardContent>
            <CategoryList categories={expenseCategories} />
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
