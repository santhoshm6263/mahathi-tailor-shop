import React from 'react';
import { Link } from 'react-router-dom';
import { Scissors, Sparkles, MapPin, Ruler, Shield, Star, Heart, ArrowRight } from 'lucide-react';

export default function Home() {
  const featured = [
    {
      id: 1,
      title: "Bridal Silk Blouse Stitching",
      category: "Stitching Services",
      price: "1,500",
      rating: 4.9,
      image: "https://images.unsplash.com/photo-1610030469983-98e550d6193c?w=500&auto=format&fit=crop&q=60"
    },
    {
      id: 3,
      title: "Heavy Bridal Aari Embroidery",
      category: "Aari Work Designs",
      price: "4,500",
      rating: 4.9,
      image: "https://images.unsplash.com/photo-1605001011156-cbf0b0f67a51?w=500&auto=format&fit=crop&q=60"
    },
    {
      id: 5,
      title: "Signature South Indian Bridal Makeup",
      category: "Makeup Booking",
      price: "12,000",
      rating: 4.9,
      image: "https://images.unsplash.com/photo-1601004890684-d8cbf643f5f2?w=500&auto=format&fit=crop&q=60"
    }
  ];

  const testimonials = [
    {
      name: "Lakshmi Prasanna",
      location: "Kuppam Town",
      review: "The aari embroidery on my wedding blouse was absolutely spectacular. All details were completed strictly on-time. Highly recommended!",
      rating: 5
    },
    {
      name: "Divya Reddy",
      location: "Mallanur",
      review: "Scheduling a home measurement visit was so easy. The designer arrived right on time, measured perfectly, and the fit of my lehenga was outstanding.",
      rating: 5
    },
    {
      name: "Sarah Banu",
      location: "Kuppam Rural",
      review: "Meera is an incredible makeup artist. She did my reception makeover and I received so many compliments! Standard products only.",
      rating: 5
    }
  ];

  return (
    <div className="home-container">
      {/* Hero Section */}
      <section className="hero-section flex-center">
        <div className="hero-overlay"></div>
        <div className="container hero-content text-center">
          <span className="hero-subtitle badge badge-pink animate-fade-up">Fresh Every Morning</span>
          <h1 className="hero-title animate-fade-up">Crafting Elegance & Custom Styling For You</h1>
          <p className="hero-desc animate-fade-up">Premium customized stitching, traditional Aari embroidery, ready-to-wear girls' clothing, and professional makeup artistry—designed for your special moments.</p>
          <div className="hero-ctas animate-fade-up">
            <Link to="/catalog" className="btn btn-primary btn-lg">Explore Services & Shop</Link>
            <Link to="/catalog?category=Home%20Measurement" className="btn btn-secondary btn-lg">Book Home Measurement</Link>
          </div>
        </div>
      </section>

      {/* Core Advantages */}
      <section className="advantages-section container">
        <div className="section-header text-center">
          <h2>Why Choose Mahathi Boutique?</h2>
          <p>Delivering high-end customization right to your doorstep in Mallanur & Kuppam.</p>
        </div>
        <div className="grid-cols-4 advantage-grid">
          <div className="advantage-card text-center">
            <div className="advantage-icon-wrapper flex-center">
              <Scissors />
            </div>
            <h3>Custom Fit Stitching</h3>
            <p>Precise measurements matched with highly experienced designers for blouses, suits, and lehengas.</p>
          </div>
          <div className="advantage-card text-center">
            <div className="advantage-icon-wrapper flex-center">
              <Sparkles />
            </div>
            <h3>Heavy Aari Embroidery</h3>
            <p>Hand-crafted zardozi, beadwork, and stone designs on rich Kanchipuram silk blouses.</p>
          </div>
          <div className="advantage-card text-center">
            <div className="advantage-icon-wrapper flex-center">
              <Ruler />
            </div>
            <h3>Home Visits</h3>
            <p>Schedule a tailor appointment to have custom measurements taken in the privacy of your home.</p>
          </div>
          <div className="advantage-card text-center">
            <div className="advantage-icon-wrapper flex-center">
              <Shield />
            </div>
            <h3>Certified Artistry</h3>
            <p>Professional bridal beauticians using premium brand cosmetics for event styling.</p>
          </div>
        </div>
      </section>

      {/* Featured Services */}
      <section className="featured-section">
        <div className="container">
          <div className="featured-header">
            <div>
              <h2>Signature Offerings</h2>
              <p>Selected trending styles and custom service reservations popular this season.</p>
            </div>
            <Link to="/catalog" className="btn btn-ghost flex-center">View Full Catalog <ArrowRight size={16} /></Link>
          </div>

          <div className="grid-cols-3 featured-grid">
            {featured.map((item) => (
              <div className="featured-card glass" key={item.id}>
                <div className="card-image-wrapper">
                  <img src={item.image} alt={item.title} />
                  <span className="card-tag">{item.category}</span>
                </div>
                <div className="card-details">
                  <div className="card-rating">
                    <Star size={16} fill="var(--accent)" stroke="var(--accent)" />
                    <span>{item.rating}</span>
                  </div>
                  <h3>{item.title}</h3>
                  <div className="card-footer-price">
                    <span className="price-tag">Starting from ₹{item.price}</span>
                    <Link to={`/services/${item.id}`} className="btn btn-primary btn-sm">Book Service</Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* In-Home Measurement CTA */}
      <section className="home-meas-cta-section container">
        <div className="meas-cta-card glass">
          <div className="meas-cta-text">
            <span className="badge badge-accent">Home Visit Service</span>
            <h2>Can't Make it to the Shop? We'll Come to You!</h2>
            <p>Schedule a professional designer home visit. We will bring sample patterns, stitching fabrics, and take precise custom measurements right in your home (Kuppam region).</p>
            <div className="meas-steps">
              <div className="meas-step"><MapPin size={18} /> Choose date, time & map location</div>
              <div className="meas-step"><Ruler size={18} /> Our designer visits and records size data</div>
              <div className="meas-step"><Heart size={18} /> Outfits stitched and delivered to your doorstep</div>
            </div>
            <Link to="/catalog?category=Home%20Measurement" className="btn btn-accent">Book Tailor Home Visit (₹250)</Link>
          </div>
          <div className="meas-cta-img-wrapper">
            <img src="https://images.unsplash.com/photo-1551836022-d5d88e9218df?w=600&auto=format&fit=crop&q=80" alt="Tailor taking measurements" />
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="testimonials-section container">
        <div className="section-header text-center">
          <h2>Loved By Our Clients</h2>
          <p>Read honest reviews from customers in Kuppam and surrounding regions.</p>
        </div>
        <div className="grid-cols-3 testimonials-grid">
          {testimonials.map((t, idx) => (
            <div className="testimonial-card glass" key={idx}>
              <div className="t-rating">
                {[...Array(t.rating)].map((_, i) => (
                  <Star key={i} size={16} fill="var(--accent)" stroke="var(--accent)" />
                ))}
              </div>
              <p className="t-review">"{t.review}"</p>
              <div className="t-author">
                <h4>{t.name}</h4>
                <span>{t.location}</span>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
