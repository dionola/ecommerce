import { Navbar } from '../components/Navbar';
import { Footer } from '../components/Footer';
import { Truck } from 'lucide-react';

export default function Shipping() {
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1 pt-20">
        <div className="max-w-[1400px] mx-auto px-6 py-12">
          <div className="mb-8">
            <div className="flex items-center gap-3 mb-2">
              <Truck className="w-8 h-8" />
              <h1 className="text-4xl font-bold">Shipping Information</h1>
            </div>
            <p className="text-muted-foreground">Delivery options and policies</p>
          </div>

          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-semibold mb-3">Shipping Options</h2>
              <p className="text-muted-foreground mb-4">
                We offer various shipping options to meet your needs. Shipping costs are calculated at checkout 
                based on your location and selected shipping method.
              </p>
            </div>

            <div>
              <h2 className="text-2xl font-semibold mb-3">Processing Time</h2>
              <p className="text-muted-foreground mb-4">
                Orders are typically processed within 1-2 business days. You will receive a confirmation email 
                once your order has been shipped.
              </p>
            </div>

            <div>
              <h2 className="text-2xl font-semibold mb-3">Tracking</h2>
              <p className="text-muted-foreground mb-4">
                Once your order ships, you'll receive a tracking number via email to monitor your package's journey.
              </p>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}







