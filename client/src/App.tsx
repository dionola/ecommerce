import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { AuthProvider } from './contexts/AuthContext'
import { CartProvider } from './contexts/CartContext'
import { ScrollToTop } from './components/ScrollToTop'
import { Toaster } from './components/ui/toaster'
import Home from './pages/Home'
import ProductDetail from './pages/ProductDetail'
import OrderHistory from './pages/OrderHistory'
import Wishlist from './pages/Wishlist'
import Settings from './pages/Settings'
import Checkout from './pages/Checkout'
import About from './pages/About'
import Shipping from './pages/Shipping'
import Returns from './pages/Returns'
import Contact from './pages/Contact'
import AdminDashboard from './pages/AdminDashboard'
import AdminProducts from './pages/admin/AdminProducts'
import AdminOrders from './pages/admin/AdminOrders'
import AdminPromos from './pages/admin/AdminPromos'
import AdminManufacturers from './pages/admin/AdminManufacturers'
import AdminUsers from './pages/admin/AdminUsers'
import AdminBanner from './pages/admin/AdminBanner'

function App() {
  return (
    <AuthProvider>
      <CartProvider>
        <BrowserRouter>
          <ScrollToTop />
          <Toaster />
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/product/:id" element={<ProductDetail />} />
            <Route path="/orders" element={<OrderHistory />} />
            <Route path="/wishlist" element={<Wishlist />} />
            <Route path="/settings" element={<Settings />} />
            <Route path="/checkout" element={<Checkout />} />
            <Route path="/about" element={<About />} />
            <Route path="/shipping" element={<Shipping />} />
            <Route path="/returns" element={<Returns />} />
            <Route path="/contact" element={<Contact />} />
            <Route path="/admin" element={<AdminDashboard />} />
            <Route path="/admin/products" element={<AdminProducts />} />
            <Route path="/admin/orders" element={<AdminOrders />} />
            <Route path="/admin/promos" element={<AdminPromos />} />
            <Route path="/admin/manufacturers" element={<AdminManufacturers />} />
            <Route path="/admin/users" element={<AdminUsers />} />
            <Route path="/admin/banner" element={<AdminBanner />} />
          </Routes>
        </BrowserRouter>
      </CartProvider>
    </AuthProvider>
  )
}

export default App
