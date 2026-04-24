import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getOrders } from '../services/orders';
import type { Order } from '../services/orders';
import { ShoppingBag } from 'lucide-react';
import { Button } from '../components/ui/button';
import { formatCurrency } from '../lib/currency';

function OrderHistorySkeleton() {
  return (
    <div className="space-y-4 animate-pulse">
      {Array.from({ length: 4 }).map((_, index) => (
        <div key={index} className="border border-border rounded-lg p-4">
          <div className="flex items-start justify-between gap-4">
            <div className="h-16 w-16 bg-secondary rounded" />
            <div className="flex-1 space-y-3">
              <div className="flex items-center gap-4">
                <div className="h-5 w-32 bg-secondary rounded-sm" />
                <div className="h-5 w-20 bg-secondary rounded-sm" />
              </div>
              <div className="h-4 w-56 bg-secondary rounded-sm" />
              <div className="h-4 w-24 bg-secondary rounded-sm" />
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}

export default function OrderHistory() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

  useEffect(() => {
    loadOrders();
  }, []);

  const loadOrders = async () => {
    try {
      setLoading(true);
      const data = await getOrders({ limit: 100 });
      setOrders(data);
    } catch (error) {
      console.error('Failed to load orders:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-[1400px] mx-auto px-6 py-12">
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <ShoppingBag className="w-8 h-8" />
          <h1 className="text-4xl font-bold">Order History</h1>
        </div>
        <p className="text-muted-foreground">Your past orders</p>
      </div>

      {loading ? (
        <OrderHistorySkeleton />
      ) : orders.length > 0 ? (
        <div className="space-y-4">
          {orders.map((order) => {
            // Get thumbnails for items (main image or first image)
            const thumbnails = order.items
              .slice(0, 4) // Show max 4 thumbnails
              .map(item => {
                const mainImage = item.product.images?.find(img => img.is_main);
                return mainImage?.url || item.product.images?.[0]?.url || '/placeholder.svg';
              });

            return (
              <div
                key={order.id}
                className="border border-border rounded-lg p-4 cursor-pointer hover:bg-secondary/50 transition-colors"
                onClick={() => setSelectedOrder(order)}
              >
                <div className="flex items-start justify-between gap-4">
                  {/* Thumbnails - stacked */}
                  {thumbnails.length > 0 && (
                    <div className="flex-shrink-0">
                      <div className="relative" style={{ width: '60px', height: '60px' }}>
                        {thumbnails.map((thumbnail, index) => (
                          <div
                            key={index}
                            className="absolute rounded border-2 border-background overflow-hidden bg-secondary"
                            style={{
                              width: '50px',
                              height: '50px',
                              left: `${index * 8}px`,
                              top: `${index * 8}px`,
                              zIndex: thumbnails.length - index,
                            }}
                          >
                            <img
                              src={thumbnail}
                              alt={`Item ${index + 1}`}
                              className="w-full h-full object-cover"
                            />
                          </div>
                        ))}
                        {order.items.length > 4 && (
                          <div
                            className="absolute rounded border-2 border-background overflow-hidden bg-secondary flex items-center justify-center text-xs font-bold"
                            style={{
                              width: '50px',
                              height: '50px',
                              left: `${Math.min(4, thumbnails.length) * 8}px`,
                              top: `${Math.min(4, thumbnails.length) * 8}px`,
                              zIndex: 0,
                            }}
                          >
                            +{order.items.length - 4}
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                  <div className="flex-1">
                    <div className="flex items-center gap-4 mb-2">
                      <span className="font-semibold">Order #{order.id}</span>
                      <span className={`px-2 py-1 rounded text-xs ${order.status === 'completed' ? 'bg-green-500/20 text-green-500' :
                          order.status === 'pending' ? 'bg-yellow-500/20 text-yellow-500' :
                            'bg-gray-500/20 text-gray-500'
                        }`}>
                        {order.status}
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground mb-2">
                      {formatCurrency(order.total_amount)} • {new Date(order.created_at).toLocaleDateString()}
                    </p>
                    <p className="text-sm">{order.items.length} item(s)</p>
                    {order.promo && (
                      <p className="text-xs text-muted-foreground mt-1 uppercase tracking-widest">
                        Promo {order.promo.code}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="text-center py-12">
          <ShoppingBag className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
          <p className="text-muted-foreground">You haven't placed any orders yet</p>
        </div>
      )}

      {selectedOrder && (
        <OrderDetailModal
          order={selectedOrder}
          onClose={() => setSelectedOrder(null)}
        />
      )}
    </div>
  );
}

function OrderDetailModal({ order, onClose }: { order: Order; onClose: () => void }) {
  const navigate = useNavigate();

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-background border border-border rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <h2 className="text-2xl font-bold mb-4">Order #{order.id}</h2>
        <div className="space-y-4">
          <div>
            <p className="text-sm text-muted-foreground">Status</p>
            <p className="font-semibold">{order.status}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Total Amount</p>
            <p className="font-semibold">{formatCurrency(order.total_amount)}</p>
          </div>
          {order.promo && (
            <div>
              <p className="text-sm text-muted-foreground">Promo</p>
              <p className="font-semibold">
                {order.promo.code} • {order.promo.discount_type === 'percentage'
                  ? `${order.promo.discount_value}% off`
                  : `${formatCurrency(order.promo.discount_value)} off`}
              </p>
            </div>
          )}
          <div>
            <p className="text-sm text-muted-foreground">Date</p>
            <p>{new Date(order.created_at).toLocaleString()}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground mb-2">Items</p>
            <div className="space-y-2">
              {order.items.map((item) => {
                const mainImage = item.product.images?.find(img => img.is_main);
                const imageUrl = mainImage?.url || item.product.images?.[0]?.url || '/placeholder.svg';
                const originalPrice = item.product.base_price;
                const actualPrice = item.price_at_purchase;
                const hasDiscount = originalPrice > actualPrice;

                return (
                  <div
                    key={item.id}
                    className="flex items-center gap-4 p-2 border border-border rounded cursor-pointer hover:bg-secondary/50 transition-colors"
                    onClick={() => {
                      navigate(`/product/${item.product.id}`);
                      onClose();
                    }}
                  >
                    <div className="w-16 h-16 flex-shrink-0 bg-secondary overflow-hidden rounded">
                      <img
                        src={imageUrl}
                        alt={item.product.name}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="flex-1">
                      <p className="font-semibold">{item.product.name}</p>
                      <button
                        type="button"
                        onClick={(event) => {
                          event.stopPropagation()
                          navigate(`/product/${item.product.id}`)
                          onClose()
                        }}
                        className="text-xs uppercase tracking-widest text-muted-foreground hover:text-foreground hover:underline"
                      >
                        Ref. {item.product.id}
                      </button>
                      <p className="text-sm text-muted-foreground">
                        Quantity: {item.quantity}
                      </p>
                      <div className="flex items-center gap-2 mt-1">
                        {hasDiscount ? (
                          <>
                            <p className="text-sm text-muted-foreground line-through">
                              {formatCurrency(originalPrice)}
                            </p>
                            <p className="text-sm font-semibold">
                              {formatCurrency(actualPrice)} each
                            </p>
                          </>
                        ) : (
                          <p className="text-sm font-semibold">
                            {formatCurrency(actualPrice)} each
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="text-right">
                      {hasDiscount && (
                        <p className="text-xs text-muted-foreground line-through mb-1">
                          {formatCurrency(item.quantity * originalPrice)}
                        </p>
                      )}
                      <p className="font-semibold">{formatCurrency(item.quantity * actualPrice)}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
          {order.shipping_address && (
            <div>
              <p className="text-sm text-muted-foreground mb-2">Shipping Address</p>
              <div className="bg-secondary p-3 rounded text-sm">
                {typeof order.shipping_address === 'object' && order.shipping_address !== null && (
                  <>
                    {'street' in order.shipping_address && typeof order.shipping_address.street === 'string' && (
                      <p>{order.shipping_address.street}</p>
                    )}
                    {'city' in order.shipping_address && typeof order.shipping_address.city === 'string' && (
                      <p>
                        {order.shipping_address.city}
                        {'state' in order.shipping_address && typeof order.shipping_address.state === 'string' && `, ${order.shipping_address.state}`}
                        {'zip' in order.shipping_address && typeof order.shipping_address.zip === 'string' && ` ${order.shipping_address.zip}`}
                      </p>
                    )}
                    {'country' in order.shipping_address && typeof order.shipping_address.country === 'string' && (
                      <p>{order.shipping_address.country}</p>
                    )}
                  </>
                )}
              </div>
            </div>
          )}
          <Button onClick={onClose}>Close</Button>
        </div>
      </div>
    </div>
  );
}
