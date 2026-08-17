import React, { useState } from 'react';
import { X, Lock, Mail, Phone, User, Eye, EyeOff } from 'lucide-react';
import { useAuth } from '../context/AppContext';
import { auth } from '../firebase';
import { RecaptchaVerifier, signInWithPhoneNumber } from 'firebase/auth';

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
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Firebase Auth states
  const [confirmationResult, setConfirmationResult] = useState(null);
  const [resendCooldown, setResendCooldown] = useState(0);
  const [lastPhoneSent, setLastPhoneSent] = useState('');

  const normalizePhone = (num) => {
    let cleaned = num.trim().replace(/[\s\-\(\)]/g, '');
    if (cleaned.length === 10 && /^\d+$/.test(cleaned)) {
      return `+91${cleaned}`;
    }
    if (cleaned.length === 12 && cleaned.startsWith('91')) {
      return `+${cleaned}`;
    }
    return cleaned;
  };

  React.useEffect(() => {
    let timer;
    if (resendCooldown > 0) {
      timer = setTimeout(() => setResendCooldown(resendCooldown - 1), 1000);
    }
    return () => clearTimeout(timer);
  }, [resendCooldown]);

  const handleSendOTP = async (e) => {
    if (e) e.preventDefault();
    setError('');
    setLoading(true);

    const inputPhone = isRegister ? phone : (phone || email);
    if (!inputPhone) {
      setError('Please enter a phone number first.');
      setLoading(false);
      return;
    }

    const formattedPhone = normalizePhone(inputPhone);
    if (!formattedPhone.startsWith('+') || formattedPhone.length < 10 || !/^\+\d+$/.test(formattedPhone)) {
      setError('Please enter a valid phone number (e.g. 9876543210 or with country code).');
      setLoading(false);
      return;
    }

    try {
      if (window.recaptchaVerifier) {
        try {
          window.recaptchaVerifier.clear();
        } catch (err) {
          console.error('Error clearing recaptchaVerifier:', err);
        }
      }

      window.recaptchaVerifier = new RecaptchaVerifier(auth, 'recaptcha-container', {
        size: 'invisible',
        callback: (response) => {
          // reCAPTCHA solved
        },
        'expired-callback': () => {
          setError('reCAPTCHA expired. Please try again.');
        }
      });

      const confirmation = await signInWithPhoneNumber(auth, formattedPhone, window.recaptchaVerifier);
      setConfirmationResult(confirmation);
      setOtpSent(true);
      setLastPhoneSent(formattedPhone);
      setResendCooldown(60);
    } catch (err) {
      console.error('Error sending OTP:', err);
      let errMsg = 'Failed to send OTP. Please try again.';
      if (err.code === 'auth/invalid-phone-number') {
        errMsg = 'The phone number entered is invalid. Please check the format.';
      } else if (err.code === 'auth/too-many-requests') {
        errMsg = 'Too many requests. Please try again after some time.';
      } else if (err.code === 'auth/captcha-check-failed') {
        errMsg = 'reCAPTCHA verification failed. Please try again.';
      } else if (err.code === 'auth/sms-quota-exceeded') {
        errMsg = 'SMS quota exceeded. Please contact support or try later.';
      } else if (err.message) {
        errMsg = err.message;
      }
      setError(errMsg);
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
          setError('Please enter the OTP sent to your phone.');
          setLoading(false);
          return;
        }
        if (!confirmationResult) {
          setError('Please request an OTP first.');
          setLoading(false);
          return;
        }

        let userCredential;
        try {
          userCredential = await confirmationResult.confirm(otp);
        } catch (err) {
          console.error('OTP confirmation error:', err);
          setError('Invalid or expired OTP code. Please try again.');
          setLoading(false);
          return;
        }

        const firebaseToken = await userCredential.user.getIdToken();
        await register({
          name,
          email,
          phone: lastPhoneSent,
          password,
          address,
          city,
          pincode,
          firebaseToken
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
          if (!confirmationResult) {
            setError('Please request an OTP first.');
            setLoading(false);
            return;
          }

          let userCredential;
          try {
            userCredential = await confirmationResult.confirm(otp);
          } catch (err) {
            console.error('OTP confirmation error:', err);
            setError('Invalid or expired OTP code. Please try again.');
            setLoading(false);
            return;
          }

          const firebaseToken = await userCredential.user.getIdToken();
          await login(lastPhoneSent, null, null, firebaseToken);
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
    setConfirmationResult(null);
    setLastPhoneSent('');
    setError('');
  };

  const toggleAdminMode = () => {
    setIsAdminMode(!isAdminMode);
    setIsRegister(false);
    setUseOtpMode(false);
    setOtpSent(false);
    setConfirmationResult(null);
    setLastPhoneSent('');
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
              <label className="form-label">
                {isAdminMode 
                  ? 'Admin Email Address' 
                  : useOtpMode 
                    ? 'Phone Number' 
                    : 'Email Address or Phone Number'}
              </label>
              <div className="input-with-icon">
                {isAdminMode ? <Mail className="input-icon" size={16} /> : <Phone className="input-icon" size={16} />}
                <input
                  type={isAdminMode ? 'email' : 'text'}
                  required
                  placeholder={
                    isAdminMode 
                      ? 'admin@mahathitailors.com' 
                      : useOtpMode 
                        ? 'Enter your phone (e.g. 9876543210)' 
                        : 'Enter your email or phone'
                  }
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
                  <div className="otp-sent-status text-center text-sm margin-bottom-xs">
                    <span>OTP sent to <strong>{lastPhoneSent}</strong></span>
                  </div>
                  <input
                    type="text"
                    required
                    placeholder="Enter 6-digit OTP"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value)}
                    className="form-input text-center otp-input"
                    maxLength={6}
                  />
                  
                  <div className="otp-actions flex justify-between margin-top-xs">
                    <button
                      type="button"
                      className="auth-toggle-link text-xs"
                      onClick={handleSendOTP}
                      disabled={loading || resendCooldown > 0}
                    >
                      {resendCooldown > 0 ? `Resend OTP in ${resendCooldown}s` : 'Resend OTP'}
                    </button>
                  </div>
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

          {/* Invisible reCAPTCHA container */}
          <div id="recaptcha-container" className="margin-bottom-xs"></div>

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
