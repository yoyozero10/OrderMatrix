"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { SectionHeading } from "@/components/ui/section-heading";
import { Textarea } from "@/components/ui/textarea";
import { adminApi, categoryApi } from "@/lib/api/services";
import { getErrorMessage } from "@/lib/api/client";
import type { Category } from "@/lib/api/types";
import { useRequireAuth } from "@/hooks/use-require-auth";

type CategoryForm = {
  id?: string;
  name: string;
  description: string;
  image: string;
};

const emptyForm: CategoryForm = {
  name: "",
  description: "",
  image: ""
};

export default function AdminCategoriesPage() {
  const auth = useRequireAuth({ adminOnly: true });
  const [categories, setCategories] = useState<Category[]>([]);
  const [form, setForm] = useState<CategoryForm>(emptyForm);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const loadCategories = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await categoryApi.getCategories();
      setCategories(response);
    } catch (loadError) {
      setError(getErrorMessage(loadError, "Could not load categories"));
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void loadCategories();
  }, []);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!auth.accessToken) {
      return;
    }
    setIsSaving(true);
    setError(null);
    setNotice(null);

    try {
      const payload = {
        name: form.name,
        description: form.description || undefined,
        image: form.image || undefined
      };

      if (form.id) {
        await adminApi.updateCategory(auth.accessToken, form.id, payload);
        setNotice("Category updated.");
      } else {
        await adminApi.createCategory(auth.accessToken, payload);
        setNotice("Category created.");
      }

      setForm(emptyForm);
      await loadCategories();
    } catch (saveError) {
      setError(getErrorMessage(saveError, "Could not save category"));
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!auth.accessToken) {
      return;
    }
    setError(null);
    setNotice(null);
    try {
      await adminApi.deleteCategory(auth.accessToken, id);
      setNotice("Category deleted.");
      await loadCategories();
    } catch (deleteError) {
      setError(getErrorMessage(deleteError, "Could not delete category"));
    }
  };

  return (
    <div className="space-y-5">
      <SectionHeading
        eyebrow="Admin"
        title="Categories Management"
        description="Manage product categories and metadata."
      />

      {error ? <Card className="border-rose-200 bg-rose-50 py-3 text-sm text-rose-700">{error}</Card> : null}
      {notice ? <Card className="border-emerald-200 bg-emerald-50 py-3 text-sm text-emerald-700">{notice}</Card> : null}

      <div className="grid gap-5 xl:grid-cols-[360px_1fr]">
        <Card className="space-y-4">
          <p className="text-xs font-bold uppercase tracking-[0.17em] text-slate">
            {form.id ? "Edit Category" : "Create Category"}
          </p>
          <form className="space-y-3" onSubmit={handleSubmit}>
            <Input
              required
              placeholder="Category name"
              value={form.name}
              onChange={(event) => setForm((prev) => ({ ...prev, name: event.target.value }))}
            />
            <Textarea
              rows={4}
              placeholder="Description"
              value={form.description}
              onChange={(event) => setForm((prev) => ({ ...prev, description: event.target.value }))}
            />
            <Input
              placeholder="Image URL"
              value={form.image}
              onChange={(event) => setForm((prev) => ({ ...prev, image: event.target.value }))}
            />
            <div className="flex gap-2">
              <Button type="submit" className="flex-1" loading={isSaving}>
                {form.id ? "Update" : "Create"}
              </Button>
              <Button type="button" variant="ghost" className="flex-1" onClick={() => setForm(emptyForm)}>
                Reset
              </Button>
            </div>
          </form>
        </Card>

        <Card className="space-y-3">
          {isLoading ? (
            <p className="text-sm text-slate">Loading categories...</p>
          ) : categories.length === 0 ? (
            <p className="text-sm text-slate">No categories yet.</p>
          ) : (
            categories.map((category) => (
              <div
                key={category.id}
                className="flex flex-col gap-2 rounded-xl border border-slate/20 bg-cloud p-3 md:flex-row md:items-center md:justify-between"
              >
                <div>
                  <p className="font-semibold text-ink">{category.name}</p>
                  <p className="text-xs text-slate">{category.description || "No description"}</p>
                  <p className="text-xs text-slate">Products: {category.productCount ?? 0}</p>
                </div>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() =>
                      setForm({
                        id: category.id,
                        name: category.name,
                        description: category.description ?? "",
                        image: category.image ?? ""
                      })
                    }
                  >
                    Edit
                  </Button>
                  <Button size="sm" variant="danger" onClick={() => void handleDelete(category.id)}>
                    Delete
                  </Button>
                </div>
              </div>
            ))
          )}
        </Card>
      </div>
    </div>
  );
}
