import { Link } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { Package, ShoppingBag, Tag, Building2, Users, LayoutDashboard, Image } from 'lucide-react';
import { getProducts } from '../services/products';

export default function AdminDashboard() {
  const [lowStockCount, setLowStockCount] = useState<number | null>(null);

  useEffect(() => {
    const loadLowStock = async () => {
      try {
        const response = await getProducts({ limit: 1000 });
        setLowStockCount(response.products.filter((product) => product.stock_quantity > 0 && product.stock_quantity <= 5).length);
      } catch {
        setLowStockCount(null);
      }
    };

    loadLowStock();
  }, []);

  const adminSections = [
    {
      title: 'Products',
      description: lowStockCount === null
        ? 'Manage products, images, and statuses'
        : `Manage products, images, and statuses • ${lowStockCount} low-stock item${lowStockCount === 1 ? '' : 's'}`,
      icon: Package,
      link: '/admin/products',
      color: 'text-blue-500',
    },
    {
      title: 'Orders',
      description: 'View and manage customer orders',
      icon: ShoppingBag,
      link: '/admin/orders',
      color: 'text-green-500',
    },
    {
      title: 'Promos',
      description: 'Create and manage promo codes',
      icon: Tag,
      link: '/admin/promos',
      color: 'text-purple-500',
    },
    {
      title: 'Manufacturers',
      description: 'Manage product manufacturers',
      icon: Building2,
      link: '/admin/manufacturers',
      color: 'text-orange-500',
    },
    {
      title: 'Users',
      description: 'Create and manage admin users',
      icon: Users,
      link: '/admin/users',
      color: 'text-red-500',
    },
    {
      title: 'Banner',
      description: 'Customize homepage banner',
      icon: Image,
      link: '/admin/banner',
      color: 'text-cyan-500',
    },
  ];

  return (
    <div className="max-w-[1400px] mx-auto px-6 py-12">
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <LayoutDashboard className="w-8 h-8" />
          <h1 className="text-4xl font-bold">Admin Dashboard</h1>
        </div>
        <p className="text-muted-foreground">Manage Stephen&apos;s dionola test storefront</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {adminSections.map((section) => {
          const Icon = section.icon;
          return (
            <Link
              key={section.title}
              to={section.link}
              className="group p-6 border border-border rounded-lg hover:border-primary transition-colors bg-background"
            >
              <div className="flex items-start gap-4">
                <div className={`${section.color} group-hover:scale-110 transition-transform`}>
                  <Icon className="w-8 h-8" />
                </div>
                <div className="flex-1">
                  <h2 className="text-xl font-semibold mb-2 group-hover:text-primary transition-colors">
                    {section.title}
                  </h2>
                  <p className="text-sm text-muted-foreground">{section.description}</p>
                </div>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
