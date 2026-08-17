import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { ShoppingBag, CreditCard, MapPin, CheckCircle, AlertTriangle, ChevronRight, Check } from 'lucide-react';
import { useAuth, useCart } from '../context/AppContext';

export default function Checkout() {
  const { user, apiFetch } = useAuth();
  const { cart, getSubtotal, getTotal, getDiscountAmount, discountCode, clearCart } = useCart();
  const navigate = useNavigate();

  // Wizard Steps: 1 = Shipping, 2 = Review, 3 = Payment, 4 = Success
  const [step, setStep] = useState(1);

  // Form inputs
  const [name, setName] = useState(user?.name || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [address, setAddress] = useState(user?.address || '');
  const [city, setCity] = useState(user?.city || 'Kuppam');
  const [pincode, setPincode] = useState(user?.pincode || '517425');

  // Payment states
  const [paymentMethod, setPaymentMethod] = useState('razorpay'); // razorpay, cashfree
  const [simulatingPayment, setSimulatingPayment] = useState(false);
  const [paymentStatus, setPaymentStatus] = useState(''); // success, failed, pending
  
  // Confirmed Order Details
  const [confirmedOrder, setConfirmedOrder] = useState(null);

  useEffect(() => {
    // If cart is empty and we are not in success step, redirect to catalog
    if (cart.length === 0 && step !== 4) {
      navigate('/catalog');
    }
  }, [cart, step, navigate]);

  const handleNextStep = (e) => {
    if (e) e.preventDefault();
    setStep(prev => prev + 1);
  };

  const handlePrevStep = () => {
    setStep(prev => prev - 1);
  };

  const handleSimulatePayment = async (status) => {
    setSimulatingPayment(true);
    setPaymentStatus('');

    // Short timeout to simulate connection
    setTimeout(async () => {
      setSimulatingPayment(false);
      setPaymentStatus(status);

      if (status === 'success') {
        try {
          const orderPayload = {
            items: cart,
            total_price: getTotal(),
            address,
            city,
            pincode,
            payment_method: paymentMethod === 'razorpay' ? 'Razorpay (Online)' : 'Cashfree (Online)',
            transaction_id: 'TXN-' + Math.floor(Math.random() * 900000000)
          };

          const orderRes = await apiFetch('/checkout', {
            method: 'POST',
            body: JSON.stringify(orderPayload)
          });

          setConfirmedOrder(orderRes);
          clearCart();
          setStep(4); // Move to Success Page
        } catch (err) {
          alert('Failed to register order: ' + err.message);
        }
      }
    }, 1500);
  };

  return (
    <div className="checkout-wizard-container container">
      {/* Step Stepper Indicator */}
      {step < 4 && (
        <div className="checkout-stepper glass flex-center animate-fade-up">
          <div className={`step-item ${step >= 1 ? 'active' : ''} ${step > 1 ? 'completed' : ''}`}>
            <span className="step-num">{step > 1 ? <Check size={16} /> : '1'}</span>
            <span className="step-label">Shipping Details</span>
          </div>
          <ChevronRight size={16} className="step-sep" />
          <div className={`step-item ${step >= 2 ? 'active' : ''} ${step > 2 ? 'completed' : ''}`}>
            <span className="step-num">{step > 2 ? <Check size={16} /> : '2'}</span>
            <span className="step-label">Review Order</span>
          </div>
          <ChevronRight size={16} className="step-sep" />
          <div className={`step-item ${step >= 3 ? 'active' : ''}`}>
            <span className="step-num">3</span>
            <span className="step-label">Online Payment</span>
          </div>
        </div>
      )}

      <div className="checkout-layout">
        {/* Step Views */}
        <div className="checkout-main-column animate-fade-up">
          {step === 1 && (
            <div className="checkout-card glass">
              <h3><MapPin size={20} /> Shipping & Fitting Contact Info</h3>
              <p className="card-subtitle">We will use this address for delivering ready items and tailoring items.</p>
              
              <form onSubmit={handleNextStep}>
                <div className="form-group">
                  <label className="form-label">Full Name</label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="form-input"
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Active Contact Mobile Phone</label>
                  <input
                    type="tel"
                    required
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="form-input"
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Delivery Street Address</label>
                  <textarea
                    required
                    rows="3"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    className="form-input"
                  ></textarea>
                </div>

                <div className="grid-cols-2">
                  <div className="form-group">
                    <label className="form-label">City / Town</label>
                    <input
                      type="text"
                      required
                      value={city}
                      onChange={(e) => setCity(e.target.value)}
                      className="form-input"
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Pincode</label>
                    <input
                      type="text"
                      required
                      value={pincode}
                      onChange={(e) => setPincode(e.target.value)}
                      className="form-input"
                    />
                  </div>
                </div>

                <button type="submit" className="btn btn-primary btn-block margin-top">
                  Review Order Details
                </button>
              </form>
            </div>
          )}

          {step === 2 && (
            <div className="checkout-card glass">
              <h3><ShoppingBag size={20} /> Review Order Items</h3>
              <p className="card-subtitle">Please double check your order and custom stitching selection before making payment.</p>

              <div className="review-items-list">
                {cart.map((item) => (
                  <div className="review-item-row" key={`${item.id}-${item.type}`}>
                    <img src={item.image} alt={item.name} className="review-item-img" />
                    <div className="review-item-info">
                      <span className="badge badge-primary">{item.type}</span>
                      <h4>{item.name}</h4>
                      <p className="text-muted">Quantity: {item.quantity}</p>
                    </div>
                    <span className="review-item-price">₹{item.price * item.quantity}</span>
                  </div>
                ))}
              </div>

              <div className="delivery-summary-box">
                <h4><MapPin size={16} /> Delivery Destination:</h4>
                <p><strong>{name}</strong> - {phone}</p>
                <p>{address}, {city} - {pincode}</p>
              </div>

              <div className="review-action-row">
                <button type="button" className="btn btn-secondary" onClick={handlePrevStep}>Back to Address</button>
                <button type="button" className="btn btn-primary" onClick={handleNextStep}>Proceed to Payment</button>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="checkout-card glass">
              <h3><CreditCard size={20} /> Razorpay / Cashfree Payment Gateway Simulator</h3>
              <p className="card-subtitle">Mahathi Boutique is online payment only. Pick a payment network to simulate the checkout API hook.</p>

              <div className="gateway-selector-grid">
                <label className={`gateway-option ${paymentMethod === 'razorpay' ? 'selected' : ''}`}>
                  <input
                    type="radio"
                    name="gateway"
                    value="razorpay"
                    checked={paymentMethod === 'razorpay'}
                    onChange={() => setPaymentMethod('razorpay')}
                  />
                  <div className="gateway-opt-details">
                    <strong>Razorpay Checkout</strong>
                    <span>Supports UPI, Cards, NetBanking</span>
                  </div>
                </label>

                <label className={`gateway-option ${paymentMethod === 'cashfree' ? 'selected' : ''}`}>
                  <input
                    type="radio"
                    name="gateway"
                    value="cashfree"
                    checked={paymentMethod === 'cashfree'}
                    onChange={() => setPaymentMethod('cashfree')}
                  />
                  <div className="gateway-opt-details">
                    <strong>Cashfree Payments</strong>
                    <span>Instant UPI & PayLater options</span>
                  </div>
                </label>
              </div>

              <div className="payment-simulation-box text-center">
                {simulatingPayment ? (
                  <div className="simulating-progress flex-center">
                    <div className="loading-spinner"></div>
                    <p>Securing checkout window with {paymentMethod === 'razorpay' ? 'Razorpay' : 'Cashfree'}...</p>
                  </div>
                ) : (
                  <>
                    <p className="sim-helper-text">Select a simulation outcome to mock the webhook endpoint response:</p>
                    <div className="sim-action-buttons flex-center">
                      <button
                        className="btn btn-primary payment-sim-success-btn"
                        onClick={() => handleSimulatePayment('success')}
                      >
                        Simulate Successful Payment
                      </button>
                      <button
                        className="btn btn-secondary payment-sim-fail-btn"
                        onClick={() => handleSimulatePayment('failed')}
                      >
                        Simulate Failed Transaction
                      </button>
                    </div>
                  </>
                )}

                {paymentStatus === 'failed' && (
                  <div className="payment-alert payment-failed-alert flex-center">
                    <AlertTriangle size={18} />
                    <span>Payment simulation failed! Your card/account was not debited. Please try again.</span>
                  </div>
                )}
              </div>

              <div className="review-action-row">
                <button type="button" className="btn btn-secondary" onClick={handlePrevStep} disabled={simulatingPayment}>Back to Review</button>
              </div>
            </div>
          )}

          {step === 4 && confirmedOrder && (
            <div className="checkout-card success-card glass text-center animate-fade-up">
              <div className="success-icon-wrapper flex-center">
                <CheckCircle size={48} />
              </div>
              <h2>Order Placed Successfully!</h2>
              <p className="success-order-number">Order Reference: <strong>{confirmedOrder.order_number}</strong></p>
              
              <div className="order-details-success-summary">
                <div className="success-summary-line">
                  <span>Total Amount Paid:</span>
                  <strong>₹{getTotal()}</strong>
                </div>
                <div className="success-summary-line">
                  <span>Estimated Delivery Date:</span>
                  <strong>{confirmedOrder.delivery_date}</strong>
                </div>
                <div className="success-summary-line">
                  <span>Shipping Address:</span>
                  <span>{address}, {city}</span>
                </div>
              </div>

              <div className="success-action-row flex-center">
                <Link to="/dashboard" className="btn btn-primary">Track Order on Dashboard</Link>
                <Link to="/catalog" className="btn btn-secondary">Continue Shopping</Link>
              </div>
            </div>
          )}
        </div>

        {/* Right Side: Order Summary Drawer (Only for checkout steps) */}
        {step < 4 && (
          <div className="checkout-summary-column animate-fade-up">
            <div className="checkout-summary-card glass">
              <h3>Order Price Summary</h3>
              <div className="checkout-summary-body">
                <div className="checkout-summary-items-log">
                  {cart.map((item) => (
                    <div className="summary-item-log-line" key={`${item.id}-${item.type}`}>
                      <span>{item.name} (x{item.quantity})</span>
                      <span>₹{item.price * item.quantity}</span>
                    </div>
                  ))}
                </div>

                <div className="cart-summary-line border-top">
                  <span>Subtotal</span>
                  <span>₹{getSubtotal()}</span>
                </div>
                {discountCode && (
                  <div className="cart-summary-line discount">
                    <span>Discount ({discountCode})</span>
                    <span>- ₹{getDiscountAmount()}</span>
                  </div>
                )}
                <div className="cart-summary-line total border-top">
                  <span>Total Payable</span>
                  <span className="text-gradient">₹{getTotal()}</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
