import { Navbar } from '../components/Navbar';
import { Footer } from '../components/Footer';
import { Info } from 'lucide-react';

export default function About() {
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1 pt-20">
        <div className="max-w-[1400px] mx-auto px-6 py-12">
          <div className="mb-8">
            <div className="flex items-center gap-3 mb-2">
              <Info className="w-8 h-8" />
              <h1 className="text-4xl font-bold">About Us</h1>
            </div>
            <p className="text-muted-foreground">Learn more about Objekt</p>
          </div>

          <div className="prose prose-sm max-w-none">
            <p className="text-lg mb-6">
              Welcome to Objekt, your premier destination for curated home and lifestyle products.
            </p>
            <p className="mb-4">
              We are dedicated to bringing you carefully selected items that combine quality, style, and functionality. 
              Our collection features products from trusted manufacturers around the world.
            </p>
            <p className="mb-4">
              At Objekt, we believe in providing an exceptional shopping experience with attention to detail, 
              from product selection to customer service.
            </p>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}


