import { useState, useEffect } from 'react';
import { Navbar } from '../../components/Navbar';
import { Footer } from '../../components/Footer';
import { getBanner, updateBanner } from '../../services/banner';
import type { Banner, UpdateBannerData } from '../../services/banner';
import { Image, Save } from 'lucide-react';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { toast } from '../../components/ui/toaster';
import { getCategories } from '../../services/categories';

export default function AdminBanner() {
  const [banner, setBanner] = useState<Banner | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [categories, setCategories] = useState<string[]>([]);
  const [formData, setFormData] = useState<UpdateBannerData>({
    title: '',
    description: '',
    image_url: '',
    category: null,
    button_text: '',
  });

  useEffect(() => {
    const loadData = async () => {
      try {
        const [bannerData, categoriesData] = await Promise.all([
          getBanner(),
          getCategories().catch(() => []),
        ]);
        setBanner(bannerData);
        setCategories(categoriesData);
        setFormData({
          title: bannerData.title,
          description: bannerData.description,
          image_url: bannerData.image_url,
          category: bannerData.category,
          button_text: bannerData.button_text || '',
        });
      } catch (error) {
        console.error('Failed to load banner:', error);
        toast({
          title: "Error",
          description: "Failed to load banner configuration",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      const updated = await updateBanner(formData);
      setBanner(updated);
      toast({
        title: "Success",
        description: "Banner updated successfully",
        variant: "success",
      });
    } catch (error: any) {
      console.error('Failed to update banner:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to update banner",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <main className="flex-1 pt-20">
          <div className="max-w-[1400px] mx-auto px-6 py-12">
            <div className="text-center py-12">Loading...</div>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1 pt-20">
        <div className="max-w-[1400px] mx-auto px-6 py-12">
          <div className="mb-8">
            <div className="flex items-center gap-3 mb-2">
              <Image className="w-8 h-8" />
              <h1 className="text-4xl font-bold">Banner Configuration</h1>
            </div>
            <p className="text-muted-foreground">Customize the homepage banner</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div className="space-y-6">
                <div>
                  <Label htmlFor="title">Title</Label>
                  <Input
                    id="title"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    required
                    className="rounded-none border-border h-12"
                    placeholder="The Art of Living Well"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Use <br /> for line breaks (e.g., "The Art of<br />Living Well")
                  </p>
                </div>

                <div>
                  <Label htmlFor="description">Description</Label>
                  <textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    required
                    rows={4}
                    className="w-full p-3 border border-border rounded-none resize-none"
                    placeholder="A curated selection of home essentials..."
                  />
                </div>

                <div>
                  <Label htmlFor="image_url">Image URL</Label>
                  <Input
                    id="image_url"
                    type="url"
                    value={formData.image_url}
                    onChange={(e) => setFormData({ ...formData, image_url: e.target.value })}
                    required
                    className="rounded-none border-border h-12"
                    placeholder="https://example.com/image.jpg"
                  />
                </div>

                <div>
                  <Label htmlFor="category">Category (Optional)</Label>
                  <select
                    id="category"
                    value={formData.category || ''}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value || null })}
                    className="w-full p-3 border border-border rounded-none bg-background"
                  >
                    <option value="">None</option>
                    {categories.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                  <p className="text-xs text-muted-foreground mt-1">
                    If set, the button will link to this category
                  </p>
                </div>

                <div>
                  <Label htmlFor="button_text">Button Text (Optional)</Label>
                  <Input
                    id="button_text"
                    value={formData.button_text || ''}
                    onChange={(e) => setFormData({ ...formData, button_text: e.target.value || null })}
                    className="rounded-none border-border h-12"
                    placeholder="View Collection — 2026"
                  />
                </div>
              </div>

              <div>
                <Label>Preview</Label>
                <div className="border border-border rounded-lg p-6 bg-secondary/50">
                  <div className="space-y-4">
                    <div>
                      <h2 className="text-2xl font-bold uppercase mb-2">
                        {formData.title.split('<br />').map((line, i) => (
                          <span key={i}>
                            {line}
                            {i < formData.title.split('<br />').length - 1 && <br />}
                          </span>
                        ))}
                      </h2>
                      <p className="text-sm text-muted-foreground">{formData.description}</p>
                    </div>
                    <div className="aspect-video bg-secondary overflow-hidden rounded">
                      {formData.image_url ? (
                        <img
                          src={formData.image_url}
                          alt="Banner preview"
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            (e.target as HTMLImageElement).src = '/placeholder.svg';
                          }}
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                          No image
                        </div>
                      )}
                    </div>
                    {formData.button_text && (
                      <div>
                        <button className="bg-background text-foreground px-6 py-3 text-sm font-bold uppercase tracking-widest">
                          {formData.button_text}
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            <div className="flex justify-end">
              <Button type="submit" disabled={saving} className="rounded-none h-12">
                <Save className="w-4 h-4 mr-2" />
                {saving ? 'Saving...' : 'Save Changes'}
              </Button>
            </div>
          </form>
        </div>
      </main>
      <Footer />
    </div>
  );
}

