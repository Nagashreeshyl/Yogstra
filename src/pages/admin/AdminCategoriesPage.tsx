import { useState } from 'react'
import {
  Flower2, Activity, Flame, Trophy, Wind, Sparkles, Heart, Baby,
  type LucideIcon,
} from 'lucide-react'
import { useApp } from '../../context/AppContext'
import { PageHeader } from '../../components/shell/PageHeader'
import { Button } from '../../components/ui/Button'
import { Modal } from '../../components/ui/Modal'
import { Input } from '../../components/ui/Input'
import { Select } from '../../components/ui/Select'

const iconOptions = [
  { value: 'Flower2', label: 'Flower' },
  { value: 'Activity', label: 'Activity' },
  { value: 'Flame', label: 'Flame' },
  { value: 'Trophy', label: 'Trophy' },
  { value: 'Wind', label: 'Wind' },
  { value: 'Sparkles', label: 'Sparkles' },
  { value: 'Heart', label: 'Heart' },
  { value: 'Baby', label: 'Baby' },
]

const iconMap: Record<string, LucideIcon> = {
  Flower2, Activity, Flame, Trophy, Wind, Sparkles, Heart, Baby,
}

export function AdminCategoriesPage() {
  const { categories, addCategory, updateCategory, deleteCategory } = useApp()
  const [modalOpen, setModalOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState({ name: '', icon: 'Flower2' })

  const openAdd = () => {
    setEditingId(null)
    setForm({ name: '', icon: 'Flower2' })
    setModalOpen(true)
  }

  const openEdit = (id: string) => {
    const cat = categories.find((c) => c.id === id)
    if (cat) {
      setEditingId(id)
      setForm({ name: cat.name, icon: cat.icon })
      setModalOpen(true)
    }
  }

  const handleSave = async () => {
    if (!form.name.trim()) return
    try {
      if (editingId) {
        await updateCategory(editingId, form)
      } else {
        await addCategory(form)
      }
      setModalOpen(false)
    } catch {
      alert('Failed to save category. Admin access required.')
    }
  }

  const handleDelete = async (id: string) => {
    if (confirm('Delete this category? It will be removed from the student-facing app.')) {
      try {
        await deleteCategory(id)
      } catch {
        alert('Failed to delete category. Admin access required.')
      }
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Categories"
        description="Manage yoga style categories shown across the platform."
        actions={<Button onClick={openAdd}>Add New Category</Button>}
      />

      <div className="flex gap-3 flex-wrap">
        {categories.map((cat) => {
          const Icon = iconMap[cat.icon] || Flower2
          return (
            <div
              key={cat.id}
              className="w-32 flex flex-col items-center gap-3 p-4 rounded-[16px] border border-border bg-muted"
            >
              <Icon size={28} className="text-primary" strokeWidth={1.5} />
              <span className="text-xs text-center font-medium">{cat.name}</span>
              <div className="flex gap-1">
                <button onClick={() => openEdit(cat.id)} className="text-[10px] text-primary cursor-pointer hover:underline">
                  Edit
                </button>
                <span className="text-muted-foreground/50">·</span>
                <button onClick={() => handleDelete(cat.id)} className="text-[10px] text-muted-foreground cursor-pointer hover:underline">
                  Delete
                </button>
              </div>
            </div>
          )
        })}
      </div>

      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)}>
        <h2 className="font-heading text-lg font-medium mb-4">
          {editingId ? 'Edit Category' : 'Add New Category'}
        </h2>
        <div className="space-y-4">
          <Input
            label="Category Name"
            value={form.name}
            onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
          />
          <Select
            label="Icon"
            value={form.icon}
            onChange={(e) => setForm((p) => ({ ...p, icon: e.target.value }))}
          >
            {iconOptions.map((opt) => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </Select>
          <Button className="w-full" onClick={handleSave}>Save</Button>
        </div>
      </Modal>
    </div>
  )
}
