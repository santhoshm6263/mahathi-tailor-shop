import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Star, Calendar, Clock, MapPin, Sparkles, Ruler, ArrowLeft, Heart, Shield, Check } from 'lucide-react';
import { useAuth, useCart } from '../context/AppContext';
import LoginModal from '../components/LoginModal';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000';

export default function ServiceDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, apiFetch } = useAuth();
  const { addToCart } = useCart();
  
  // Data States
  const [service, setService] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Booking Form States
  const [bookingDate, setBookingDate] = useState('');
  const [bookingTime, setBookingTime] = useState('');
  const [notes, setNotes] = useState('');
  const [eventType, setEventType] = useState('bridal'); // For makeup
  const [venue, setVenue] = useState(''); // For makeup
  const [address, setAddress] = useState(user?.address || ''); // For home measurement
  const [coordinates, setCoordinates] = useState('12.8712,78.5832'); // Kuppam coords
  const [mapPinned, setMapPinned] = useState(false);

  // Flow control
  const [bookingSuccess, setBookingSuccess] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [bookingLoading, setBookingLoading] = useState(false);

  useEffect(() => {
    async function loadService() {
      setLoading(true);
      setError('');
      try {
        const data = await fetch(`${API_BASE}/api/services/${id}`).then(r => r.json());
        if (data.message && data.message.includes('not found')) {
          setError('Service profile not found.');
        } else {
          setService(data);
        }
      } catch (err) {
        setError('Failed to load service details. Make sure the API server is active.');
      } finally {
        setLoading(false);
      }
    }
    loadService();
  }, [id]);

  const handleBookingSubmit = async (e) => {
    e.preventDefault();
    if (!user) {
      setShowLoginModal(true);
      return;
    }
    
    setBookingLoading(true);
    try {
      if (service.category === 'Home Measurement') {
        await apiFetch('/measurement-bookings', {
          method: 'POST',
          body: JSON.stringify({
            booking_date: bookingDate,
            time_slot: bookingTime,
            address,
            notes,
            coordinates: mapPinned ? coordinates : ''
          })
        });
      } else if (service.category === 'Makeup Booking') {
        await apiFetch('/makeup-bookings', {
          method: 'POST',
          body: JSON.stringify({
            makeup_artist_id: service.designer_id,
            event_type: eventType,
            date: bookingDate,
            time: bookingTime,
            venue
          })
        });
      } else {
        // Standard service booking
        await apiFetch('/bookings', {
          method: 'POST',
          body: JSON.stringify({
            service_id: service.id,
            booking_date: bookingDate,
            booking_time: bookingTime,
            notes
          })
        });
      }
      setBookingSuccess(true);
    } catch (err) {
      alert(err.message || 'Failed to submit booking reservation.');
    } finally {
      setBookingLoading(false);
    }
  };

  const handleAddToCartDirect = () => {
    addToCart(service, 'service');
    // Open a toast or navigate to catalog
    alert(`${service.title} has been added to your cart for direct checkout.`);
  };

  const handleSimulatePinMap = () => {
    setMapPinned(true);
    setCoordinates('12.8715,78.5835'); // Shift slightly
  };

  if (loading) {
    return (
      <div className="container service-detail-loading flex-center">
        <div className="loading-spinner"></div>
        <p>Loading service details...</p>
      </div>
    );
  }

  if (error || !service) {
    return (
      <div className="container service-detail-error text-center">
        <h2>Error Loading Service</h2>
        <p>{error || 'Service not found.'}</p>
        <Link to="/catalog" className="btn btn-primary margin-top">Back to Catalog</Link>
      </div>
    );
  }

  return (
    <div className="service-detail-container container animate-fade-up">
      <Link to="/catalog" className="back-link flex-center"><ArrowLeft size={16} /> Back to Catalog</Link>

      <div className="service-main-layout">
        {/* Left Side: Service Details & Reviews */}
        <div className="service-info-column">
          <div className="service-info-card glass">
            <img src={service.image_url} alt={service.title} className="service-hero-img" />
            <div className="service-info-body">
              <span className="badge badge-primary">{service.category}</span>
              <h2>{service.title}</h2>
              <div className="service-rating-row">
                <div className="card-rating">
                  <Star size={16} fill="var(--accent)" stroke="var(--accent)" />
                  <span>{service.rating} (12 reviews)</span>
                </div>
                <span className="divider">•</span>
                <span className="starting-price-label">Starting Price: <strong>₹{service.price}</strong></span>
              </div>
              <p className="service-description-long">{service.description}</p>
              
              <div className="service-features-grid grid-cols-2">
                <div className="feature-bullet flex-center"><Shield size={16} /> 100% Fit Guarantee</div>
                <div className="feature-bullet flex-center"><Sparkles size={16} /> Professional Designers Only</div>
                <div className="feature-bullet flex-center"><Clock size={16} /> Completed Within 7 Working Days</div>
                <div className="feature-bullet flex-center"><Ruler size={16} /> Custom Measurement Logging</div>
              </div>
            </div>
          </div>

          {/* Designer Profile Card */}
          {service.designer_name && (
            <div className="designer-profile-card glass">
              <h3 className="section-title">Assigned Stylist / Designer</h3>
              <div className="designer-details-row">
                <img src={service.designer_image || 'https://api.dicebear.com/7.x/initials/svg?seed=' + service.designer_name} alt={service.designer_name} className="designer-avatar" />
                <div className="designer-bio-info">
                  <h4>{service.designer_name}</h4>
                  <span className="designer-spec">{service.designer_specialization}</span>
                  <p>{service.designer_bio}</p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Right Side: Booking Panel */}
        <div className="booking-panel-column">
          {bookingSuccess ? (
            <div className="booking-success-card glass text-center animate-fade-up">
              <div className="success-icon-wrapper flex-center">
                <Check size={36} />
              </div>
              <h2>Booking Reserved!</h2>
              <p>Your request has been successfully registered. You can track this booking and communicate details from your dashboard profile.</p>
              <div className="action-buttons-stack">
                <Link to="/dashboard" className="btn btn-primary btn-block">Go to My Dashboard</Link>
                <button className="btn btn-secondary btn-block" onClick={() => setBookingSuccess(false)}>Book Another Service</button>
              </div>
            </div>
          ) : (
            <div className="booking-form-card glass">
              <h3>Reserve Service Slot</h3>
              <p className="booking-form-subtitle">Pick your preferred slot. A designer will confirm availability.</p>
              
              <form onSubmit={handleBookingSubmit}>
                {/* 1. Pick Date */}
                <div className="form-group">
                  <label className="form-label flex-center"><Calendar size={16} /> Date Selection</label>
                  <input
                    type="date"
                    required
                    min={new Date().toISOString().split('T')[0]}
                    value={bookingDate}
                    onChange={(e) => setBookingDate(e.target.value)}
                    className="form-input"
                  />
                </div>

                {/* 2. Pick Slot */}
                <div className="form-group">
                  <label className="form-label flex-center"><Clock size={16} /> Time Slot</label>
                  <select
                    required
                    value={bookingTime}
                    onChange={(e) => setBookingTime(e.target.value)}
                    className="form-input"
                  >
                    <option value="">Select a slot</option>
                    {service.available_slots && service.available_slots.map((slot) => (
                      <option key={slot} value={slot}>{slot}</option>
                    ))}
                    {!service.available_slots || service.available_slots.length === 0 && (
                      <>
                        <option value="09:00 AM">09:00 AM</option>
                        <option value="11:00 AM">11:00 AM</option>
                        <option value="02:00 PM">02:00 PM</option>
                        <option value="04:00 PM">04:00 PM</option>
                      </>
                    )}
                  </select>
                </div>

                {/* Conditional Form Fields - Home Measurement */}
                {service.category === 'Home Measurement' && (
                  <div className="conditional-fields">
                    <div className="form-group">
                      <label className="form-label flex-center"><MapPin size={16} /> Home Visit Address</label>
                      <textarea
                        required
                        rows="3"
                        placeholder="Enter full residential address in Kuppam/Mallanur area"
                        value={address}
                        onChange={(e) => setAddress(e.target.value)}
                        className="form-input"
                      ></textarea>
                    </div>

                    <div className="form-group map-simulator-box">
                      <label className="form-label">Pin Location (Simulated GPS mapping)</label>
                      <div className="mock-map-canvas flex-center">
                        <MapPin size={24} className={mapPinned ? 'pinned animate-pulse' : 'unpinned'} />
                        <span className="map-coord-text">{mapPinned ? `Pinned at Kuppam: ${coordinates}` : 'Click below to drop GPS coordinates'}</span>
                      </div>
                      <button
                        type="button"
                        className="btn btn-secondary btn-sm btn-block"
                        onClick={handleSimulatePinMap}
                      >
                        {mapPinned ? 'GPS Pinned' : 'Fetch Current GPS Coordinates'}
                      </button>
                    </div>
                  </div>
                )}

                {/* Conditional Form Fields - Makeup Booking */}
                {service.category === 'Makeup Booking' && (
                  <div className="conditional-fields">
                    <div className="form-group">
                      <label className="form-label">Makeover Event Type</label>
                      <select
                        value={eventType}
                        onChange={(e) => setEventType(e.target.value)}
                        className="form-input"
                      >
                        <option value="bridal">Traditional South Indian Bridal</option>
                        <option value="reception">Reception / Fancy Makeup</option>
                        <option value="party">Party / Event Hair & Makeup</option>
                        <option value="guest">Guest Makeover Package</option>
                      </select>
                    </div>

                    <div className="form-group">
                      <label className="form-label flex-center"><MapPin size={16} /> Event Venue Address</label>
                      <textarea
                        required
                        rows="3"
                        placeholder="Enter marriage hall, temple, or residence address where makeover is needed"
                        value={venue}
                        onChange={(e) => setVenue(e.target.value)}
                        className="form-input"
                      ></textarea>
                    </div>
                  </div>
                )}

                {/* 3. Notes */}
                <div className="form-group">
                  <label className="form-label font-semibold">Special Instructions (Optional)</label>
                  <textarea
                    rows="3"
                    placeholder="Enter style preference details, blouse pattern selection, or cosmetic brand constraints..."
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    className="form-input"
                  ></textarea>
                </div>

                <div className="booking-price-summary">
                  <span>Booking Reserve Price</span>
                  <span className="bold-price">₹{service.price}</span>
                </div>

                <button
                  type="submit"
                  disabled={bookingLoading}
                  className="btn btn-primary btn-block reserve-btn flex-center"
                >
                  {bookingLoading ? 'Processing Booking...' : 'Reserve Booking Slot'}
                </button>
                
                {service.category !== 'Home Measurement' && (
                  <button
                    type="button"
                    onClick={handleAddToCartDirect}
                    className="btn btn-secondary btn-block add-to-cart-direct-btn"
                  >
                    Add Service to Cart
                  </button>
                )}
              </form>
            </div>
          )}
        </div>
      </div>

      {showLoginModal && <LoginModal onClose={() => setShowLoginModal(false)} />}
    </div>
  );
}
