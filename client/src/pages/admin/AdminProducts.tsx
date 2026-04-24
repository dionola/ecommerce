import { useState, useEffect } from 'react';
import { getProducts } from '../../services/products';
import { createProduct, updateProduct, deleteProduct } from '../../services/admin';
import type { CreateProductData } from '../../services/admin';
import { Plus, Edit, Trash2, AlertTriangle } from 'lucide-react';
import type { ProductDtoType } from '../../types/product';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { toast } from '../../components/ui/toaster';
import { formatCurrency } from '../../lib/currency';

function AdminProductsSkeleton() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-pulse">
      {Array.from({ length: 6 }).map((_, index) => (
        <div key={index} className="border border-border rounded-lg p-4 space-y-4">
          <div className="w-full h-48 bg-secondary rounded" />
          <div className="h-5 w-3/4 bg-secondary rounded-sm" />
          <div className="h-4 w-24 bg-secondary rounded-sm" />
          <div className="flex gap-2">
            <div className="h-9 w-9 bg-secondary rounded-sm" />
            <div className="h-9 w-9 bg-secondary rounded-sm" />
          </div>
        </div>
      ))}
    </div>
  )
}

export default function AdminProducts() {
  const [products, setProducts] = useState<ProductDtoType[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<ProductDtoType | null>(null);
  const lowStockThreshold = 5;

  useEffect(() => {
    loadProducts();
  }, []);

  const loadProducts = async () => {
    try {
      setLoading(true);
      const response = await getProducts({ limit: 100 });
      setProducts(response.products);
    } catch (error) {
      console.error('Failed to load products:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (data: CreateProductData) => {
    try {
      await createProduct(data);
      await loadProducts();
      setIsCreateModalOpen(false);
      toast({
        title: "Product created",
        description: "Product has been created successfully",
        variant: "success",
      })
    } catch (error) {
      console.error('Failed to create product:', error);
      toast({
        title: "Error",
        description: 'Failed to create product',
        variant: "destructive",
      })
    }
  };

  const handleUpdate = async (id: number, data: Partial<CreateProductData>) => {
    try {
      await updateProduct(id, data);
      await loadProducts();
      setEditingProduct(null);
      toast({
        title: "Product updated",
        description: "Product has been updated successfully",
        variant: "success",
      })
    } catch (error) {
      console.error('Failed to update product:', error);
      toast({
        title: "Error",
        description: 'Failed to update product',
        variant: "destructive",
      })
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this product?')) return;
    try {
      await deleteProduct(id);
      await loadProducts();
      toast({
        title: "Product deleted",
        description: "Product has been deleted successfully",
        variant: "success",
      })
    } catch (error) {
      console.error('Failed to delete product:', error);
      toast({
        title: "Error",
        description: 'Failed to delete product',
        variant: "destructive",
      })
    }
  };

  return (
    <div className="max-w-[1400px] mx-auto px-6 py-12">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-4xl font-bold mb-2">Products</h1>
          <p className="text-muted-foreground">Manage your product catalog</p>
        </div>
        <Button onClick={() => setIsCreateModalOpen(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Add Product
        </Button>
      </div>

      {!loading && (
        <div className="mb-8 flex flex-wrap gap-4">
          <div className="border border-border rounded-lg px-4 py-3 min-w-40">
            <p className="text-xs uppercase tracking-widest text-muted-foreground mb-1">Total Products</p>
            <p className="text-2xl font-bold">{products.length}</p>
          </div>
          <div className="border border-amber-500/30 bg-amber-500/5 rounded-lg px-4 py-3 min-w-40">
            <p className="text-xs uppercase tracking-widest text-amber-700 mb-1">Low Stock</p>
            <p className="text-2xl font-bold">
              {products.filter((product) => product.stock_quantity > 0 && product.stock_quantity <= lowStockThreshold).length}
            </p>
          </div>
          <div className="border border-destructive/30 bg-destructive/5 rounded-lg px-4 py-3 min-w-40">
            <p className="text-xs uppercase tracking-widest text-destructive mb-1">Out of Stock</p>
            <p className="text-2xl font-bold">{products.filter((product) => product.stock_quantity === 0).length}</p>
          </div>
        </div>
      )}

      {loading ? (
        <AdminProductsSkeleton />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {products.map((product) => (
            <div key={product.id} className="border border-border rounded-lg p-4">
              <div className="mb-4">
                {product.images[0] && (
                  <img
                    src={product.images[0].url}
                    alt={product.name}
                    className="w-full h-48 object-cover rounded"
                  />
                )}
              </div>
              <h3 className="font-semibold mb-2">{product.name}</h3>
              <p className="text-sm text-muted-foreground mb-2">{formatCurrency(product.base_price)}</p>
              <div className="flex items-center justify-between mb-4 text-sm">
                <span className="text-muted-foreground">Stock: {product.stock_quantity}</span>
                {product.stock_quantity === 0 ? (
                  <span className="inline-flex items-center gap-1 text-destructive">
                    <AlertTriangle className="w-4 h-4" />
                    Out
                  </span>
                ) : product.stock_quantity <= lowStockThreshold ? (
                  <span className="inline-flex items-center gap-1 text-amber-600">
                    <AlertTriangle className="w-4 h-4" />
                    Low
                  </span>
                ) : null}
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setEditingProduct(product)}
                >
                  <Edit className="w-4 h-4" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleDelete(product.id)}
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      {isCreateModalOpen && (
        <ProductModal
          onClose={() => setIsCreateModalOpen(false)}
          onSave={handleCreate}
        />
      )}

      {editingProduct && (
        <ProductModal
          product={editingProduct}
          onClose={() => setEditingProduct(null)}
          onSave={(data) => handleUpdate(editingProduct.id, data)}
        />
      )}
    </div>
  );
}

function ProductModal({
  product,
  onClose,
  onSave,
}: {
  product?: ProductDtoType;
  onClose: () => void;
  onSave: (data: CreateProductData) => void;
}) {
  const [formData, setFormData] = useState<CreateProductData>({
    name: product?.name || '',
    description: product?.description || '',
    base_price: product?.base_price || 0,
    country_of_origin: product?.country_of_origin || '',
    stock_quantity: product?.stock_quantity || 0,
    manufacturer_id: product?.manufacturer_id || null,
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-background border border-border rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <h2 className="text-2xl font-bold mb-4">{product ? 'Edit' : 'Create'} Product</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="name">Name</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
            />
          </div>
          <div>
            <Label htmlFor="description">Description</Label>
            <textarea
              id="description"
              value={formData.description || ''}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full p-2 border border-border rounded"
              rows={4}
            />
          </div>
          <div>
            <Label htmlFor="base_price">Price</Label>
            <Input
              id="base_price"
              type="number"
              step="0.01"
              value={formData.base_price}
              onChange={(e) => setFormData({ ...formData, base_price: parseFloat(e.target.value) })}
              required
            />
          </div>
          <div>
            <Label htmlFor="stock_quantity">Stock Quantity</Label>
            <Input
              id="stock_quantity"
              type="number"
              value={formData.stock_quantity}
              onChange={(e) => setFormData({ ...formData, stock_quantity: parseInt(e.target.value) })}
            />
          </div>
          <div className="flex gap-2">
            <Button type="submit">Save</Button>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
