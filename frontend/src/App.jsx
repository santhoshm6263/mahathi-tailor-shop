import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useNavigate, useLocation } from 'react-router-dom';
import { ShoppingBag, User, LogOut, Menu, X, Scissors, Phone, MapPin, LayoutDashboard, Clock } from 'lucide-react';
import { AppProviders, useAuth, useCart } from './context/AppContext';
import Home from './pages/Home';
import Catalog from './pages/Catalog';
import ServiceDetail from './pages/ServiceDetail';
import Checkout from './pages/Checkout';
import Dashboard from './pages/Dashboard';
import Admin from './pages/Admin';
import LoginModal from './components/LoginModal';

import './App.css';

function Navigation() {
  const { user, logout, isAdmin } = useAuth();
  const { cart } = useCart();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [cartOpen, setCartOpen] = useState(false);
  const [loginModalOpen, setLoginModalOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  const totalCartItems = cart.reduce((acc, item) => acc + item.quantity, 0);

  const handleDashboardClick = () => {
    if (!user) {
      setLoginModalOpen(true);
    } else {
      navigate('/dashboard');
    }
  };

  const handleCheckoutClick = () => {
    setCartOpen(false);
    if (!user) {
      setLoginModalOpen(true);
    } else {
      navigate('/checkout');
    }
  };

  return (
    <>
      <nav className="navbar glass">
        <div className="container nav-container">
          <Link to="/" className="nav-logo" onClick={() => setMobileMenuOpen(false)}>
            <Scissors className="logo-icon" />
            <span className="logo-text">MAHATHI <span>Boutique</span></span>
          </Link>

          {/* Desktop Navigation */}
          <div className="nav-links-desktop">
            <Link to="/" className={`nav-item ${location.pathname === '/' ? 'active' : ''}`}>Home</Link>
            <Link to="/catalog" className={`nav-item ${location.pathname === '/catalog' ? 'active' : ''}`}>Catalog & Bookings</Link>
            {user && !isAdmin && (
              <button onClick={handleDashboardClick} className={`nav-item-btn ${location.pathname === '/dashboard' ? 'active' : ''}`}>My Dashboard</button>
            )}

          </div>

          <div className="nav-actions">
            <button className="cart-trigger flex-center" onClick={() => setCartOpen(true)}>
              <ShoppingBag />
              {totalCartItems > 0 && <span className="cart-badge flex-center">{totalCartItems}</span>}
            </button>

            {user ? (
              <div className="user-profile-menu">
                <span className="welcome-text">Hi, {user.name.split(' ')[0]}</span>
                <button className="btn-logout flex-center" onClick={logout} title="Sign Out">
                  <LogOut size={18} />
                </button>
              </div>
            ) : (
              <button className="btn btn-primary" onClick={() => setLoginModalOpen(true)}>Sign In</button>
            )}

            <button className="mobile-menu-trigger" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
              {mobileMenuOpen ? <X /> : <Menu />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation Dropdown */}
        {mobileMenuOpen && (
          <div className="mobile-menu glass">
            <Link to="/" className="mobile-nav-item" onClick={() => setMobileMenuOpen(false)}>Home</Link>
            <Link to="/catalog" className="mobile-nav-item" onClick={() => setMobileMenuOpen(false)}>Catalog & Bookings</Link>
            {user && !isAdmin && (
              <Link to="/dashboard" className="mobile-nav-item" onClick={() => setMobileMenuOpen(false)}>My Dashboard</Link>
            )}

            {!user && (
              <button className="mobile-nav-item-btn" onClick={() => { setMobileMenuOpen(false); setLoginModalOpen(true); }}>Sign In</button>
            )}
          </div>
        )}
      </nav>

      {/* Cart Drawer */}
      <CartDrawer isOpen={cartOpen} onClose={() => setCartOpen(false)} onCheckout={handleCheckoutClick} />

      {/* Authentication Modal */}
      {loginModalOpen && <LoginModal onClose={() => setLoginModalOpen(false)} />}
    </>
  );
}

function CartDrawer({ isOpen, onClose, onCheckout }) {
  const { cart, updateQuantity, removeFromCart, getSubtotal, getTotal, getDiscountAmount, applyDiscount, discountCode } = useCart();
  const [couponInput, setCouponInput] = useState('');
  const [couponError, setCouponError] = useState('');
  const [couponSuccess, setCouponSuccess] = useState('');

  if (!isOpen) return null;

  const handleApplyCoupon = (e) => {
    e.preventDefault();
    setCouponError('');
    setCouponSuccess('');
    const result = applyDiscount(couponInput);
    if (result.success) {
      setCouponSuccess(`Coupon applied! ${result.percent}% discount.`);
      setCouponInput('');
    } else {
      setCouponError(result.message);
    }
  };

  return (
    <div className="drawer-overlay" onClick={onClose}>
      <div className="drawer-content glass" onClick={(e) => e.stopPropagation()}>
        <div className="drawer-header">
          <h3>Shopping Cart</h3>
          <button className="drawer-close" onClick={onClose}><X size={20} /></button>
        </div>

        <div className="drawer-body">
          {cart.length === 0 ? (
            <div className="empty-cart-message flex-center">
              <ShoppingBag size={48} className="empty-icon" />
              <p>Your cart is empty.</p>
              <Link to="/catalog" className="btn btn-primary" onClick={onClose}>Browse Catalog</Link>
            </div>
          ) : (
            <div className="cart-items-container">
              {cart.map((item) => (
                <div className="cart-item-card" key={`${item.id}-${item.type}`}>
                  <img src={item.image} alt={item.name} className="cart-item-img" />
                  <div className="cart-item-info">
                    <span className="cart-item-type badge badge-primary">{item.type}</span>
                    <h4 className="cart-item-name">{item.name}</h4>
                    <span className="cart-item-price">₹{item.price}</span>
                    <div className="cart-qty-controls">
                      <button onClick={() => updateQuantity(item.id, item.type, item.quantity - 1)}>-</button>
                      <span>{item.quantity}</span>
                      <button onClick={() => updateQuantity(item.id, item.type, item.quantity + 1)}>+</button>
                    </div>
                  </div>
                  <button className="cart-item-remove" onClick={() => removeFromCart(item.id, item.type)}>
                    <X size={16} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {cart.length > 0 && (
          <div className="drawer-footer">
            <form onSubmit={handleApplyCoupon} className="coupon-form">
              <input
                type="text"
                placeholder="Promo Code (e.g. WELCOME20)"
                value={couponInput}
                onChange={(e) => setCouponInput(e.target.value)}
                className="form-input"
              />
              <button type="submit" className="btn btn-secondary">Apply</button>
            </form>
            {couponError && <p className="coupon-error">{couponError}</p>}
            {couponSuccess && <p className="coupon-success">{couponSuccess}</p>}

            <div className="cart-summary-line">
              <span>Subtotal</span>
              <span>₹{getSubtotal()}</span>
            </div>
            {discountCode && (
              <div className="cart-summary-line discount">
                <span>Discount ({discountCode})</span>
                <span>- ₹{getDiscountAmount()}</span>
              </div>
            )}
            <div className="cart-summary-line total">
              <span>Total</span>
              <span>₹{getTotal()}</span>
            </div>
            <button className="btn btn-primary btn-block checkout-btn" onClick={onCheckout}>Proceed to Checkout</button>
          </div>
        )}
      </div>
    </div>
  );
}

function MainApp() {
  return (
    <Router>
      <div className="app-layout">
        <Navigation />
        <main className="main-content">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/catalog" element={<Catalog />} />
            <Route path="/services/:id" element={<ServiceDetail />} />
            <Route path="/checkout" element={<Checkout />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/admin" element={<Admin />} />
          </Routes>
        </main>
        <footer className="footer">
          <div className="container footer-grid">
            <div className="footer-brand">
              <div className="footer-logo">
                <Scissors className="logo-icon" />
                <span className="logo-text">MAHATHI <span>Boutique</span></span>
              </div>
              <p className="footer-desc">Premium customized tailoring & bridal beauty services in Mallanur, Kuppam.</p>
              <div className="contact-details">
                <p className="contact-item"><MapPin size={16} /> Beside Primary School, Mallanur, Kuppam, AP</p>
                <p className="contact-item"><Phone size={16} /> +91 98765 43210</p>
                <p className="contact-item"><Clock size={16} /> 7 Days: 9:00 AM to 6:00 PM</p>
              </div>
            </div>
            <div className="footer-links-col">
              <h4>Our Services</h4>
              <ul>
                <li><Link to="/catalog">Bridal Blouse Stitching</Link></li>
                <li><Link to="/catalog">Heavy Aari Embroidery</Link></li>
                <li><Link to="/catalog">Designer Lehengas</Link></li>
                <li><Link to="/catalog">Bridal & Party Makeup</Link></li>
              </ul>
            </div>
            <div className="footer-links-col">
              <h4>Quick Links</h4>
              <ul>
                <li><Link to="/catalog">Tailor Machine Spares</Link></li>
                <li><Link to="/catalog">Blouse Stitching Kits</Link></li>
                <li><Link to="/catalog">Home Measurement Booking</Link></li>
                <li><Link to="/dashboard">Track Order Status</Link></li>
              </ul>
            </div>
          </div>
          <div className="footer-bottom text-center">
            <p>
              &copy; {new Date().getFullYear()} Mahathi Tailor Shop. All rights reserved. |{' '}
              <Link to="/admin" className="footer-admin-link">Admin Portal</Link>
            </p>
          </div>
        </footer>
      </div>
    </Router>
  );
}

export default function App() {
  return (
    <AppProviders>
      <MainApp />
    </AppProviders>
  );
}
