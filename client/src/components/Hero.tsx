import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getBanner } from '../services/banner';
import type { Banner } from '../services/banner';

export function Hero() {
  const [banner, setBanner] = useState<Banner | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchBanner = async () => {
      try {
        const data = await getBanner();
        setBanner(data);
      } catch (error) {
        console.error('Failed to load banner:', error);
        // Use default banner on error
        setBanner({
          id: 0,
          title: "The Art of Living Well",
          description: "A curated selection of home essentials designed for longevity, utility, and aesthetic permanence.",
          image_url: "https://image.hm.com/assets/hm/1a/3c/1a3c77208f05c2cf02bbdd5d0d71016abcd23548.jpg?imwidth=2160",
          category: null,
          button_text: "View Collection — 2026",
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        });
      } finally {
        setLoading(false);
      }
    };
    fetchBanner();
  }, []);

  const handleButtonClick = () => {
    if (banner?.category) {
      navigate(`/?category=${encodeURIComponent(banner.category)}`);
      // Scroll to product grid after navigation
      setTimeout(() => {
        const productGrid = document.querySelector('[data-product-grid]') || document.querySelector('section.border-t.border-border');
        if (productGrid) {
          productGrid.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      }, 100);
    } else {
      navigate('/');
      // Scroll to product grid
      setTimeout(() => {
        const productGrid = document.querySelector('[data-product-grid]') || document.querySelector('section.border-t.border-border');
        if (productGrid) {
          productGrid.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      }, 100);
    }
  };

  if (loading || !banner) {
    return (
      <section className="pt-32 pb-20 px-6 max-w-[1400px] mx-auto">
        <div className="text-center py-12">Loading...</div>
      </section>
    );
  }

  return (
    <section className="pt-32 pb-20 px-6 max-w-[1400px] mx-auto">
      <div className="grid grid-cols-1 md:grid-cols-12 gap-12 items-end">
        <div className="md:col-span-8">
          <h1 className="text-6xl md:text-8xl lg:text-9xl font-bold tracking-tighter leading-[0.85] uppercase">
            {banner.title.split(/<br\s*\/?>/i).map((line, i, arr) => (
              <span key={i}>
                {line}
                {i < arr.length - 1 && <br />}
              </span>
            ))}
          </h1>
        </div>
        <div className="md:col-span-4 pb-4">
          <p className="text-lg text-muted-foreground max-w-xs uppercase tracking-tight leading-snug">
            {banner.description}
          </p>
        </div>
      </div>
      <div className="mt-12 h-[60vh] w-full bg-secondary overflow-hidden relative group">
        <img
          src={banner.image_url}
          alt="Featured Collection"
          className="w-full h-full object-cover grayscale hover:grayscale-0 transition-all duration-700"
        />
        <div className="absolute inset-0 bg-black/10 group-hover:bg-transparent transition-colors" />
        {banner.button_text && (
          <div className="absolute bottom-8 left-8">
            <button
              onClick={handleButtonClick}
              className="bg-background text-foreground px-8 py-4 text-sm font-bold uppercase tracking-widest hover:invert transition-all duration-300"
            >
              {banner.button_text}
            </button>
          </div>
        )}
      </div>
    </section>
  );
}

