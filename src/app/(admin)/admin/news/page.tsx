"use client";

import { useEffect, useState } from "react";
import {
  Newspaper,
  Plus,
  Edit2,
  Trash2,
  CheckCircle,
  XCircle,
  Star,
  Search,
  Sparkles,
  Tag,
  RefreshCw,
  FolderPlus,
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

interface NewsCategory {
  id: string;
  name: string;
  slug: string;
  description: string;
  status: string;
  sort_order: number;
}

interface NewsArticle {
  id: string;
  title: string;
  slug: string;
  short_description: string;
  content: string;
  featured_image: string;
  category_id: string;
  category_name?: string;
  status: string;
  is_featured: number;
  featured_order: number;
  published_at: string;
}

export default function AdminNewsPage() {
  const [activeTab, setActiveTab] = useState<"articles" | "categories">("articles");

  // Data states
  const [articles, setArticles] = useState<NewsArticle[]>([]);
  const [categories, setCategories] = useState<NewsCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  // Modal states
  const [articleModalOpen, setArticleModalOpen] = useState(false);
  const [categoryModalOpen, setCategoryModalOpen] = useState(false);
  const [editingArticle, setEditingArticle] = useState<NewsArticle | null>(null);
  const [editingCategory, setEditingCategory] = useState<NewsCategory | null>(null);

  // Form states for Article
  const [articleForm, setArticleForm] = useState({
    title: "",
    slug: "",
    short_description: "",
    content: "",
    featured_image: "",
    category_id: "",
    status: "published",
    is_featured: false,
    featured_order: 0,
  });

  // Form states for Category
  const [categoryForm, setCategoryForm] = useState({
    name: "",
    slug: "",
    description: "",
    status: "active",
    sort_order: 0,
  });

  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  async function fetchData() {
    try {
      setLoading(true);
      const [artRes, catRes] = await Promise.all([
        fetch("/api/admin/news"),
        fetch("/api/admin/news/categories"),
      ]);

      if (artRes.ok) {
        const artData = await artRes.json();
        setArticles(artData.articles || []);
      }

      if (catRes.ok) {
        const catData = await catRes.json();
        setCategories(catData.categories || []);
      }
    } catch (error) {
      console.error("Error loading admin news data:", error);
    } finally {
      setLoading(false);
    }
  }

  // Handle Article Submit
  async function handleSaveArticle(e: React.FormEvent) {
    e.preventDefault();
    try {
      setSaving(true);
      const method = editingArticle ? "PUT" : "POST";
      const payload = editingArticle ? { ...articleForm, id: editingArticle.id } : articleForm;

      const res = await fetch("/api/admin/news", {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        setArticleModalOpen(false);
        fetchData();
      } else {
        alert("Failed to save news article");
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  }

  // Handle Category Submit
  async function handleSaveCategory(e: React.FormEvent) {
    e.preventDefault();
    try {
      setSaving(true);
      const method = editingCategory ? "PUT" : "POST";
      const payload = editingCategory ? { ...categoryForm, id: editingCategory.id } : categoryForm;

      const res = await fetch("/api/admin/news/categories", {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        setCategoryModalOpen(false);
        fetchData();
      } else {
        alert("Failed to save news category");
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  }

  // Delete Handlers
  async function handleDeleteArticle(id: string) {
    if (!confirm("Are you sure you want to delete this news article?")) return;
    try {
      const res = await fetch(`/api/admin/news?id=${id}`, { method: "DELETE" });
      if (res.ok) fetchData();
    } catch (err) {
      console.error(err);
    }
  }

  async function handleDeleteCategory(id: string) {
    if (!confirm("Are you sure you want to delete this category?")) return;
    try {
      const res = await fetch(`/api/admin/news/categories?id=${id}`, { method: "DELETE" });
      if (res.ok) fetchData();
    } catch (err) {
      console.error(err);
    }
  }

  const openNewArticleModal = () => {
    setEditingArticle(null);
    setArticleForm({
      title: "",
      slug: "",
      short_description: "",
      content: "",
      featured_image: "https://images.unsplash.com/photo-1551836022-d5d88e9218df?q=80&w=800&auto=format&fit=crop",
      category_id: categories[0]?.id || "",
      status: "published",
      is_featured: false,
      featured_order: 0,
    });
    setArticleModalOpen(true);
  };

  const openEditArticleModal = (art: NewsArticle) => {
    setEditingArticle(art);
    setArticleForm({
      title: art.title,
      slug: art.slug,
      short_description: art.short_description,
      content: art.content,
      featured_image: art.featured_image,
      category_id: art.category_id || "",
      status: art.status,
      is_featured: art.is_featured === 1,
      featured_order: art.featured_order || 0,
    });
    setArticleModalOpen(true);
  };

  const openNewCategoryModal = () => {
    setEditingCategory(null);
    setCategoryForm({
      name: "",
      slug: "",
      description: "",
      status: "active",
      sort_order: categories.length + 1,
    });
    setCategoryModalOpen(true);
  };

  const openEditCategoryModal = (cat: NewsCategory) => {
    setEditingCategory(cat);
    setCategoryForm({
      name: cat.name,
      slug: cat.slug,
      description: cat.description,
      status: cat.status,
      sort_order: cat.sort_order,
    });
    setCategoryModalOpen(true);
  };

  const filteredArticles = articles.filter(
    (a) =>
      a.title.toLowerCase().includes(search.toLowerCase()) ||
      (a.category_name && a.category_name.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#F8FAFC] flex items-center gap-2">
            <Newspaper className="h-6 w-6 text-[#4F46E5]" />
            News Management
          </h1>
          <p className="text-xs text-[#A1A9B8] mt-1">
            Manage iGaming news articles, categories, and mega menu featured listings.
          </p>
        </div>

        <div className="flex items-center gap-3">
          {activeTab === "articles" ? (
            <button
              onClick={openNewArticleModal}
              className="inline-flex items-center gap-2 rounded-xl bg-[#4F46E5] px-4 py-2 text-xs font-semibold text-white shadow-lg hover:bg-[#4338CA] transition-all cursor-pointer"
            >
              <Plus className="h-4 w-4" />
              <span>Create News Article</span>
            </button>
          ) : (
            <button
              onClick={openNewCategoryModal}
              className="inline-flex items-center gap-2 rounded-xl bg-[#4F46E5] px-4 py-2 text-xs font-semibold text-white shadow-lg hover:bg-[#4338CA] transition-all cursor-pointer"
            >
              <FolderPlus className="h-4 w-4" />
              <span>Add News Category</span>
            </button>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-[#252A3A] gap-4">
        <button
          onClick={() => setActiveTab("articles")}
          className={cn(
            "pb-3 text-xs font-bold transition-all border-b-2 cursor-pointer flex items-center gap-2",
            activeTab === "articles"
              ? "border-[#4F46E5] text-[#F8FAFC]"
              : "border-transparent text-[#A1A9B8] hover:text-[#F8FAFC]"
          )}
        >
          <Newspaper className="h-4 w-4" />
          <span>Articles ({articles.length})</span>
        </button>
        <button
          onClick={() => setActiveTab("categories")}
          className={cn(
            "pb-3 text-xs font-bold transition-all border-b-2 cursor-pointer flex items-center gap-2",
            activeTab === "categories"
              ? "border-[#4F46E5] text-[#F8FAFC]"
              : "border-transparent text-[#A1A9B8] hover:text-[#F8FAFC]"
          )}
        >
          <Tag className="h-4 w-4" />
          <span>Categories ({categories.length})</span>
        </button>
      </div>

      {/* SEARCH BAR (For Articles) */}
      {activeTab === "articles" && (
        <div className="relative max-w-md">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-[#64748B]" />
          <input
            type="text"
            placeholder="Search articles by title or category..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-xl bg-[#0D1220] border border-[#252A3A] pl-10 pr-4 py-2 text-xs text-[#F8FAFC] focus:outline-none focus:border-[#4F46E5]"
          />
        </div>
      )}

      {/* CONTENT AREA */}
      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-16 w-full rounded-xl bg-[#151C2C]" />
          ))}
        </div>
      ) : activeTab === "articles" ? (
        <div className="overflow-x-auto rounded-2xl border border-[#252A3A] bg-[#0D1220]">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-[#252A3A] bg-[#111726] text-[#94A3B8]">
                <th className="p-4">Article Title</th>
                <th className="p-4">Category</th>
                <th className="p-4">Featured</th>
                <th className="p-4">Status</th>
                <th className="p-4">Published Date</th>
                <th className="p-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#252A3A]">
              {filteredArticles.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-[#94A3B8]">
                    No news articles found.
                  </td>
                </tr>
              ) : (
                filteredArticles.map((art) => (
                  <tr key={art.id} className="hover:bg-[#151C2C]/50 transition-colors">
                    <td className="p-4 font-semibold text-[#F8FAFC] max-w-xs truncate">
                      <div className="flex items-center gap-3">
                        <img
                          src={art.featured_image}
                          alt={art.title}
                          className="h-9 w-12 rounded-lg object-cover bg-[#151C2C]"
                        />
                        <span className="truncate">{art.title}</span>
                      </div>
                    </td>
                    <td className="p-4">
                      <span className="px-2.5 py-1 rounded-md bg-[#4F46E5]/15 text-[#818CF8] font-medium border border-[#4F46E5]/30">
                        {art.category_name || "Uncategorized"}
                      </span>
                    </td>
                    <td className="p-4">
                      {art.is_featured === 1 ? (
                        <span className="inline-flex items-center gap-1 text-[#F59E0B] font-bold">
                          <Star className="h-3.5 w-3.5 fill-[#F59E0B]" />
                          Featured #{art.featured_order}
                        </span>
                      ) : (
                        <span className="text-[#64748B]">Standard</span>
                      )}
                    </td>
                    <td className="p-4">
                      <span
                        className={cn(
                          "px-2 py-0.5 rounded text-[11px] font-bold capitalize",
                          art.status === "published"
                            ? "bg-[#22C55E]/15 text-[#22C55E]"
                            : "bg-[#F59E0B]/15 text-[#F59E0B]"
                        )}
                      >
                        {art.status}
                      </span>
                    </td>
                    <td className="p-4 text-[#94A3B8]">
                      {art.published_at ? new Date(art.published_at).toLocaleDateString() : "—"}
                    </td>
                    <td className="p-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => openEditArticleModal(art)}
                          className="p-1.5 rounded-lg text-[#94A3B8] hover:bg-[#1F293D] hover:text-[#F8FAFC]"
                          title="Edit"
                        >
                          <Edit2 className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteArticle(art.id)}
                          className="p-1.5 rounded-lg text-[#EF4444] hover:bg-[#EF4444]/10"
                          title="Delete"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      ) : (
        /* CATEGORIES TABLE */
        <div className="overflow-x-auto rounded-2xl border border-[#252A3A] bg-[#0D1220]">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-[#252A3A] bg-[#111726] text-[#94A3B8]">
                <th className="p-4">Category Name</th>
                <th className="p-4">Slug</th>
                <th className="p-4">Sort Order</th>
                <th className="p-4">Status</th>
                <th className="p-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#252A3A]">
              {categories.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-[#94A3B8]">
                    No news categories found.
                  </td>
                </tr>
              ) : (
                categories.map((cat) => (
                  <tr key={cat.id} className="hover:bg-[#151C2C]/50 transition-colors">
                    <td className="p-4 font-bold text-[#F8FAFC]">{cat.name}</td>
                    <td className="p-4 text-[#94A3B8] font-mono">{cat.slug}</td>
                    <td className="p-4 text-[#94A3B8]">{cat.sort_order}</td>
                    <td className="p-4">
                      <span
                        className={cn(
                          "px-2 py-0.5 rounded text-[11px] font-bold uppercase",
                          cat.status === "active"
                            ? "bg-[#22C55E]/15 text-[#22C55E]"
                            : "bg-[#64748B]/15 text-[#64748B]"
                        )}
                      >
                        {cat.status}
                      </span>
                    </td>
                    <td className="p-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => openEditCategoryModal(cat)}
                          className="p-1.5 rounded-lg text-[#94A3B8] hover:bg-[#1F293D] hover:text-[#F8FAFC]"
                        >
                          <Edit2 className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteCategory(cat.id)}
                          className="p-1.5 rounded-lg text-[#EF4444] hover:bg-[#EF4444]/10"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* ARTICLE MODAL */}
      {articleModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
          <div className="w-full max-w-2xl rounded-2xl bg-[#0D1220] border border-[#252A3A] p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-bold text-white">
              {editingArticle ? "Edit News Article" : "Create News Article"}
            </h3>

            <form onSubmit={handleSaveArticle} className="space-y-4 text-xs">
              <div className="space-y-1">
                <label className="text-[#94A3B8] font-semibold">Title *</label>
                <input
                  type="text"
                  required
                  value={articleForm.title}
                  onChange={(e) => {
                    const title = e.target.value;
                    const slug = title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
                    setArticleForm({ ...articleForm, title, slug: editingArticle ? articleForm.slug : slug });
                  }}
                  className="w-full rounded-xl bg-[#151C2C] border border-[#252A3A] px-3.5 py-2 text-white focus:outline-none focus:border-[#4F46E5]"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[#94A3B8] font-semibold">URL Slug *</label>
                <input
                  type="text"
                  required
                  value={articleForm.slug}
                  onChange={(e) => setArticleForm({ ...articleForm, slug: e.target.value })}
                  className="w-full rounded-xl bg-[#151C2C] border border-[#252A3A] px-3.5 py-2 text-white font-mono focus:outline-none focus:border-[#4F46E5]"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[#94A3B8] font-semibold">Category *</label>
                  <select
                    value={articleForm.category_id}
                    onChange={(e) => setArticleForm({ ...articleForm, category_id: e.target.value })}
                    className="w-full rounded-xl bg-[#151C2C] border border-[#252A3A] px-3.5 py-2 text-white focus:outline-none focus:border-[#4F46E5]"
                  >
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-[#94A3B8] font-semibold">Featured Image URL</label>
                  <input
                    type="text"
                    value={articleForm.featured_image}
                    onChange={(e) => setArticleForm({ ...articleForm, featured_image: e.target.value })}
                    className="w-full rounded-xl bg-[#151C2C] border border-[#252A3A] px-3.5 py-2 text-white focus:outline-none focus:border-[#4F46E5]"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[#94A3B8] font-semibold">Short Excerpt / Summary</label>
                <textarea
                  rows={2}
                  value={articleForm.short_description}
                  onChange={(e) => setArticleForm({ ...articleForm, short_description: e.target.value })}
                  className="w-full rounded-xl bg-[#151C2C] border border-[#252A3A] px-3.5 py-2 text-white focus:outline-none focus:border-[#4F46E5]"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[#94A3B8] font-semibold">Full Article Content (HTML allowed)</label>
                <textarea
                  rows={6}
                  value={articleForm.content}
                  onChange={(e) => setArticleForm({ ...articleForm, content: e.target.value })}
                  className="w-full rounded-xl bg-[#151C2C] border border-[#252A3A] px-3.5 py-2 text-white font-mono text-[11px] focus:outline-none focus:border-[#4F46E5]"
                />
              </div>

              <div className="flex items-center gap-6 pt-2">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={articleForm.is_featured}
                    onChange={(e) => setArticleForm({ ...articleForm, is_featured: e.target.checked })}
                    className="rounded border-[#252A3A] bg-[#151C2C] text-[#4F46E5]"
                  />
                  <span className="font-bold text-[#F8FAFC]">Show in Navbar Mega Menu (Featured)</span>
                </label>

                {articleForm.is_featured && (
                  <div className="flex items-center gap-2">
                    <span className="text-[#94A3B8]">Order:</span>
                    <input
                      type="number"
                      value={articleForm.featured_order}
                      onChange={(e) => setArticleForm({ ...articleForm, featured_order: parseInt(e.target.value, 10) || 0 })}
                      className="w-16 rounded-lg bg-[#151C2C] border border-[#252A3A] px-2 py-1 text-white text-center"
                    />
                  </div>
                )}
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-[#252A3A]">
                <button
                  type="button"
                  onClick={() => setArticleModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-white/[0.05] text-[#94A3B8] hover:bg-white/[0.1]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-5 py-2 rounded-xl bg-[#4F46E5] text-white font-bold hover:bg-[#4338CA]"
                >
                  {saving ? "Saving..." : "Save Article"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CATEGORY MODAL */}
      {categoryModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl bg-[#0D1220] border border-[#252A3A] p-6 shadow-2xl space-y-4">
            <h3 className="text-lg font-bold text-white">
              {editingCategory ? "Edit News Category" : "Add News Category"}
            </h3>

            <form onSubmit={handleSaveCategory} className="space-y-4 text-xs">
              <div className="space-y-1">
                <label className="text-[#94A3B8] font-semibold">Category Name *</label>
                <input
                  type="text"
                  required
                  value={categoryForm.name}
                  onChange={(e) => {
                    const name = e.target.value;
                    const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
                    setCategoryForm({ ...categoryForm, name, slug: editingCategory ? categoryForm.slug : slug });
                  }}
                  className="w-full rounded-xl bg-[#151C2C] border border-[#252A3A] px-3.5 py-2 text-white focus:outline-none focus:border-[#4F46E5]"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[#94A3B8] font-semibold">Slug *</label>
                <input
                  type="text"
                  required
                  value={categoryForm.slug}
                  onChange={(e) => setCategoryForm({ ...categoryForm, slug: e.target.value })}
                  className="w-full rounded-xl bg-[#151C2C] border border-[#252A3A] px-3.5 py-2 text-white font-mono focus:outline-none focus:border-[#4F46E5]"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[#94A3B8] font-semibold">Description</label>
                <textarea
                  rows={2}
                  value={categoryForm.description}
                  onChange={(e) => setCategoryForm({ ...categoryForm, description: e.target.value })}
                  className="w-full rounded-xl bg-[#151C2C] border border-[#252A3A] px-3.5 py-2 text-white focus:outline-none focus:border-[#4F46E5]"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[#94A3B8] font-semibold">Sort Order</label>
                  <input
                    type="number"
                    value={categoryForm.sort_order}
                    onChange={(e) => setCategoryForm({ ...categoryForm, sort_order: parseInt(e.target.value, 10) || 0 })}
                    className="w-full rounded-xl bg-[#151C2C] border border-[#252A3A] px-3.5 py-2 text-white focus:outline-none focus:border-[#4F46E5]"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[#94A3B8] font-semibold">Status</label>
                  <select
                    value={categoryForm.status}
                    onChange={(e) => setCategoryForm({ ...categoryForm, status: e.target.value })}
                    className="w-full rounded-xl bg-[#151C2C] border border-[#252A3A] px-3.5 py-2 text-white focus:outline-none focus:border-[#4F46E5]"
                  >
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                  </select>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-[#252A3A]">
                <button
                  type="button"
                  onClick={() => setCategoryModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-white/[0.05] text-[#94A3B8] hover:bg-white/[0.1]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-5 py-2 rounded-xl bg-[#4F46E5] text-white font-bold hover:bg-[#4338CA]"
                >
                  {saving ? "Saving..." : "Save Category"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
