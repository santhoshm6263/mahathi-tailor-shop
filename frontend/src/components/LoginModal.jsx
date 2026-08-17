import React, { useState } from 'react';
import { X, Lock, Mail, Phone, User, Eye, EyeOff } from 'lucide-react';
import { useAuth } from '../context/AppContext';
import { auth } from '../firebase';
import { createUserWithEmailAndPassword, signInWithEmailAndPassword } from 'firebase/auth';

export default function LoginModal({ onClose }) {
  const { login, register, adminLogin } = useAuth();
  const [isRegister, setIsRegister] = useState(false);
  const [isAdminMode, setIsAdminMode] = useState(false);

  // Form Fields
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  
  // Address details for signup
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');
  const [pincode, setPincode] = useState('');

  // UI Flags & Messages
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (isAdminMode) {
        await adminLogin(email, password);
        onClose();
      } else if (isRegister) {
        // Firebase Email/Password Sign Up
        let userCredential;
        try {
          userCredential = await createUserWithEmailAndPassword(auth, email, password);
        } catch (err) {
          console.error('Firebase signup error:', err);
          let errMsg = 'Failed to create account. Please try again.';
          if (err.code === 'auth/email-already-in-use') {
            errMsg = 'This email address is already in use.';
          } else if (err.code === 'auth/invalid-email') {
            errMsg = 'The email address is invalid.';
          } else if (err.code === 'auth/weak-password') {
            errMsg = 'The password must be at least 6 characters long.';
          } else if (err.message) {
            errMsg = err.message;
          }
          setError(errMsg);
          setLoading(false);
          return;
        }

        const firebaseToken = await userCredential.user.getIdToken();
        await register({
          name,
          email,
          phone,
          password,
          address,
          city,
          pincode,
          firebaseToken
        });
        onClose();
      } else {
        // Firebase Email/Password Sign In
        let userCredential;
        try {
          userCredential = await signInWithEmailAndPassword(auth, email, password);
        } catch (err) {
          console.error('Firebase login error:', err);
          let errMsg = 'Incorrect email or password.';
          if (err.code === 'auth/user-not-found' || err.code === 'auth/wrong-password' || err.code === 'auth/invalid-credential') {
            errMsg = 'Incorrect email or password.';
          } else if (err.code === 'auth/invalid-email') {
            errMsg = 'The email address is invalid.';
          } else if (err.message) {
            errMsg = err.message;
          }
          setError(errMsg);
          setLoading(false);
          return;
        }

        const firebaseToken = await userCredential.user.getIdToken();
        await login(email, null, null, firebaseToken);
        onClose();
      }
    } catch (err) {
      setError(err.message || 'Authentication failed. Please check your inputs.');
    } finally {
      setLoading(false);
    }
  };

  const toggleMode = () => {
    setIsRegister(!isRegister);
    setIsAdminMode(false);
    setError('');
  };

  const toggleAdminMode = () => {
    setIsAdminMode(!isAdminMode);
    setIsRegister(false);
    setError('');
  };

  return (
    <div className="modal-overlay flex-center" onClick={onClose}>
      <div className="modal-content glass animate-fade-up" onClick={(e) => e.stopPropagation()}>
        <button className="modal-close" onClick={onClose}><X size={20} /></button>

        <div className="modal-header text-center">
          <h2>
            {isAdminMode ? 'Admin Portal Sign In' : isRegister ? 'Create Your Account' : 'Welcome Back'}
          </h2>
          <p className="modal-subtitle">
            {isAdminMode 
              ? 'Access shop administration' 
              : isRegister 
                ? 'Join Mahathi Boutique for custom stitching & makeover styling' 
                : 'Sign in to access your bookings and cart'}
          </p>
        </div>

        {error && <div className="modal-error-box">{error}</div>}

        <form onSubmit={handleSubmit} className="modal-form">
          {/* Sign Up Fields */}
          {isRegister && (
            <>
              <div className="form-group">
                <label className="form-label">Full Name</label>
                <div className="input-with-icon">
                  <User className="input-icon" size={16} />
                  <input
                    type="text"
                    required
                    placeholder="Enter your name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="form-input"
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Email Address</label>
                <div className="input-with-icon">
                  <Mail className="input-icon" size={16} />
                  <input
                    type="email"
                    required
                    placeholder="name@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="form-input"
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Phone Number</label>
                <div className="input-with-icon">
                  <Phone className="input-icon" size={16} />
                  <input
                    type="tel"
                    required
                    placeholder="9876543210"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="form-input"
                  />
                </div>
              </div>
            </>
          )}

          {/* Sign In Fields */}
          {!isRegister && (
            <div className="form-group">
              <label className="form-label">{isAdminMode ? 'Admin Email Address' : 'Email Address'}</label>
              <div className="input-with-icon">
                <Mail className="input-icon" size={16} />
                <input
                  type="email"
                  required
                  placeholder={isAdminMode ? 'admin@mahathitailors.com' : 'Enter your email'}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="form-input"
                />
              </div>
            </div>
          )}

          {/* Password */}
          <div className="form-group">
            <label className="form-label">Password</label>
            <div className="input-with-icon">
              <Lock className="input-icon" size={16} />
              <input
                type={showPassword ? 'text' : 'password'}
                required
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="form-input"
              />
              <button
                type="button"
                className="password-toggle-btn"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          {/* Address Fields (Sign Up only) */}
          {isRegister && (
            <div className="signup-address-fields">
              <h4 className="section-title-sm">Delivery Address Details (Optional)</h4>
              <div className="form-group">
                <input
                  type="text"
                  placeholder="Street address / Landmark"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  className="form-input"
                />
              </div>
              <div className="grid-cols-2">
                <input
                  type="text"
                  placeholder="City"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  className="form-input"
                />
                <input
                  type="text"
                  placeholder="Pincode"
                  value={pincode}
                  onChange={(e) => setPincode(e.target.value)}
                  className="form-input"
                />
              </div>
            </div>
          )}

          <button
            type="submit"
            className="btn btn-primary btn-block submit-auth-btn"
            disabled={loading}
          >
            {loading ? 'Processing...' : isRegister ? 'Create Account' : 'Sign In'}
          </button>
        </form>

        <div className="modal-footer-links text-center">
          {/* Toggle modes */}
          {!isAdminMode && (
            <p>
              {isRegister ? 'Already have an account?' : "Don't have an account?"}{' '}
              <button className="auth-toggle-link" onClick={toggleMode}>
                {isRegister ? 'Sign In' : 'Sign Up Now'}
              </button>
            </p>
          )}

          {/* Admin toggle */}
          <p className="admin-portal-link">
            <button className="auth-toggle-link text-muted" onClick={toggleAdminMode}>
              {isAdminMode ? 'Back to Customer Sign In' : 'Access Admin Dashboard'}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}
