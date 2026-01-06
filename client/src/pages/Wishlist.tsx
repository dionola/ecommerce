import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Navbar } from '../components/Navbar';
import { Footer } from '../components/Footer';
import { getWishlist, removeFromWishlist, type Wishlist as WishlistType } from '../services/wishlists';
import { Heart, Trash2, ShoppingCart } from 'lucide-react';
import { Button } from '../components/ui/button';
import { useCart } from '../contexts/CartContext';
import { toast } from '../components/ui/toaster';

export default function Wishlist() {
  const [wishlist, setWishlist] = useState<WishlistType | null>(null);
  const [loading, setLoading] = useState(true);
  const { addItem } = useCart();

  useEffect(() => {
    loadWishlist();
  }, []);

  const loadWishlist = async () => {
    try {
      setLoading(true);
      const data = await getWishlist();
      setWishlist(data);
    } catch (error) {
      console.error('Failed to load wishlist:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRemove = async (productId: number) => {
    try {
      await removeFromWishlist(productId);
      await loadWishlist();
      toast({
        title: "Removed from wishlist",
        variant: "success",
      })
    } catch (error) {
      console.error('Failed to remove from wishlist:', error);
      toast({
        title: "Error",
        description: 'Failed to remove from wishlist',
        variant: "destructive",
      })
    }
  };

  const handleAddToCart = async (productId: number) => {
    try {
      await addItem(productId, 1);
      toast({
        title: "Added to cart",
        variant: "success",
      })
    } catch (error) {
      console.error('Failed to add to cart:', error);
      toast({
        title: "Error",
        description: 'Failed to add to cart',
        variant: "destructive",
      })
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1 pt-20">
        <div className="max-w-[1400px] mx-auto px-6 py-12">
          <div className="mb-8">
            <div className="flex items-center gap-3 mb-2">
              <Heart className="w-8 h-8" />
              <h1 className="text-4xl font-bold">Wishlist</h1>
            </div>
            <p className="text-muted-foreground">Your saved items</p>
          </div>

          {loading ? (
            <div className="text-center py-12">Loading...</div>
          ) : wishlist && wishlist.items.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {wishlist.items.map((item) => {
                const product = item.product;
                const mainImage = product.images.find(img => img.is_main) || product.images[0];
                return (
                  <div key={product.id} className="border border-border rounded-lg overflow-hidden group">
                    <Link to={`/product/${product.id}`}>
                      {mainImage && (
                        <img
                          src={mainImage.url}
                          alt={product.name}
                          className="w-full h-64 object-cover group-hover:scale-105 transition-transform"
                        />
                      )}
                    </Link>
                    <div className="p-4">
                      <Link to={`/product/${product.id}`}>
                        <h3 className="font-semibold mb-2 hover:text-primary transition-colors">
                          {product.name}
                        </h3>
                      </Link>
                      <p className="text-lg font-bold mb-4">${product.base_price.toFixed(2)}</p>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleAddToCart(product.id)}
                          className="flex-1"
                        >
                          <ShoppingCart className="w-4 h-4 mr-2" />
                          Add to Cart
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleRemove(product.id)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-12">
              <Heart className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
              <p className="text-muted-foreground">Your wishlist is empty</p>
            </div>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
}

