import React, { createContext, useState, useEffect, useContext } from 'react';

const AuthContext = createContext();
const CartContext = createContext();

const API_URL = 'http://localhost:5000/api';

export function AppProviders({ children }) {
  // --- Auth State & Operations ---
  const [user, setUser] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [token, setToken] = useState(localStorage.getItem('token') || '');
  const [authLoading, setAuthLoading] = useState(true);

  // Helper fetch function
  const apiFetch = async (endpoint, options = {}) => {
    const headers = {
      'Content-Type': 'application/json',
      ...options.headers
    };
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    const res = await fetch(`${API_URL}${endpoint}`, {
      ...options,
      headers
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || 'Something went wrong');
    }
    return res.json();
  };

  // Load profile on start
  useEffect(() => {
    async function loadUser() {
      if (!token) {
        setAuthLoading(false);
        return;
      }
      try {
        const decoded = JSON.parse(atob(token.split('.')[1]));
        const isAdm = decoded.role === 'admin' || decoded.role === 'manager';
        setIsAdmin(isAdm);
        
        if (isAdm) {
          // Admins don't need a profile detail endpoint normally, but we can set user info from token
          setUser({
            id: decoded.id,
            name: decoded.name,
            email: decoded.email,
            role: decoded.role
          });
        } else {
          const profile = await apiFetch('/auth/profile');
          setUser(profile);
        }
      } catch (err) {
        console.error('Failed to load profile, logging out:', err.message);
        logout();
      } finally {
        setAuthLoading(false);
      }
    }
    loadUser();
  }, [token]);

  const login = async (emailOrPhone, password, otp = null) => {
    const data = await apiFetch('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ emailOrPhone, password, otp })
    });
    setToken(data.token);
    localStorage.setItem('token', data.token);
    setUser(data.user);
    setIsAdmin(false);
    return data;
  };

  const adminLogin = async (email, password) => {
    const data = await apiFetch('/auth/admin-login', {
      method: 'POST',
      body: JSON.stringify({ email, password })
    });
    setToken(data.token);
    localStorage.setItem('token', data.token);
    setUser(data.user);
    setIsAdmin(true);
    return data;
  };

  const register = async (userData) => {
    const data = await apiFetch('/auth/register', {
      method: 'POST',
      body: JSON.stringify(userData)
    });
    setToken(data.token);
    localStorage.setItem('token', data.token);
    setUser(data.user);
    setIsAdmin(false);
    return data;
  };

  const logout = () => {
    setToken('');
    localStorage.removeItem('token');
    setUser(null);
    setIsAdmin(false);
  };

  const updateProfile = async (profileData) => {
    await apiFetch('/auth/profile', {
      method: 'PUT',
      body: JSON.stringify(profileData)
    });
    setUser(prev => ({ ...prev, ...profileData }));
  };

  // --- Cart State & Operations ---
  const [cart, setCart] = useState(() => {
    const saved = localStorage.getItem('cart');
    return saved ? JSON.parse(saved) : [];
  });
  const [discountCode, setDiscountCode] = useState('');
  const [discountPercent, setDiscountPercent] = useState(0);

  useEffect(() => {
    localStorage.setItem('cart', JSON.stringify(cart));
  }, [cart]);

  const addToCart = (item, type = 'product', quantity = 1) => {
    setCart(prev => {
      const idx = prev.findIndex(i => i.id === item.id && i.type === type);
      if (idx > -1) {
        const newCart = [...prev];
        newCart[idx].quantity += quantity;
        return newCart;
      }
      return [...prev, {
        id: item.id,
        name: item.title || item.name,
        price: item.price,
        image: item.image_url,
        type,
        quantity
      }];
    });
  };

  const updateQuantity = (itemId, type, quantity) => {
    if (quantity <= 0) {
      removeFromCart(itemId, type);
      return;
    }
    setCart(prev => prev.map(i => (i.id === itemId && i.type === type) ? { ...i, quantity } : i));
  };

  const removeFromCart = (itemId, type) => {
    setCart(prev => prev.filter(i => !(i.id === itemId && i.type === type)));
  };

  const clearCart = () => {
    setCart([]);
    setDiscountCode('');
    setDiscountPercent(0);
  };

  const applyDiscount = (code) => {
    const validCodes = {
      'MAHATHI10': 10,
      'WELCOME20': 20,
      'FESTIVAL15': 15
    };
    const upperCode = code.toUpperCase();
    if (validCodes[upperCode] !== undefined) {
      setDiscountCode(upperCode);
      setDiscountPercent(validCodes[upperCode]);
      return { success: true, percent: validCodes[upperCode] };
    }
    return { success: false, message: 'Invalid coupon code' };
  };

  const getSubtotal = () => cart.reduce((acc, item) => acc + (item.price * item.quantity), 0);
  const getDiscountAmount = () => (getSubtotal() * discountPercent) / 100;
  const getTotal = () => Math.max(0, getSubtotal() - getDiscountAmount());

  return (
    <AuthContext.Provider value={{ user, isAdmin, token, authLoading, login, adminLogin, register, logout, updateProfile, apiFetch }}>
      <CartContext.Provider value={{ cart, addToCart, updateQuantity, removeFromCart, clearCart, applyDiscount, discountCode, discountPercent, getSubtotal, getDiscountAmount, getTotal }}>
        {children}
      </CartContext.Provider>
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}

export function useCart() {
  return useContext(CartContext);
}
