import { Truck } from 'lucide-react';

export default function Shipping() {
  return (
    <div className="max-w-[1400px] mx-auto px-6 py-12">
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <Truck className="w-8 h-8" />
          <h1 className="text-4xl font-bold">Shipping</h1>
        </div>
        <p className="text-muted-foreground">Demo notes for checkout and fulfillment behavior</p>
      </div>

      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-semibold mb-3">Shipping Options</h2>
          <p className="text-muted-foreground mb-4">
            dionola is a test storefront, so shipping rates and options are meant to exercise the checkout flow rather than represent a live fulfillment operation.
          </p>
        </div>

        <div>
          <h2 className="text-2xl font-semibold mb-3">Processing Time</h2>
          <p className="text-muted-foreground mb-4">
            Order creation, payment, and status updates are useful for testing the purchase lifecycle, but shipment timelines here should be treated as sample data.
          </p>
        </div>

        <div>
          <h2 className="text-2xl font-semibold mb-3">Tracking</h2>
          <p className="text-muted-foreground mb-4">
            If you extend this project with tracking, carrier updates, or notification emails, this page is where the final policy copy would live.
          </p>
        </div>
      </div>
    </div>
  );
}






