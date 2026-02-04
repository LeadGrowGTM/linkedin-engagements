import { useState } from 'react'
import { Plus, Edit2, Trash2, X, Check } from 'lucide-react'
import { Dialog, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { useCategories, useAddCategory, useUpdateCategory, useDeleteCategory } from '@/hooks/useCategories'

interface ManageCategoriesModalProps {
  open: boolean
  onClose: () => void
}

const PRESET_COLORS = [
  '#3b82f6', // blue
  '#10b981', // green
  '#f59e0b', // amber
  '#ef4444', // red
  '#8b5cf6', // purple
  '#ec4899', // pink
  '#06b6d4', // cyan
  '#84cc16', // lime
  '#f97316', // orange
  '#6366f1', // indigo
]

export default function ManageCategoriesModal({ open, onClose }: ManageCategoriesModalProps) {
  const { data: categories, isLoading } = useCategories()
  const addCategory = useAddCategory()
  const updateCategory = useUpdateCategory()
  const deleteCategory = useDeleteCategory()

  const [newCategoryName, setNewCategoryName] = useState('')
  const [newCategoryColor, setNewCategoryColor] = useState('#3b82f6')
  const [editingId, setEditingId] = useState<number | null>(null)
  const [editName, setEditName] = useState('')
  const [editColor, setEditColor] = useState('')

  const handleAdd = async () => {
    if (!newCategoryName.trim()) return

    try {
      await addCategory.mutateAsync({
        name: newCategoryName.trim(),
        color: newCategoryColor,
      })
      setNewCategoryName('')
      setNewCategoryColor('#3b82f6')
    } catch (error) {
      console.error('Error adding category:', error)
      alert('Failed to add category. It may already exist.')
    }
  }

  const startEdit = (id: number, name: string, color: string) => {
    setEditingId(id)
    setEditName(name)
    setEditColor(color)
  }

  const handleUpdate = async (id: number) => {
    if (!editName.trim()) return

    try {
      await updateCategory.mutateAsync({
        id,
        name: editName.trim(),
        color: editColor,
      })
      setEditingId(null)
    } catch (error) {
      console.error('Error updating category:', error)
      alert('Failed to update category.')
    }
  }

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure? Profiles in this category will be uncategorized.')) return

    try {
      await deleteCategory.mutateAsync(id)
    } catch (error) {
      console.error('Error deleting category:', error)
    }
  }

  return (
    <Dialog open={open} onClose={onClose}>
      <DialogHeader>
        <DialogTitle>Manage Categories</DialogTitle>
        <DialogDescription>
          Create and customize categories to organize your LinkedIn profiles
        </DialogDescription>
      </DialogHeader>

      <div className="space-y-6">
        {/* Add New Category */}
        <div className="p-4 rounded-lg border border-navy-200 dark:border-navy-800 bg-navy-50 dark:bg-navy-900/50">
          <Label className="mb-3 block">Add New Category</Label>
          <div className="space-y-3">
            <Input
              placeholder="Category name..."
              value={newCategoryName}
              onChange={(e) => setNewCategoryName(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleAdd()}
            />
            
            <div>
              <Label className="text-xs mb-2 block">Color</Label>
              <div className="flex gap-2 flex-wrap">
                {PRESET_COLORS.map((color) => (
                  <button
                    key={color}
                    type="button"
                    onClick={() => setNewCategoryColor(color)}
                    className={`w-8 h-8 rounded-md transition-all ${
                      newCategoryColor === color
                        ? 'ring-2 ring-navy-900 dark:ring-navy-50 ring-offset-2'
                        : 'hover:scale-110'
                    }`}
                    style={{ backgroundColor: color }}
                  />
                ))}
                <input
                  type="color"
                  value={newCategoryColor}
                  onChange={(e) => setNewCategoryColor(e.target.value)}
                  className="w-8 h-8 rounded-md cursor-pointer"
                />
              </div>
            </div>

            <Button
              onClick={handleAdd}
              disabled={!newCategoryName.trim() || addCategory.isPending}
              className="w-full"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Category
            </Button>
          </div>
        </div>

        {/* Existing Categories */}
        <div>
          <Label className="mb-3 block">Existing Categories ({categories?.length || 0})</Label>
          {isLoading ? (
            <div className="space-y-2">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="h-16 bg-navy-100 dark:bg-navy-800 rounded-lg animate-pulse" />
              ))}
            </div>
          ) : categories && categories.length > 0 ? (
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {categories.map((category) => (
                <div
                  key={category.id}
                  className="p-3 rounded-lg border border-navy-200 dark:border-navy-800 flex items-center gap-3"
                >
                  {editingId === category.id ? (
                    <>
                      <div className="flex-1 space-y-2">
                        <Input
                          value={editName}
                          onChange={(e) => setEditName(e.target.value)}
                          className="text-sm"
                        />
                        <div className="flex gap-2 flex-wrap">
                          {PRESET_COLORS.map((color) => (
                            <button
                              key={color}
                              type="button"
                              onClick={() => setEditColor(color)}
                              className={`w-6 h-6 rounded transition-all ${
                                editColor === color
                                  ? 'ring-2 ring-navy-900 dark:ring-navy-50'
                                  : ''
                              }`}
                              style={{ backgroundColor: color }}
                            />
                          ))}
                        </div>
                      </div>
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => handleUpdate(category.id)}
                        className="text-green-600 shrink-0"
                      >
                        <Check className="h-4 w-4" />
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => setEditingId(null)}
                        className="shrink-0"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </>
                  ) : (
                    <>
                      <div
                        className="w-4 h-4 rounded shrink-0"
                        style={{ backgroundColor: category.color }}
                      />
                      <Badge
                        variant="secondary"
                        className="flex-1"
                        style={{
                          backgroundColor: category.color + '20',
                          color: category.color,
                          borderColor: category.color + '40',
                        }}
                      >
                        {category.name}
                      </Badge>
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => startEdit(category.id, category.name, category.color)}
                        className="shrink-0"
                      >
                        <Edit2 className="h-4 w-4" />
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => handleDelete(category.id)}
                        className="text-red-600 shrink-0"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-navy-500 dark:text-navy-400 text-sm">
              No categories yet. Create your first category above.
            </div>
          )}
        </div>
      </div>

      <DialogFooter>
        <Button variant="outline" onClick={onClose}>
          Done
        </Button>
      </DialogFooter>
    </Dialog>
  )
}

