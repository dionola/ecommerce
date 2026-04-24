import { Info } from 'lucide-react';

export default function About() {
  return (
    <div className="max-w-[1400px] mx-auto px-6 py-12">
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <Info className="w-8 h-8" />
          <h1 className="text-4xl font-bold">About dionola</h1>
        </div>
        <p className="text-muted-foreground">Application definition</p>
      </div>

      <div className="prose prose-sm max-w-none">
        <p className="text-lg mb-6">
          dionola is a full-stack e-commerce application for browsing products, managing carts and wishlists, placing orders, and running lightweight store administration.
        </p>
        <p className="mb-4">
          It includes a customer storefront, authentication, checkout integration, order history, and an admin area for products, users, promos, manufacturers, banners, and stock visibility.
        </p>
        <p className="mb-4">
          The catalog content is based on the H&amp;M dataset sample, making the project useful as both a realistic demo store and a development sandbox for commerce workflows.
        </p>
      </div>
    </div>
  );
}
