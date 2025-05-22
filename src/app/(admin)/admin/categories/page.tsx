"use client"

import { useState } from "react"
import { api } from "~/trpc/react"
import { z } from "zod"
import { toast } from "sonner"
import { Loader2, Trash2, Edit } from "lucide-react"
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter
} from "~/components/ui/card"
import {
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell
} from "~/components/ui/table"
import { Button } from "~/components/ui/button"

const categorySchema = z.object({
  name: z.string().min(1, "Name is required"),
  slug: z.string().min(1, "Slug is required"),
  description: z.string().optional(),
  imageUrl: z.string().optional(),
  parentId: z.string().optional()
})

type CategoryFormData = z.infer<typeof categorySchema>

const defaultFormData: CategoryFormData = {
  name: "",
  slug: "",
  description: "",
  imageUrl: "",
  parentId: ""
}

type CategoryWithCounts = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  imageUrl: string | null;
  parentId: string | null;
  parent?: { name: string } | null;
  _count: { articles: number };
}

export default function CategoriesPage() {
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
  const [formData, setFormData] = useState<CategoryFormData>(defaultFormData)
  const [errors, setErrors] = useState<Partial<Record<keyof CategoryFormData, string>>>({})

  const { data: categories, refetch } = api.category.getAll.useQuery()
  const { mutate: createCategory, isPending: isCreating } = api.category.create.useMutation({
    onSuccess: () => {
      setFormData(defaultFormData)
      void refetch()
      toast.success("Category created successfully")
    },
    onError: (error) => {
      toast.error(error.message)
    }
  })
  const { mutate: updateCategory, isPending: isUpdating } = api.category.update.useMutation({
    onSuccess: () => {
      setSelectedCategory(null)
      setFormData(defaultFormData)
      void refetch()
      toast.success("Category updated successfully")
    },
    onError: (error) => {
      toast.error(error.message)
    }
  })
  const { mutate: deleteCategory, isPending: isDeleting } = api.category.delete.useMutation({
    onSuccess: () => {
      void refetch()
      toast.success("Category deleted successfully")
    },
    onError: (error) => {
      toast.error(error.message)
    }
  })

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
    // Clear error when user starts typing
    if (errors[name as keyof CategoryFormData]) {
      setErrors(prev => ({ ...prev, [name]: undefined }))
    }
  }

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()

    try {
      const validatedData = categorySchema.parse(formData)
      if (selectedCategory) {
        updateCategory({ id: selectedCategory, ...validatedData })
      } else {
        createCategory(validatedData)
      }
    } catch (error) {
      if (error instanceof z.ZodError) {
        const formattedErrors: Record<string, string> = {}
        error.errors.forEach(err => {
          if (err.path[0]) {
            formattedErrors[err.path[0] as string] = err.message
          }
        })
        setErrors(formattedErrors)
      }
    }
  }

  const handleEdit = (category: CategoryWithCounts) => {
    setSelectedCategory(category.id)
    setFormData({
      name: category.name,
      slug: category.slug,
      description: category.description ?? "",
      imageUrl: category.imageUrl ?? "",
      parentId: category.parentId ?? ""
    })
  }

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-3xl font-serif mb-6">Manage Categories</h1>

      {/* Category Form */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle>
            {selectedCategory ? "Edit Category" : "Create New Category"}
          </CardTitle>
          <CardDescription>
            {selectedCategory
              ? "Update the details of an existing category"
              : "Add a new category to organize articles"
            }
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form id="categoryForm" onSubmit={handleSubmit}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Name</label>
                <input
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  className="w-full p-2 border rounded-md focus:ring-[#6b4c35] focus:border-[#6b4c35]"
                  placeholder="Category name"
                />
                {errors.name && (
                  <p className="text-red-500 text-sm mt-1">{errors.name}</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Slug</label>
                <input
                  name="slug"
                  value={formData.slug}
                  onChange={handleInputChange}
                  className="w-full p-2 border rounded-md focus:ring-[#6b4c35] focus:border-[#6b4c35]"
                  placeholder="category-slug"
                />
                {errors.slug && (
                  <p className="text-red-500 text-sm mt-1">{errors.slug}</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Description</label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  className="w-full p-2 border rounded-md focus:ring-[#6b4c35] focus:border-[#6b4c35]"
                  placeholder="Category description"
                  rows={3}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Image URL</label>
                <input
                  name="imageUrl"
                  value={formData.imageUrl}
                  onChange={handleInputChange}
                  className="w-full p-2 border rounded-md focus:ring-[#6b4c35] focus:border-[#6b4c35]"
                  placeholder="https://..."
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Parent Category</label>
                <select
                  name="parentId"
                  value={formData.parentId}
                  onChange={handleInputChange}
                  className="w-full p-2 border rounded-md focus:ring-[#6b4c35] focus:border-[#6b4c35]"
                >
                  <option value="">None</option>
                  {categories?.map((category) => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </form>
        </CardContent>
        <CardFooter className="flex justify-between">
          <div className="flex gap-2">
            <Button
              type="submit"
              form="categoryForm"
              disabled={isCreating || isUpdating}
              className="bg-[#6b4c35] hover:bg-[#8b6c55] text-white"
            >
              {(isCreating || isUpdating) && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              {selectedCategory ? "Update Category" : "Create Category"}
            </Button>
            {selectedCategory && (
              <Button
                variant="outline"
                onClick={() => {
                  setSelectedCategory(null)
                  setFormData(defaultFormData)
                }}
              >
                Cancel
              </Button>
            )}
          </div>
        </CardFooter>
      </Card>

      {/* Categories List */}
      <Card>
        <CardHeader>
          <CardTitle>Categories</CardTitle>
          <CardDescription>
            Manage your existing categories
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader className="bg-gray-50">
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Slug</TableHead>
                <TableHead>Articles</TableHead>
                <TableHead>Parent</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {categories?.map((category) => (
                <TableRow key={category.id} className={category.id === selectedCategory ? "bg-blue-50" : ""}>
                  <TableCell className="font-medium">{category.name}</TableCell>
                  <TableCell>{category.slug}</TableCell>
                  <TableCell>{category._count.articles}</TableCell>
                  <TableCell>{category.parent?.name ?? "-"}</TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleEdit(category)}
                      className="text-[#6b4c35] hover:text-[#8b6c55] mr-2"
                    >
                      <Edit className="w-4 h-4" />
                      <span className="sr-only">Edit</span>
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        if (confirm("Are you sure you want to delete this category?")) {
                          deleteCategory({ id: category.id })
                        }
                      }}
                      disabled={isDeleting || category._count.articles > 0}
                      className="text-red-500 hover:text-red-700 disabled:opacity-50"
                    >
                      <Trash2 className="w-4 h-4" />
                      <span className="sr-only">Delete</span>
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
              {!categories?.length && (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-4 text-muted-foreground">
                    No categories found. Create your first category above.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
} 