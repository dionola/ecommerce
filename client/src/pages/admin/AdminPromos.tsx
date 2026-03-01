import { useState, useEffect } from 'react';
import { getPromos, createPromo, updatePromo, deletePromo } from '../../services/admin';
import type { Promo, CreatePromoData } from '../../services/admin';
import { Tag, Plus, Edit, Trash2 } from 'lucide-react';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { toast } from '../../components/ui/toaster';

export default function AdminPromos() {
  const [promos, setPromos] = useState<Promo[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editingPromo, setEditingPromo] = useState<Promo | null>(null);

  useEffect(() => {
    loadPromos();
  }, []);

  const loadPromos = async () => {
    try {
      setLoading(true);
      const data = await getPromos();
      setPromos(data);
    } catch (error) {
      console.error('Failed to load promos:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (data: CreatePromoData) => {
    try {
      await createPromo(data);
      await loadPromos();
      setIsCreateModalOpen(false);
      toast({
        title: "Promo created",
        description: "Promo has been created successfully",
        variant: "success",
      })
    } catch (error) {
      console.error('Failed to create promo:', error);
      toast({
        title: "Error",
        description: 'Failed to create promo',
        variant: "destructive",
      })
    }
  };

  const handleUpdate = async (id: number, data: Partial<CreatePromoData>) => {
    try {
      await updatePromo(id, data);
      await loadPromos();
      setEditingPromo(null);
      toast({
        title: "Promo updated",
        description: "Promo has been updated successfully",
        variant: "success",
      })
    } catch (error) {
      console.error('Failed to update promo:', error);
      toast({
        title: "Error",
        description: 'Failed to update promo',
        variant: "destructive",
      })
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this promo?')) return;
    try {
      await deletePromo(id);
      await loadPromos();
      toast({
        title: "Promo deleted",
        description: "Promo has been deleted successfully",
        variant: "success",
      })
    } catch (error) {
      console.error('Failed to delete promo:', error);
      toast({
        title: "Error",
        description: 'Failed to delete promo',
        variant: "destructive",
      })
    }
  };

  return (
    <div className="max-w-[1400px] mx-auto px-6 py-12">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-4xl font-bold mb-2">Promos</h1>
          <p className="text-muted-foreground">Manage promo codes</p>
        </div>
        <Button onClick={() => setIsCreateModalOpen(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Add Promo
        </Button>
      </div>

      {loading ? (
        <div className="text-center py-12">Loading...</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {promos.map((promo) => (
            <div key={promo.id} className="border border-border rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <Tag className="w-5 h-5" />
                <h3 className="font-semibold">{promo.code}</h3>
              </div>
              <p className="text-sm text-muted-foreground mb-2">
                {promo.discount_type === 'percentage' ? `${promo.discount_value}%` : `$${promo.discount_value}`} off
              </p>
              {promo.active_until && (
                <p className="text-xs text-muted-foreground mb-4">
                  Expires: {new Date(promo.active_until).toLocaleDateString()}
                </p>
              )}
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setEditingPromo(promo)}
                >
                  <Edit className="w-4 h-4" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleDelete(promo.id)}
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      {isCreateModalOpen && (
        <PromoModal
          onClose={() => setIsCreateModalOpen(false)}
          onSave={handleCreate}
        />
      )}

      {editingPromo && (
        <PromoModal
          promo={editingPromo}
          onClose={() => setEditingPromo(null)}
          onSave={(data) => handleUpdate(editingPromo.id, data)}
        />
      )}
    </div>
  );
}

function PromoModal({
  promo,
  onClose,
  onSave,
}: {
  promo?: Promo;
  onClose: () => void;
  onSave: (data: CreatePromoData) => void;
}) {
  const [formData, setFormData] = useState<CreatePromoData>({
    code: promo?.code || '',
    discount_type: promo?.discount_type || 'percentage',
    discount_value: promo?.discount_value || 0,
    active_until: promo?.active_until || null,
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-background border border-border rounded-lg p-6 max-w-md w-full mx-4">
        <h2 className="text-2xl font-bold mb-4">{promo ? 'Edit' : 'Create'} Promo</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="code">Code</Label>
            <Input
              id="code"
              value={formData.code}
              onChange={(e) => setFormData({ ...formData, code: e.target.value })}
              required
            />
          </div>
          <div>
            <Label htmlFor="discount_type">Discount Type</Label>
            <select
              id="discount_type"
              value={formData.discount_type}
              onChange={(e) => setFormData({ ...formData, discount_type: e.target.value as 'percentage' | 'fixed' })}
              className="w-full p-2 border border-border rounded"
            >
              <option value="percentage">Percentage</option>
              <option value="fixed">Fixed Amount</option>
            </select>
          </div>
          <div>
            <Label htmlFor="discount_value">Discount Value</Label>
            <Input
              id="discount_value"
              type="number"
              step="0.01"
              value={formData.discount_value}
              onChange={(e) => setFormData({ ...formData, discount_value: parseFloat(e.target.value) })}
              required
            />
          </div>
          <div>
            <Label htmlFor="active_until">Active Until (optional)</Label>
            <Input
              id="active_until"
              type="datetime-local"
              value={formData.active_until ? new Date(formData.active_until).toISOString().slice(0, 16) : ''}
              onChange={(e) => setFormData({ ...formData, active_until: e.target.value ? new Date(e.target.value).toISOString() : null })}
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

