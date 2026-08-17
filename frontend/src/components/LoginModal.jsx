import React, { useState } from 'react';
import { X, Lock, Mail, Phone, User, Eye, EyeOff } from 'lucide-react';
import { useAuth } from '../context/AppContext';

export default function LoginModal({ onClose }) {
  const { login, register, adminLogin, apiFetch } = useAuth();
  const [isRegister, setIsRegister] = useState(false);
  const [isAdminMode, setIsAdminMode] = useState(false);
  const [useOtpMode, setUseOtpMode] = useState(false);

  // Form Fields
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [otp, setOtp] = useState('');
  
  // Address details for signup
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');
  const [pincode, setPincode] = useState('');

  // UI Flags & Messages
  const [otpSent, setOtpSent] = useState(false);
  const [sentCode, setSentCode] = useState(''); // Display mock OTP for local testing
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSendOTP = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    const identifier = isRegister ? phone || email : phone || email; // use whichever is filled
    
    if (!identifier) {
      setError('Please enter a phone number or email first.');
      setLoading(false);
      return;
    }

    try {
      const data = await apiFetch('/auth/send-otp', {
        method: 'POST',
        body: JSON.stringify({ phoneOrEmail: identifier })
      });
      setOtpSent(true);
      setSentCode(data.otp);
    } catch (err) {
      setError(err.message || 'Failed to send OTP. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (isAdminMode) {
        await adminLogin(email, password);
        onClose();
      } else if (isRegister) {
        if (!otp) {
          setError('Please enter the OTP sent to your phone/email.');
          setLoading(false);
          return;
        }
        await register({
          name,
          email,
          phone,
          password,
          address,
          city,
          pincode,
          otp
        });
        onClose();
      } else {
        // Sign In
        if (useOtpMode) {
          if (!otp) {
            setError('Please enter the OTP code.');
            setLoading(false);
            return;
          }
          await login(email || phone, null, otp);
        } else {
          await login(email || phone, password);
        }
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
    setUseOtpMode(false);
    setOtpSent(false);
    setSentCode('');
    setError('');
  };

  const toggleAdminMode = () => {
    setIsAdminMode(!isAdminMode);
    setIsRegister(false);
    setUseOtpMode(false);
    setOtpSent(false);
    setSentCode('');
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
              <label className="form-label">{isAdminMode ? 'Admin Email Address' : 'Email Address or Phone Number'}</label>
              <div className="input-with-icon">
                {isAdminMode ? <Mail className="input-icon" size={16} /> : <Phone className="input-icon" size={16} />}
                <input
                  type={isAdminMode ? 'email' : 'text'}
                  required
                  placeholder={isAdminMode ? 'admin@mahathitailors.com' : 'Enter your email or phone'}
                  value={email || phone}
                  onChange={(e) => {
                    const val = e.target.value;
                    if (isAdminMode) setEmail(val);
                    else {
                      setEmail(val);
                      setPhone(val);
                    }
                  }}
                  className="form-input"
                />
              </div>
            </div>
          )}

          {/* Password (used in standard login & admin login) */}
          {(!useOtpMode || isAdminMode) && (
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
          )}

          {/* OTP Section (Registration or OTP-Login) */}
          {(isRegister || (useOtpMode && !isAdminMode)) && (
            <div className="otp-container-box">
              {otpSent ? (
                <div className="form-group">
                  <label className="form-label text-gradient">Verification OTP Code</label>
                  <input
                    type="text"
                    required
                    placeholder="Enter 6-digit OTP"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value)}
                    className="form-input text-center otp-input"
                  />
                  {sentCode && (
                    <div className="mock-otp-notification text-center">
                      <span>Testing Code: <strong>{sentCode}</strong> (Auto-generated)</span>
                    </div>
                  )}
                </div>
              ) : (
                <button
                  type="button"
                  className="btn btn-secondary btn-block send-otp-btn"
                  onClick={handleSendOTP}
                  disabled={loading}
                >
                  Send Verification OTP
                </button>
              )}
            </div>
          )}

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
            disabled={loading || (isRegister && !otpSent) || (useOtpMode && !otpSent)}
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

          {/* Toggle Login Option (OTP or Password) */}
          {!isRegister && !isAdminMode && (
            <p className="margin-top-sm">
              <button className="auth-toggle-link" onClick={() => setUseOtpMode(!useOtpMode)}>
                {useOtpMode ? 'Sign In with Password' : 'Sign In with OTP Verification'}
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
