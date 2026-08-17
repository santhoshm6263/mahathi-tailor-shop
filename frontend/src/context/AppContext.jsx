import React, { createContext, useState, useEffect, useContext } from 'react';
import { auth, db } from '../firebase';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { 
  doc, 
  getDoc, 
  setDoc, 
  updateDoc, 
  collection, 
  addDoc, 
  getDocs, 
  query, 
  where 
} from 'firebase/firestore';

const AuthContext = createContext();
const CartContext = createContext();

const getApiBase = () => {
  if (import.meta.env.VITE_API_URL) {
    return import.meta.env.VITE_API_URL;
  }
  const isLocal = typeof window !== 'undefined' && 
    (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');
  return isLocal ? 'http://localhost:5000' : 'https://mahathi-tailor-shop.onrender.com';
};

const API_BASE = getApiBase();
const API_URL = `${API_BASE}/api`;

export function AppProviders({ children }) {
  // --- Auth State & Operations ---
  const [user, setUser] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [token, setToken] = useState(localStorage.getItem('token') || '');
  const [authLoading, setAuthLoading] = useState(true);

  // Helper fetch function
  const apiFetch = async (endpoint, options = {}) => {
    // Intercept customer endpoints for Firebase/Firestore
    if (!isAdmin && auth.currentUser) {
      const uid = auth.currentUser.uid;
      
      // 1. Get Measurements
      if (endpoint === '/auth/measurements' && (!options.method || options.method === 'GET')) {
        const docRef = doc(db, 'users', uid);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          return docSnap.data().measurements || {};
        }
        return {};
      }
      
      // 2. Put Measurements
      if (endpoint === '/auth/measurements' && options.method === 'PUT') {
        const docRef = doc(db, 'users', uid);
        const body = JSON.parse(options.body);
        await updateDoc(docRef, { measurements: body });
        return { success: true };
      }
      
      // 3. Post Checkout / Order Placement
      if (endpoint === '/checkout' && options.method === 'POST') {
        const body = JSON.parse(options.body);
        const order_number = 'MTS-' + Math.floor(100000 + Math.random() * 900000);
        const created_at = new Date().toISOString();
        const delivery_date = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toLocaleDateString();
        const newOrder = {
          ...body,
          order_number,
          created_at,
          delivery_date,
          status: 'pending',
          userId: uid
        };
        await addDoc(collection(db, 'orders'), newOrder);
        return newOrder;
      }
      
      // 4. Post Booking (standard, measurement, makeup)
      if ((endpoint === '/bookings' || endpoint === '/measurement-bookings' || endpoint === '/makeup-bookings') && options.method === 'POST') {
        const body = JSON.parse(options.body);
        const newBooking = {
          ...body,
          status: 'pending',
          created_at: new Date().toISOString(),
          userId: uid
        };
        let collName = 'bookings';
        if (endpoint === '/measurement-bookings') collName = 'measurement_bookings';
        if (endpoint === '/makeup-bookings') collName = 'makeup_bookings';
        
        await addDoc(collection(db, collName), newBooking);
        return newBooking;
      }
      
      // 5. Get History List (orders, bookings, measurement-bookings, makeup-bookings)
      let collName = '';
      if (endpoint === '/orders') collName = 'orders';
      else if (endpoint === '/bookings') collName = 'bookings';
      else if (endpoint === '/measurement-bookings') collName = 'measurement_bookings';
      else if (endpoint === '/makeup-bookings') collName = 'makeup_bookings';
      
      if (collName) {
        const q = query(collection(db, collName), where('userId', '==', uid));
        const querySnapshot = await getDocs(q);
        const list = [];
        querySnapshot.forEach((doc) => {
          list.push({ id: doc.id, ...doc.data() });
        });
        list.sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0));
        return list;
      }
    }

    const headers = {
      'Content-Type': 'application/json',
      ...options.headers
    };
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    let res;
    try {
      res = await fetch(`${API_URL}${endpoint}`, {
        ...options,
        headers
      });
    } catch (netErr) {
      console.error('Network Error during apiFetch:', netErr);
      throw new Error(
        `Unable to connect to the server. Please check your internet connection and try again.`
      );
    }

    if (!res.ok) {
      let errMsg = 'Something went wrong';
      try {
        const errJson = await res.json();
        errMsg = errJson.message || errMsg;
      } catch (parseErr) {
        try {
          const errText = await res.text();
          errMsg = errText || `HTTP error ${res.status}: ${res.statusText}`;
        } catch (textErr) {
          errMsg = `HTTP error ${res.status}: ${res.statusText}`;
        }
      }
      throw new Error(errMsg);
    }

    return res.json();
  };

  // Listen to Firebase Auth state change for customers
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        try {
          const docRef = doc(db, 'users', firebaseUser.uid);
          const docSnap = await getDoc(docRef);
          let profileData = null;
          if (docSnap.exists()) {
            profileData = docSnap.data();
          } else {
            profileData = {
              uid: firebaseUser.uid,
              name: firebaseUser.displayName || firebaseUser.email.split('@')[0],
              email: firebaseUser.email,
              phone: firebaseUser.phoneNumber || '',
              role: 'customer',
              createdAt: new Date().toISOString()
            };
            await setDoc(docRef, profileData);
          }
          setUser(profileData);
          setIsAdmin(false);
          const idToken = await firebaseUser.getIdToken();
          setToken(idToken);
          localStorage.setItem('token', idToken);
        } catch (err) {
          console.error('Error fetching Firestore user profile:', err);
        } finally {
          setAuthLoading(false);
        }
      } else {
        // Fallback for admin JWT persistent session
        const localToken = localStorage.getItem('token');
        if (localToken) {
          try {
            const parts = localToken.split('.');
            if (parts.length === 3) {
              const decoded = JSON.parse(atob(parts[1]));
              const isAdm = decoded.role === 'admin' || decoded.role === 'manager';
              if (isAdm) {
                setIsAdmin(true);
                setUser({
                  id: decoded.id,
                  name: decoded.name,
                  email: decoded.email,
                  role: decoded.role
                });
                setToken(localToken);
                setAuthLoading(false);
                return;
              }
            }
          } catch (err) {
            console.error('Failed to load local admin profile, logging out:', err.message);
          }
        }
        setUser(null);
        setIsAdmin(false);
        setToken('');
        setAuthLoading(false);
      }
    });

    return () => unsubscribe();
  }, []);

  const login = async (emailOrPhone, password, otp = null, firebaseToken = null) => {
    const data = await apiFetch('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ emailOrPhone, password, otp, firebaseToken })
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

  const logout = async () => {
    if (auth.currentUser) {
      try {
        await signOut(auth);
      } catch (err) {
        console.error('Firebase signOut error:', err);
      }
    }
    setToken('');
    localStorage.removeItem('token');
    setUser(null);
    setIsAdmin(false);
  };

  const updateProfile = async (profileData) => {
    if (!isAdmin && auth.currentUser) {
      const docRef = doc(db, 'users', auth.currentUser.uid);
      await updateDoc(docRef, profileData);
      setUser(prev => ({ ...prev, ...profileData }));
    } else {
      await apiFetch('/auth/profile', {
        method: 'PUT',
        body: JSON.stringify(profileData)
      });
      setUser(prev => ({ ...prev, ...profileData }));
    }
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
