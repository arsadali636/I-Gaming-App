"use client";

import { useEffect, useState } from "react";
import {
  Plus,
  Pencil,
  Trash2,
  GripVertical,
  X,
  Tag,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import type { Category } from "@/types";

export default function AdminCategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [editCategory, setEditCategory] = useState<Category | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [form, setForm] = useState({
    name: "",
    slug: "",
    description: "",
    icon: "",
    color: "#6c5ce7",
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchCategories();
  }, []);

  async function fetchCategories() {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/companies?limit=100");
      const data = await res.json();
      const cats: Category[] = [];
      const seen = new Set<string>();
      for (const c of data.companies || []) {
        if (c.categories && !seen.has(c.categories.id)) {
          seen.add(c.categories.id);
          cats.push(c.categories);
        }
      }
      setCategories(cats);
    } catch {
      // silently fail
    } finally {
      setLoading(false);
    }
  }

  function openAdd() {
    setForm({ name: "", slug: "", description: "", icon: "", color: "#6c5ce7" });
    setShowAddForm(true);
  }

  function openEdit(cat: Category) {
    setForm({
      name: cat.name,
      slug: cat.slug,
      description: cat.description || "",
      icon: cat.icon || "",
      color: cat.color || "#6c5ce7",
    });
    setEditCategory(cat);
  }

  async function handleSave() {
    setSaving(true);
    try {
      const url = editCategory
        ? `/api/admin/companies`
        : `/api/admin/companies`;
      await fetch(url, {
        method: editCategory ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...(editCategory ? { category_id: editCategory.id } : {}),
          ...form,
        }),
      });
      setShowAddForm(false);
      setEditCategory(null);
      fetchCategories();
    } catch {
      // silently fail
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this category?")) return;
    try {
      await fetch(`/api/admin/companies`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ category_id: id }),
      });
      fetchCategories();
    } catch {
      // silently fail
    }
  }

  const colorPresets = [
    "#6c5ce7",
    "#00d2ff",
    "#ff6b9d",
    "#00c853",
    "#ffa000",
    "#ff4757",
    "#a29bfe",
    "#fd79a8",
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">
            Category Management
          </h1>
          <p className="text-muted-foreground mt-1">
            Organize companies into categories
          </p>
        </div>
        <Button onClick={openAdd}>
          <Plus className="h-4 w-4 mr-2" />
          Add Category
        </Button>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-40" />
          ))}
        </div>
      ) : categories.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center">
            <Tag className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
            <p className="text-muted-foreground">
              No categories found. Create your first category.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {categories.map((cat) => (
            <Card key={cat.id} className="group relative">
              <CardContent className="p-5">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div
                      className="flex h-10 w-10 items-center justify-center rounded-lg"
                      style={{ backgroundColor: `${cat.color || "#6c5ce7"}20` }}
                    >
                      <Tag
                        className="h-5 w-5"
                        style={{ color: cat.color || "#6c5ce7" }}
                      />
                    </div>
                    <div>
                      <h3 className="text-sm font-semibold text-foreground">
                        {cat.name}
                      </h3>
                      <p className="text-xs text-muted-foreground">
                        /{cat.slug}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7"
                      onClick={() => openEdit(cat)}
                    >
                      <Pencil className="h-3 w-3" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 text-destructive"
                      onClick={() => handleDelete(cat.id)}
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
                {cat.description && (
                  <p className="text-xs text-muted-foreground mt-2 line-clamp-2">
                    {cat.description}
                  </p>
                )}
                <div className="mt-3">
                  <Badge variant="outline">
                    {cat.company_count ?? 0} companies
                  </Badge>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog
        open={showAddForm || !!editCategory}
        onOpenChange={() => {
          setShowAddForm(false);
          setEditCategory(null);
        }}
      >
        <DialogContent
          onClose={() => {
            setShowAddForm(false);
            setEditCategory(null);
          }}
        >
          <DialogHeader>
            <DialogTitle>
              {editCategory ? "Edit Category" : "Add Category"}
            </DialogTitle>
            <DialogDescription>
              {editCategory
                ? "Update the category details"
                : "Create a new category for companies"}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium text-foreground mb-1 block">
                Name
              </label>
              <Input
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="Category name"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-foreground mb-1 block">
                Slug
              </label>
              <Input
                value={form.slug}
                onChange={(e) => setForm({ ...form, slug: e.target.value })}
                placeholder="category-slug"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-foreground mb-1 block">
                Description
              </label>
              <Textarea
                value={form.description}
                onChange={(e) =>
                  setForm({ ...form, description: e.target.value })
                }
                placeholder="Short description"
                rows={2}
              />
            </div>
            <div>
              <label className="text-sm font-medium text-foreground mb-1 block">
                Icon
              </label>
              <Input
                value={form.icon}
                onChange={(e) => setForm({ ...form, icon: e.target.value })}
                placeholder="Icon name (optional)"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-foreground mb-1 block">
                Color
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={form.color}
                  onChange={(e) => setForm({ ...form, color: e.target.value })}
                  className="h-10 w-10 rounded-lg border border-border cursor-pointer"
                />
                <div className="flex gap-1">
                  {colorPresets.map((c) => (
                    <button
                      key={c}
                      onClick={() => setForm({ ...form, color: c })}
                      className="h-6 w-6 rounded-full border border-border hover:scale-110 transition-transform"
                      style={{ backgroundColor: c }}
                    />
                  ))}
                </div>
              </div>
            </div>
          </div>
          <div className="flex justify-end gap-2 mt-4">
            <Button
              variant="outline"
              onClick={() => {
                setShowAddForm(false);
                setEditCategory(null);
              }}
            >
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={saving || !form.name}>
              {saving ? "Saving..." : editCategory ? "Save Changes" : "Create"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
