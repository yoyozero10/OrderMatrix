"use client";

import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { SectionHeading } from "@/components/ui/section-heading";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { getErrorMessage } from "@/lib/api/client";
import { adminApi, categoryApi, productApi } from "@/lib/api/services";
import type {
  AddProductImageRequest,
  Category,
  ProductImage,
  ProductListItem
} from "@/lib/api/types";
import { formatCurrency } from "@/lib/utils";
import { useRequireAuth } from "@/hooks/use-require-auth";

type ProductForm = {
  id?: string;
  name: string;
  description: string;
  price: string;
  stock: string;
  categoryId: string;
  status: "active" | "inactive";
};

const emptyForm: ProductForm = {
  name: "",
  description: "",
  price: "",
  stock: "",
  categoryId: "",
  status: "active"
};

type ImageForm = {
  imageUrl: string;
  isPrimary: boolean;
  displayOrder: string;
};

const emptyImageForm: ImageForm = {
  imageUrl: "",
  isPrimary: false,
  displayOrder: ""
};

export default function AdminProductsPage() {
  const auth = useRequireAuth({ adminOnly: true });
  const [categories, setCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<ProductListItem[]>([]);
  const [search, setSearch] = useState("");
  const [form, setForm] = useState<ProductForm>(emptyForm);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [productImages, setProductImages] = useState<ProductImage[]>([]);
  const [imageForm, setImageForm] = useState<ImageForm>(emptyImageForm);
  const [isLoadingImages, setIsLoadingImages] = useState(false);
  const [isAddingImage, setIsAddingImage] = useState(false);
  const [deletingImageId, setDeletingImageId] = useState<string | null>(null);
  const [imageError, setImageError] = useState<string | null>(null);
  const [imageNotice, setImageNotice] = useState<string | null>(null);

  const resetImageState = () => {
    setProductImages([]);
    setImageForm(emptyImageForm);
    setIsLoadingImages(false);
    setIsAddingImage(false);
    setDeletingImageId(null);
    setImageError(null);
    setImageNotice(null);
  };

  const resetEditor = () => {
    setForm(emptyForm);
    resetImageState();
  };

  const loadData = async () => {
    if (!auth.accessToken) {
      return;
    }
    setIsLoading(true);
    setError(null);
    try {
      const [categoryList, productList] = await Promise.all([
        categoryApi.getCategories(),
        productApi.getProducts({
          page: 1,
          limit: 50,
          search: search || undefined,
          sortBy: "newest"
        })
      ]);
      setCategories(categoryList);
      setProducts(productList.data);
    } catch (loadError) {
      setError(getErrorMessage(loadError, "Could not load products"));
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [auth.accessToken]);

  const filteredProducts = useMemo(
    () =>
      products.filter((product) =>
        search.trim()
          ? product.name.toLowerCase().includes(search.toLowerCase()) ||
            product.description.toLowerCase().includes(search.toLowerCase())
          : true
      ),
    [products, search]
  );

  const loadProductImages = async (productId: string) => {
    setIsLoadingImages(true);
    setImageError(null);
    setImageNotice(null);
    try {
      const productDetail = await productApi.getProductById(productId);
      setProductImages(productDetail.images);
    } catch (loadError) {
      setProductImages([]);
      setImageError(getErrorMessage(loadError, "Could not load product images"));
    } finally {
      setIsLoadingImages(false);
    }
  };

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
        description: form.description,
        price: Number(form.price),
        stock: Number(form.stock),
        categoryId: form.categoryId,
        status: form.status
      };

      if (form.id) {
        await adminApi.updateProduct(auth.accessToken, form.id, payload);
        setNotice("Product updated.");
      } else {
        await adminApi.createProduct(auth.accessToken, payload);
        setNotice("Product created.");
      }

      resetEditor();
      await loadData();
    } catch (saveError) {
      setError(getErrorMessage(saveError, "Could not save product"));
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
      await adminApi.deleteProduct(auth.accessToken, id);
      setNotice("Product deleted.");
      if (form.id === id) {
        resetEditor();
      }
      await loadData();
    } catch (deleteError) {
      setError(getErrorMessage(deleteError, "Could not delete product"));
    }
  };

  const handleEditProduct = (product: ProductListItem) => {
    setError(null);
    setNotice(null);
    setForm({
      id: product.id,
      name: product.name,
      description: product.description,
      price: String(product.price),
      stock: String(product.stock),
      categoryId: product.category?.id ?? "",
      status: product.status
    });
    setImageForm(emptyImageForm);
    setProductImages([]);
    void loadProductImages(product.id);
  };

  const handleAddProductImage = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!auth.accessToken || !form.id) {
      return;
    }

    setIsAddingImage(true);
    setImageError(null);
    setImageNotice(null);

    const payload: AddProductImageRequest = {
      imageUrl: imageForm.imageUrl.trim(),
      isPrimary: imageForm.isPrimary
    };

    if (imageForm.displayOrder.trim() !== "") {
      payload.displayOrder = Number(imageForm.displayOrder);
    }

    try {
      const updatedProduct = await adminApi.addProductImage(auth.accessToken, form.id, payload);
      setProductImages(updatedProduct.images);
      setImageForm(emptyImageForm);
      setImageNotice("Image added.");
      await loadData();
    } catch (addError) {
      setImageError(getErrorMessage(addError, "Could not add image"));
    } finally {
      setIsAddingImage(false);
    }
  };

  const handleDeleteProductImage = async (imageId: string) => {
    if (!auth.accessToken || !form.id) {
      return;
    }

    setDeletingImageId(imageId);
    setImageError(null);
    setImageNotice(null);

    try {
      const updatedProduct = await adminApi.deleteProductImage(auth.accessToken, form.id, imageId);
      setProductImages(updatedProduct.images);
      setImageNotice("Image removed.");
      await loadData();
    } catch (deleteError) {
      setImageError(getErrorMessage(deleteError, "Could not remove image"));
    } finally {
      setDeletingImageId(null);
    }
  };

  return (
    <div className="space-y-5">
      <SectionHeading
        eyebrow="Admin"
        title="Products Management"
        description="Create, update, or delete products using /admin/products endpoints."
      />

      {error ? <Card className="border-rose-200 bg-rose-50 py-3 text-sm text-rose-700">{error}</Card> : null}
      {notice ? <Card className="border-emerald-200 bg-emerald-50 py-3 text-sm text-emerald-700">{notice}</Card> : null}

      <div className="grid gap-5 xl:grid-cols-[380px_1fr]">
        <Card className="space-y-4">
          <p className="text-xs font-bold uppercase tracking-[0.17em] text-slate">
            {form.id ? "Edit Product" : "Create Product"}
          </p>
          <form className="space-y-3" onSubmit={handleSubmit}>
            <Input
              placeholder="Product name"
              required
              value={form.name}
              onChange={(event) => setForm((prev) => ({ ...prev, name: event.target.value }))}
            />
            <Textarea
              rows={4}
              placeholder="Description"
              required
              value={form.description}
              onChange={(event) => setForm((prev) => ({ ...prev, description: event.target.value }))}
            />
            <div className="grid grid-cols-2 gap-2">
              <Input
                type="number"
                min={0}
                placeholder="Price"
                required
                value={form.price}
                onChange={(event) => setForm((prev) => ({ ...prev, price: event.target.value }))}
              />
              <Input
                type="number"
                min={0}
                placeholder="Stock"
                required
                value={form.stock}
                onChange={(event) => setForm((prev) => ({ ...prev, stock: event.target.value }))}
              />
            </div>
            <Select
              required
              value={form.categoryId}
              onChange={(event) => setForm((prev) => ({ ...prev, categoryId: event.target.value }))}
            >
              <option value="">Select category</option>
              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </Select>
            <Select
              value={form.status}
              onChange={(event) =>
                setForm((prev) => ({ ...prev, status: event.target.value as "active" | "inactive" }))
              }
            >
              <option value="active">active</option>
              <option value="inactive">inactive</option>
            </Select>

            <div className="flex gap-2">
              <Button type="submit" loading={isSaving} className="flex-1">
                {form.id ? "Update" : "Create"}
              </Button>
              <Button
                type="button"
                variant="ghost"
                className="flex-1"
                onClick={resetEditor}
              >
                Reset
              </Button>
            </div>
          </form>

          <div className="space-y-3 border-t border-slate/20 pt-4">
            <p className="text-xs font-bold uppercase tracking-[0.17em] text-slate">Image Management</p>

            {!form.id ? (
              <p className="text-sm text-slate">
                Create a product first, then switch to edit mode to add or remove product images.
              </p>
            ) : (
              <>
                <form className="space-y-3" onSubmit={handleAddProductImage}>
                  <Input
                    type="url"
                    placeholder="https://example.com/image.jpg"
                    required
                    value={imageForm.imageUrl}
                    onChange={(event) =>
                      setImageForm((prev) => ({
                        ...prev,
                        imageUrl: event.target.value
                      }))
                    }
                  />
                  <div className="grid grid-cols-2 gap-2">
                    <Input
                      type="number"
                      min={0}
                      placeholder="Display order (optional)"
                      value={imageForm.displayOrder}
                      onChange={(event) =>
                        setImageForm((prev) => ({
                          ...prev,
                          displayOrder: event.target.value
                        }))
                      }
                    />
                    <label className="flex h-11 items-center gap-2 rounded-xl border border-slate/30 bg-cloud px-3 text-sm text-ink">
                      <input
                        type="checkbox"
                        checked={imageForm.isPrimary}
                        onChange={(event) =>
                          setImageForm((prev) => ({
                            ...prev,
                            isPrimary: event.target.checked
                          }))
                        }
                      />
                      Set as primary image
                    </label>
                  </div>

                  <Button type="submit" loading={isAddingImage} className="w-full">
                    Add Image
                  </Button>
                </form>

                <p className="text-xs text-slate">
                  Existing image primary can only be changed by adding an image with &quot;Set as
                  primary&quot;.
                </p>

                {imageError ? (
                  <Card className="border-rose-200 bg-rose-50 py-3 text-sm text-rose-700">{imageError}</Card>
                ) : null}
                {imageNotice ? (
                  <Card className="border-emerald-200 bg-emerald-50 py-3 text-sm text-emerald-700">
                    {imageNotice}
                  </Card>
                ) : null}

                {isLoadingImages ? (
                  <p className="text-sm text-slate">Loading images...</p>
                ) : productImages.length === 0 ? (
                  <p className="text-sm text-slate">No images for this product yet.</p>
                ) : (
                  <div className="space-y-2">
                    {productImages.map((image) => (
                      <div
                        key={image.id}
                        className="flex items-center gap-2 rounded-xl border border-slate/20 bg-cloud p-2"
                      >
                        <div className="h-14 w-14 overflow-hidden rounded-lg bg-mist">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src={image.imageUrl} alt="Product" className="h-full w-full object-cover" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-xs text-slate">{image.imageUrl}</p>
                          <p className="text-xs font-semibold text-ink">
                            order {image.displayOrder} {image.isPrimary ? "| primary" : ""}
                          </p>
                        </div>
                        <Button
                          size="sm"
                          variant="danger"
                          loading={deletingImageId === image.id}
                          onClick={() => void handleDeleteProductImage(image.id)}
                        >
                          Remove
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </>
            )}
          </div>
        </Card>

        <Card className="space-y-4">
          <div className="flex items-center gap-2">
            <Input
              placeholder="Search products..."
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />
            <Button variant="ghost" onClick={() => void loadData()}>
              Refresh
            </Button>
          </div>

          {isLoading ? (
            <p className="text-sm text-slate">Loading products...</p>
          ) : filteredProducts.length === 0 ? (
            <p className="text-sm text-slate">No products found.</p>
          ) : (
            <div className="space-y-2">
              {filteredProducts.map((product) => (
                <div
                  key={product.id}
                  className="flex flex-col gap-2 rounded-xl border border-slate/20 bg-cloud p-3 md:flex-row md:items-center md:justify-between"
                >
                  <div>
                    <p className="font-semibold text-ink">{product.name}</p>
                    <p className="text-xs text-slate">
                      {product.category?.name ?? "Uncategorized"} | Stock {product.stock} |{" "}
                      {formatCurrency(product.price)}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleEditProduct(product)}
                    >
                      Edit
                    </Button>
                    <Button size="sm" variant="danger" onClick={() => void handleDelete(product.id)}>
                      Delete
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
