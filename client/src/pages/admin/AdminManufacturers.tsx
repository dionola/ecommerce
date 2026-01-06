import { useState, useEffect } from 'react';
import { Navbar } from '../../components/Navbar';
import { Footer } from '../../components/Footer';
import { getManufacturers, createManufacturer, updateManufacturer, deleteManufacturer } from '../../services/admin';
import type { Manufacturer, CreateManufacturerData } from '../../services/admin';
import { Building2, Plus, Edit, Trash2 } from 'lucide-react';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { toast } from '../../components/ui/toaster';

export default function AdminManufacturers() {
  const [manufacturers, setManufacturers] = useState<Manufacturer[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editingManufacturer, setEditingManufacturer] = useState<Manufacturer | null>(null);

  useEffect(() => {
    loadManufacturers();
  }, []);

  const loadManufacturers = async () => {
    try {
      setLoading(true);
      const data = await getManufacturers();
      setManufacturers(data);
    } catch (error) {
      console.error('Failed to load manufacturers:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (data: CreateManufacturerData) => {
    try {
      await createManufacturer(data);
      await loadManufacturers();
      setIsCreateModalOpen(false);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || 'Failed to create manufacturer',
        variant: "destructive",
      })
    }
  };

  const handleUpdate = async (id: number, data: CreateManufacturerData) => {
    try {
      await updateManufacturer(id, data);
      await loadManufacturers();
      setEditingManufacturer(null);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || 'Failed to update manufacturer',
        variant: "destructive",
      })
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this manufacturer? This will fail if products are using it.')) return;
    try {
      await deleteManufacturer(id);
      await loadManufacturers();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || 'Failed to delete manufacturer',
        variant: "destructive",
      })
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1 pt-20">
        <div className="max-w-[1400px] mx-auto px-6 py-12">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-4xl font-bold mb-2">Manufacturers</h1>
              <p className="text-muted-foreground">Manage product manufacturers</p>
            </div>
            <Button onClick={() => setIsCreateModalOpen(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Add Manufacturer
            </Button>
          </div>

          {loading ? (
            <div className="text-center py-12">Loading...</div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {manufacturers.map((manufacturer) => (
                <div key={manufacturer.id} className="border border-border rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-4">
                    <Building2 className="w-5 h-5" />
                    <h3 className="font-semibold">{manufacturer.name}</h3>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setEditingManufacturer(manufacturer)}
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDelete(manufacturer.id)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {isCreateModalOpen && (
            <ManufacturerModal
              onClose={() => setIsCreateModalOpen(false)}
              onSave={handleCreate}
            />
          )}

          {editingManufacturer && (
            <ManufacturerModal
              manufacturer={editingManufacturer}
              onClose={() => setEditingManufacturer(null)}
              onSave={(data) => handleUpdate(editingManufacturer.id, data)}
            />
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
}

function ManufacturerModal({
  manufacturer,
  onClose,
  onSave,
}: {
  manufacturer?: Manufacturer;
  onClose: () => void;
  onSave: (data: CreateManufacturerData) => void;
}) {
  const [name, setName] = useState(manufacturer?.name || '');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({ name });
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-background border border-border rounded-lg p-6 max-w-md w-full mx-4">
        <h2 className="text-2xl font-bold mb-4">{manufacturer ? 'Edit' : 'Create'} Manufacturer</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="name">Name</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
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

