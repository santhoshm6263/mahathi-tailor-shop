import React, { useState, useEffect } from 'react';
import { User, Ruler, ShoppingBag, Calendar, Clock, Edit2, CheckCircle, Package, ArrowRight, ShieldCheck } from 'lucide-react';
import { useAuth } from '../context/AppContext';

export default function Dashboard() {
  const { user, apiFetch, updateProfile } = useAuth();
  
  // Tab control: profile, orders, bookings, measurements
  const [activeTab, setActiveTab] = useState('orders');

  // Profile Form States
  const [name, setName] = useState(user?.name || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [address, setAddress] = useState(user?.address || '');
  const [city, setCity] = useState(user?.city || '');
  const [pincode, setPincode] = useState(user?.pincode || '');
  const [profilePic, setProfilePic] = useState(user?.profile_pic || '');
  const [profileSuccessMsg, setProfileSuccessMsg] = useState('');

  // Measurements Form States
  const [shoulder, setShoulder] = useState(0);
  const [bust, setBust] = useState(0);
  const [waist, setWaist] = useState(0);
  const [hips, setHips] = useState(0);
  const [armLength, setArmLength] = useState(0);
  const [totalLength, setTotalLength] = useState(0);
  const [measSuccessMsg, setMeasSuccessMsg] = useState('');

  // Order & Booking History States
  const [orders, setOrders] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [measurementBookings, setMeasurementBookings] = useState([]);
  const [makeupBookings, setMakeupBookings] = useState([]);
  
  const [loadingHistory, setLoadingHistory] = useState(true);

  // Sync user info when context loads
  useEffect(() => {
    if (user) {
      setName(user.name);
      setPhone(user.phone);
      setAddress(user.address || '');
      setCity(user.city || '');
      setPincode(user.pincode || '');
      setProfilePic(user.profile_pic || '');
    }
  }, [user]);

  // Load Measurements
  useEffect(() => {
    async function loadMeasurements() {
      try {
        const data = await apiFetch('/auth/measurements');
        if (data) {
          setShoulder(data.shoulder || 0);
          setBust(data.bust || 0);
          setWaist(data.waist || 0);
          setHips(data.hips || 0);
          setArmLength(data.arm_length || 0);
          setTotalLength(data.total_length || 0);
        }
      } catch (err) {
        console.error('Failed to load measurements:', err.message);
      }
    }
    if (user) loadMeasurements();
  }, [user]);

  // Load orders and bookings history
  useEffect(() => {
    async function loadHistory() {
      setLoadingHistory(true);
      try {
        const [ordersRes, bookingsRes, measBookingsRes, makeupBookingsRes] = await Promise.all([
          apiFetch('/orders'),
          apiFetch('/bookings'),
          apiFetch('/measurement-bookings'),
          apiFetch('/makeup-bookings')
        ]);
        setOrders(ordersRes);
        setBookings(bookingsRes);
        setMeasurementBookings(measBookingsRes);
        setMakeupBookings(makeupBookingsRes);
      } catch (err) {
        console.error('Failed to load dashboard logs:', err.message);
      } finally {
        setLoadingHistory(false);
      }
    }
    if (user) loadHistory();
  }, [user, activeTab]);

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    setProfileSuccessMsg('');
    try {
      await updateProfile({
        name,
        phone,
        address,
        city,
        pincode,
        profile_pic: profilePic
      });
      setProfileSuccessMsg('Profile details updated successfully!');
      setTimeout(() => setProfileSuccessMsg(''), 4000);
    } catch (err) {
      alert(err.message || 'Profile update failed.');
    }
  };

  const handleUpdateMeasurements = async (e) => {
    e.preventDefault();
    setMeasSuccessMsg('');
    try {
      await apiFetch('/auth/measurements', {
        method: 'PUT',
        body: JSON.stringify({
          shoulder: parseFloat(shoulder),
          bust: parseFloat(bust),
          waist: parseFloat(waist),
          hips: parseFloat(hips),
          arm_length: parseFloat(armLength),
          total_length: parseFloat(totalLength)
        })
      });
      setMeasSuccessMsg('Measurements profile saved successfully!');
      setTimeout(() => setMeasSuccessMsg(''), 4000);
    } catch (err) {
      alert(err.message || 'Failed to save measurements.');
    }
  };

  // Helper to render Order Stepper
  const renderOrderStepper = (status) => {
    const steps = ['pending', 'confirmed', 'completed', 'delivered'];
    const currentIdx = steps.indexOf(status.toLowerCase());
    
    return (
      <div className="order-stepper-row">
        {steps.map((stepName, idx) => {
          let stepClass = 'stepper-node';
          if (idx <= currentIdx) stepClass += ' active';
          if (idx === currentIdx) stepClass += ' current';
          
          return (
            <React.Fragment key={stepName}>
              <div className={stepClass} title={stepName.toUpperCase()}>
                <span className="step-dot"></span>
                <span className="step-txt">{stepName}</span>
              </div>
              {idx < steps.length - 1 && (
                <div className={`stepper-line ${idx < currentIdx ? 'active' : ''}`}></div>
              )}
            </React.Fragment>
          );
        })}
      </div>
    );
  };

  return (
    <div className="dashboard-container container">
      {/* Top Banner Profile Summary */}
      <section className="dashboard-hero glass flex-center animate-fade-up">
        <div className="db-profile-header">
          <img src={profilePic || 'https://api.dicebear.com/7.x/avataaars/svg?seed=default'} alt={name} className="db-profile-avatar" />
          <div className="db-profile-text">
            <h2>{name}</h2>
            <p className="text-muted">{user?.email} • {phone || 'No phone added'}</p>
            <div className="db-meta-badges">
              <span className="badge badge-primary">Customer Profile</span>
              {address && <span className="badge badge-secondary">{city}</span>}
            </div>
          </div>
        </div>
      </section>

      {/* Tabs Layout */}
      <div className="dashboard-tabs-layout">
        <aside className="dashboard-sidebar-menu glass animate-fade-up">
          <ul className="db-menu-list">
            <li>
              <button 
                className={`db-menu-item ${activeTab === 'orders' ? 'active' : ''}`}
                onClick={() => setActiveTab('orders')}
              >
                <ShoppingBag size={18} /> Order History
              </button>
            </li>
            <li>
              <button 
                className={`db-menu-item ${activeTab === 'bookings' ? 'active' : ''}`}
                onClick={() => setActiveTab('bookings')}
              >
                <Calendar size={18} /> Service Reservations
              </button>
            </li>
            <li>
              <button 
                className={`db-menu-item ${activeTab === 'measurements' ? 'active' : ''}`}
                onClick={() => setActiveTab('measurements')}
              >
                <Ruler size={18} /> My Measurements
              </button>
            </li>
            <li>
              <button 
                className={`db-menu-item ${activeTab === 'profile' ? 'active' : ''}`}
                onClick={() => setActiveTab('profile')}
              >
                <User size={18} /> Manage Profile
              </button>
            </li>
          </ul>
        </aside>

        <main className="dashboard-main-content animate-fade-up">
          {/* ORDERS TAB */}
          {activeTab === 'orders' && (
            <div className="dashboard-tab-card glass">
              <h3>My Orders</h3>
              <p className="tab-subtitle">Track your delivery orders and custom fabric packages.</p>
              
              {loadingHistory ? (
                <div className="db-loading flex-center"><div className="loading-spinner"></div></div>
              ) : orders.length === 0 ? (
                <div className="db-empty-state text-center">
                  <Package size={48} className="empty-icon" />
                  <p>You haven't placed any orders yet.</p>
                </div>
              ) : (
                <div className="orders-history-list">
                  {orders.map((order) => (
                    <div className="db-order-card" key={order.id}>
                      <div className="db-order-header">
                        <div>
                          <span className="order-num-label">Order Ref: <strong>{order.order_number}</strong></span>
                          <span className="order-date-label">Placed on: {new Date(order.created_at).toLocaleDateString()}</span>
                        </div>
                        <span className={`badge order-status-badge status-${order.status.toLowerCase()}`}>
                          {order.status.toUpperCase()}
                        </span>
                      </div>

                      <div className="db-order-items">
                        {order.items && order.items.map((item) => (
                          <div className="db-order-item-row" key={`${item.id}-${item.item_type}`}>
                            <div className="db-item-details">
                              <span className="item-name">{item.product_name || item.service_title}</span>
                              <span className="item-qty">Qty: {item.quantity}</span>
                            </div>
                            <span className="item-price">₹{item.price * item.quantity}</span>
                          </div>
                        ))}
                      </div>

                      <div className="db-order-footer">
                        <div className="db-order-total-price">
                          <span>Total Paid: <strong>₹{order.total_price}</strong></span>
                        </div>
                        <div className="db-order-tracking">
                          {renderOrderStepper(order.status)}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* BOOKINGS TAB */}
          {activeTab === 'bookings' && (
            <div className="dashboard-tab-card glass">
              <h3>Service & Makeover Reservations</h3>
              <p className="tab-subtitle">Manage beauty makeover schedules, tailor visits, and appointment statuses.</p>

              {loadingHistory ? (
                <div className="db-loading flex-center"><div className="loading-spinner"></div></div>
              ) : (
                <div className="bookings-subsections-container">
                  {/* Subsection 1: Standard Service Bookings */}
                  <div className="bookings-sub-group">
                    <h4>Tailoring & Beautician Appointments</h4>
                    {bookings.length === 0 ? (
                      <p className="sub-empty-msg">No standard tailoring appointments registered.</p>
                    ) : (
                      <div className="bookings-list-grid">
                        {bookings.map((b) => (
                          <div className="booking-log-card" key={b.id}>
                            <div className="b-log-header">
                              <h5>{b.service_title}</h5>
                              <span className={`badge status-${b.status.toLowerCase()}`}>{b.status}</span>
                            </div>
                            <div className="b-log-body">
                              <p className="log-detail flex-center"><Calendar size={14} /> {b.booking_date}</p>
                              <p className="log-detail flex-center"><Clock size={14} /> {b.booking_time}</p>
                              {b.designer_name && <p className="log-detail">Stylist: <strong>{b.designer_name}</strong></p>}
                              {b.notes && <p className="log-notes">Note: "{b.notes}"</p>}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Subsection 2: Home Measurement Bookings */}
                  <div className="bookings-sub-group">
                    <h4>Home Measurement Appointments</h4>
                    {measurementBookings.length === 0 ? (
                      <p className="sub-empty-msg">No home measurement bookings registered.</p>
                    ) : (
                      <div className="bookings-list-grid">
                        {measurementBookings.map((b) => (
                          <div className="booking-log-card" key={b.id}>
                            <div className="b-log-header">
                              <h5>Home Visit Specialist</h5>
                              <span className={`badge status-${b.status.toLowerCase()}`}>{b.status}</span>
                            </div>
                            <div className="b-log-body">
                              <p className="log-detail flex-center"><Calendar size={14} /> {b.booking_date}</p>
                              <p className="log-detail flex-center"><Clock size={14} /> {b.time_slot}</p>
                              <p className="log-detail flex-center"><User size={14} /> {b.address}</p>
                              {b.coordinates && <p className="log-coords">GPS: {b.coordinates}</p>}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Subsection 3: Makeup Bookings */}
                  <div className="bookings-sub-group">
                    <h4>Makeup Artist Bookings</h4>
                    {makeupBookings.length === 0 ? (
                      <p className="sub-empty-msg">No heavy bridal makeup appointments booked.</p>
                    ) : (
                      <div className="bookings-list-grid">
                        {makeupBookings.map((b) => (
                          <div className="booking-log-card" key={b.id}>
                            <div className="b-log-header">
                              <h5>{b.event_type.toUpperCase()} Makeover</h5>
                              <span className={`badge status-${b.status.toLowerCase()}`}>{b.status}</span>
                            </div>
                            <div className="b-log-body">
                              <p className="log-detail flex-center"><Calendar size={14} /> {b.date}</p>
                              <p className="log-detail flex-center"><Clock size={14} /> {b.time}</p>
                              <p className="log-detail">Artist: <strong>{b.artist_name}</strong></p>
                              <p className="log-detail">Venue: {b.venue}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* MEASUREMENTS TAB */}
          {activeTab === 'measurements' && (
            <div className="dashboard-tab-card glass">
              <h3>Custom Tailoring Measurements</h3>
              <p className="tab-subtitle">Save your sizing data. Our master tailors will use these profiles to stitch outfits perfectly.</p>

              {measSuccessMsg && <div className="db-success-banner flex-center"><ShieldCheck /> {measSuccessMsg}</div>}

              <form onSubmit={handleUpdateMeasurements} className="measurements-edit-form">
                <div className="measurements-grid">
                  <div className="form-group">
                    <label className="form-label">Shoulder (Inches)</label>
                    <input
                      type="number"
                      step="0.1"
                      min="0"
                      value={shoulder}
                      onChange={(e) => setShoulder(e.target.value)}
                      className="form-input"
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Bust / Chest (Inches)</label>
                    <input
                      type="number"
                      step="0.1"
                      min="0"
                      value={bust}
                      onChange={(e) => setBust(e.target.value)}
                      className="form-input"
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Waist Size (Inches)</label>
                    <input
                      type="number"
                      step="0.1"
                      min="0"
                      value={waist}
                      onChange={(e) => setWaist(e.target.value)}
                      className="form-input"
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Hips (Inches)</label>
                    <input
                      type="number"
                      step="0.1"
                      min="0"
                      value={hips}
                      onChange={(e) => setHips(e.target.value)}
                      className="form-input"
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Sleeve / Arm Length (Inches)</label>
                    <input
                      type="number"
                      step="0.1"
                      min="0"
                      value={armLength}
                      onChange={(e) => setArmLength(e.target.value)}
                      className="form-input"
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Total Outwear Length (Inches)</label>
                    <input
                      type="number"
                      step="0.1"
                      min="0"
                      value={totalLength}
                      onChange={(e) => setTotalLength(e.target.value)}
                      className="form-input"
                    />
                  </div>
                </div>

                <button type="submit" className="btn btn-primary margin-top">
                  Save Sizing Profile
                </button>
              </form>
            </div>
          )}

          {/* PROFILE TAB */}
          {activeTab === 'profile' && (
            <div className="dashboard-tab-card glass">
              <h3>Manage Profile Details</h3>
              <p className="tab-subtitle">Update your personal contact details and residential address.</p>

              {profileSuccessMsg && <div className="db-success-banner flex-center"><CheckCircle /> {profileSuccessMsg}</div>}

              <form onSubmit={handleUpdateProfile} className="profile-edit-form">
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
                  <label className="form-label">Phone Number</label>
                  <input
                    type="tel"
                    required
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="form-input"
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Profile Avatar SVG Seed</label>
                  <input
                    type="text"
                    value={profilePic}
                    onChange={(e) => setProfilePic(e.target.value)}
                    className="form-input"
                    placeholder="Enter seed for avatar"
                  />
                  <span className="helper-text text-muted">Using Dicebear Avataaars generator seed.</span>
                </div>

                <div className="form-group">
                  <label className="form-label">Default Shipping Street Address</label>
                  <textarea
                    rows="3"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    className="form-input"
                  ></textarea>
                </div>

                <div className="grid-cols-2">
                  <div className="form-group">
                    <label className="form-label">City</label>
                    <input
                      type="text"
                      value={city}
                      onChange={(e) => setCity(e.target.value)}
                      className="form-input"
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Pincode</label>
                    <input
                      type="text"
                      value={pincode}
                      onChange={(e) => setPincode(e.target.value)}
                      className="form-input"
                    />
                  </div>
                </div>

                <button type="submit" className="btn btn-primary margin-top">
                  Update Account Details
                </button>
              </form>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
