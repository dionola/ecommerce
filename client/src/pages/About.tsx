import { Info } from 'lucide-react';

export default function About() {
  return (
    <div className="max-w-[1400px] mx-auto px-6 py-12">
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <Info className="w-8 h-8" />
          <h1 className="text-4xl font-bold">About dionola</h1>
        </div>
        <p className="text-muted-foreground">Context for Stephen&apos;s test e-commerce storefront</p>
      </div>

      <div className="prose prose-sm max-w-none">
        <p className="text-lg mb-6">
          dionola is Stephen&apos;s test e-commerce site, built to exercise a full storefront flow from browsing through checkout.
        </p>
        <p className="mb-4">
          The products and imagery on this site are sourced from the H&amp;M dataset sample published by Luminati, which makes it a practical demo catalog for UI, cart, checkout, and admin workflows.
        </p>
        <p className="mb-4">
          It&apos;s a working sandbox rather than a finished production retail brand, so the focus here is on testing the experience, integrations, and layout polish.
        </p>
      </div>
    </div>
  );
}
