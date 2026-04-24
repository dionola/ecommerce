import { RotateCcw } from 'lucide-react';

export default function Returns() {
  return (
    <div className="max-w-[1400px] mx-auto px-6 py-12">
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <RotateCcw className="w-8 h-8" />
          <h1 className="text-4xl font-bold">Returns</h1>
        </div>
        <p className="text-muted-foreground">Demo guidance for testing post-purchase flows</p>
      </div>

      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-semibold mb-3">Return Policy</h2>
          <p className="text-muted-foreground mb-4">
            This storefront is a working demo, so return windows and eligibility rules should be treated as placeholder policy content.
          </p>
        </div>

        <div>
          <h2 className="text-2xl font-semibold mb-3">How to Return</h2>
          <p className="text-muted-foreground mb-4">
            If you want to model a true return flow later, this is the right place to explain approval, labeling, and refund steps for customers.
          </p>
        </div>

        <div>
          <h2 className="text-2xl font-semibold mb-3">Refunds</h2>
          <p className="text-muted-foreground mb-4">
            Refund timelines in this environment are illustrative only and mainly exist to support the layout and navigation structure.
          </p>
        </div>
      </div>
    </div>
  );
}






