import { useState, useEffect } from 'react';
import { getOrders, updateOrder, deleteOrder } from '../../services/orders';
import { toast } from '../../components/ui/toaster';
import type { Order } from '../../services/orders';
import { Eye, Edit, Trash2 } from 'lucide-react';
import { Button } from '../../components/ui/button';
import { useAuth } from '../../contexts/AuthContext';

export default function AdminOrders() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const { user } = useAuth();

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

  const handleUpdateStatus = async (id: number, status: string) => {
    try {
      await updateOrder(id, { status });
      await loadOrders();
    } catch (error) {
      console.error('Failed to update order:', error);
      toast({
        title: "Error",
        description: 'Failed to update order',
        variant: "destructive",
      })
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this order? Only pending orders can be deleted.')) return;
    try {
      await deleteOrder(id);
      await loadOrders();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || 'Failed to delete order',
        variant: "destructive",
      })
    }
  };

  const isAdmin = user?.groups?.includes('admin') || user?.groups?.includes('superadmin');

  return (
    <div className="max-w-[1400px] mx-auto px-6 py-12">
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-2">Orders</h1>
        <p className="text-muted-foreground">Manage customer orders</p>
      </div>

      {loading ? (
        <div className="text-center py-12">Loading...</div>
      ) : (
        <div className="space-y-4">
          {orders.map((order) => (
            <div key={order.id} className="border border-border rounded-lg p-4">
              <div className="flex items-start justify-between">
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
                    ${order.total_amount.toFixed(2)} • {new Date(order.created_at).toLocaleDateString()}
                  </p>
                  <p className="text-sm">{order.items.length} item(s)</p>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setSelectedOrder(order)}
                  >
                    <Eye className="w-4 h-4" />
                  </Button>
                  {isAdmin && (
                    <>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          const newStatus = prompt('Enter new status:', order.status);
                          if (newStatus) handleUpdateStatus(order.id, newStatus);
                        }}
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      {order.status === 'pending' && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDelete(order.id)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      )}
                    </>
                  )}
                </div>
              </div>
            </div>
          ))}
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
            <p className="font-semibold">${order.total_amount.toFixed(2)}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Date</p>
            <p>{new Date(order.created_at).toLocaleString()}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground mb-2">Items</p>
            <div className="space-y-2">
              {order.items.map((item) => (
                <div key={item.id} className="flex items-center gap-4 p-2 border border-border rounded">
                  <div className="flex-1">
                    <p className="font-semibold">{item.product.name}</p>
                    <p className="text-sm text-muted-foreground">
                      Quantity: {item.quantity} × ${item.price_at_purchase.toFixed(2)}
                    </p>
                  </div>
                  <p className="font-semibold">${(item.quantity * item.price_at_purchase).toFixed(2)}</p>
                </div>
              ))}
            </div>
          </div>
          {order.shipping_address && (
            <div>
              <p className="text-sm text-muted-foreground mb-2">Shipping Address</p>
              <pre className="text-sm bg-secondary p-2 rounded">
                {JSON.stringify(order.shipping_address, null, 2)}
              </pre>
            </div>
          )}
          <Button onClick={onClose}>Close</Button>
        </div>
      </div>
    </div>
  );
}

