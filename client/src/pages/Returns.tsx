import { RotateCcw } from 'lucide-react';

export default function Returns() {
  return (
    <div className="max-w-[1400px] mx-auto px-6 py-12">
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <RotateCcw className="w-8 h-8" />
          <h1 className="text-4xl font-bold">Returns & Exchanges</h1>
        </div>
        <p className="text-muted-foreground">Our return and exchange policy</p>
      </div>

      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-semibold mb-3">Return Policy</h2>
          <p className="text-muted-foreground mb-4">
            We accept returns within 30 days of purchase. Items must be in original condition with tags attached.
          </p>
        </div>

        <div>
          <h2 className="text-2xl font-semibold mb-3">How to Return</h2>
          <p className="text-muted-foreground mb-4">
            To initiate a return, please contact our customer service team. We'll provide you with a return
            authorization and shipping instructions.
          </p>
        </div>

        <div>
          <h2 className="text-2xl font-semibold mb-3">Refunds</h2>
          <p className="text-muted-foreground mb-4">
            Refunds will be processed to your original payment method within 5-10 business days after we
            receive and inspect the returned item.
          </p>
        </div>
      </div>
    </div>
  );
}







