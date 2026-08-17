import React, { useState, useEffect } from 'react';
import { LayoutDashboard, ShoppingCart, Calendar, Scissors, Box, TrendingUp, Users, DollarSign, Check, X, Edit, Trash, Plus } from 'lucide-react';
import { useAuth } from '../context/AppContext';

export default function Admin() {
  const { user, apiFetch } = useAuth();
  
  // Tabs: overview, orders, bookings, services, products
  const [activeTab, setActiveTab] = useState('overview');

  // Overview stats states
  const [stats, setStats] = useState(null);
  
  // Management lists states
  const [orders, setOrders] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [measBookings, setMeasBookings] = useState([]);
  const [makeupBookings, setMakeupBookings] = useState([]);
  const [services, setServices] = useState([]);
  const [products, setProducts] = useState([]);
  const [designers, setDesigners] = useState([]);

  // Loading and alerts
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState('');

  // CRUD Forms States
  const [showServiceForm, setShowServiceForm] = useState(false);
  const [editingServiceId, setEditingServiceId] = useState(null);
  const [serviceTitle, setServiceTitle] = useState('');
  const [serviceCategory, setServiceCategory] = useState('Stitching');
  const [serviceDesc, setServiceDesc] = useState('');
  const [servicePrice, setServicePrice] = useState('');
  const [serviceDesignerId, setServiceDesignerId] = useState('');
  const [serviceImage, setServiceImage] = useState('');

  const [showProductForm, setShowProductForm] = useState(false);
  const [editingProductId, setEditingProductId] = useState(null);
  const [productName, setProductName] = useState('');
  const [productCategory, setProductCategory] = useState('Tailor Machine Products');
  const [productDesc, setProductDesc] = useState('');
  const [productPrice, setProductPrice] = useState('');
  const [productQty, setProductQty] = useState('');
  const [productImage, setProductImage] = useState('');

  // Fetch admin logs
  const loadAdminData = async () => {
    setLoading(true);
    setMsg('');
    try {
      if (activeTab === 'overview') {
        const statsData = await apiFetch('/admin/stats');
        setStats(statsData);
      } else if (activeTab === 'orders') {
        const ordersData = await apiFetch('/admin/orders');
        setOrders(ordersData);
      } else if (activeTab === 'bookings') {
        const [bookingsData, measData, makeupData] = await Promise.all([
          apiFetch('/admin/bookings'),
          apiFetch('/admin/measurement-bookings'),
          apiFetch('/admin/makeup-bookings')
        ]);
        setBookings(bookingsData);
        setMeasBookings(measData);
        setMakeupBookings(makeupData);
      } else if (activeTab === 'services') {
        const [servicesData, designersData] = await Promise.all([
          fetch('http://localhost:5000/api/services').then(r => r.json()),
          fetch('http://localhost:5000/api/designers').then(r => r.json())
        ]);
        setServices(servicesData);
        setDesigners(designersData);
      } else if (activeTab === 'products') {
        const productsData = await fetch('http://localhost:5000/api/products').then(r => r.json());
        setProducts(productsData);
      }
    } catch (err) {
      console.error(err);
      setMsg('Failed to load admin panel data: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAdminData();
  }, [activeTab]);

  // Order status updating
  const handleUpdateOrderStatus = async (orderId, newStatus) => {
    try {
      await apiFetch(`/admin/orders/${orderId}`, {
        method: 'PUT',
        body: JSON.stringify({ status: newStatus })
      });
      loadAdminData();
      setMsg('Order status updated successfully');
    } catch (err) {
      alert(err.message);
    }
  };

  // Booking status updating
  const handleUpdateBookingStatus = async (bookingId, type, newStatus) => {
    try {
      let endpoint = `/admin/bookings/${bookingId}`;
      if (type === 'measurement') {
        endpoint = `/admin/measurement-bookings/${bookingId}`;
      } else if (type === 'makeup') {
        endpoint = `/admin/makeup-bookings/${bookingId}`;
      }

      await apiFetch(endpoint, {
        method: 'PUT',
        body: JSON.stringify({ status: newStatus })
      });
      loadAdminData();
      setMsg('Reservation status updated');
    } catch (err) {
      alert(err.message);
    }
  };

  // Service CRUD handlers
  const handleServiceSubmit = async (e) => {
    e.preventDefault();
    const payload = {
      title: serviceTitle,
      category: serviceCategory,
      description: serviceDesc,
      price: parseFloat(servicePrice),
      designer_id: serviceDesignerId ? parseInt(serviceDesignerId) : null,
      image_url: serviceImage || 'https://images.unsplash.com/photo-1610030469983-98e550d6193c?w=500'
    };

    try {
      if (editingServiceId) {
        await apiFetch(`/admin/services/${editingServiceId}`, {
          method: 'PUT',
          body: JSON.stringify(payload)
        });
      } else {
        await apiFetch('/admin/services', {
          method: 'POST',
          body: JSON.stringify(payload)
        });
      }
      resetServiceForm();
      loadAdminData();
      setMsg('Service saved successfully');
    } catch (err) {
      alert(err.message);
    }
  };

  const resetServiceForm = () => {
    setShowServiceForm(false);
    setEditingServiceId(null);
    setServiceTitle('');
    setServiceCategory('Stitching');
    setServiceDesc('');
    setServicePrice('');
    setServiceDesignerId('');
    setServiceImage('');
  };

  const handleEditService = (s) => {
    setEditingServiceId(s.id);
    setServiceTitle(s.title);
    setServiceCategory(s.category);
    setServiceDesc(s.description);
    setServicePrice(s.price);
    setServiceDesignerId(s.designer_id || '');
    setServiceImage(s.image_url);
    setShowServiceForm(true);
  };

  const handleDeleteService = async (sId) => {
    if (!window.confirm('Are you sure you want to delete this service profile?')) return;
    try {
      await apiFetch(`/admin/services/${sId}`, { method: 'DELETE' });
      loadAdminData();
      setMsg('Service profile deleted');
    } catch (err) {
      alert(err.message);
    }
  };

  // Product CRUD handlers
  const handleProductSubmit = async (e) => {
    e.preventDefault();
    const payload = {
      name: productName,
      category: productCategory,
      description: productDesc,
      price: parseFloat(productPrice),
      quantity: parseInt(productQty),
      image_url: productImage || 'https://images.unsplash.com/photo-1544816155-12df9643f363?w=500'
    };

    try {
      if (editingProductId) {
        await apiFetch(`/admin/products/${editingProductId}`, {
          method: 'PUT',
          body: JSON.stringify(payload)
        });
      } else {
        await apiFetch('/admin/products', {
          method: 'POST',
          body: JSON.stringify(payload)
        });
      }
      resetProductForm();
      loadAdminData();
      setMsg('Product item catalogued successfully');
    } catch (err) {
      alert(err.message);
    }
  };

  const resetProductForm = () => {
    setShowProductForm(false);
    setEditingProductId(null);
    setProductName('');
    setProductCategory('Tailor Machine Products');
    setProductDesc('');
    setProductPrice('');
    setProductQty('');
    setProductImage('');
  };

  const handleEditProduct = (p) => {
    setEditingProductId(p.id);
    setProductName(p.name);
    setProductCategory(p.category);
    setProductDesc(p.description);
    setProductPrice(p.price);
    setProductQty(p.quantity);
    setProductImage(p.image_url);
    setShowProductForm(true);
  };

  const handleDeleteProduct = async (pId) => {
    if (!window.confirm('Delete this product entry from inventory?')) return;
    try {
      await apiFetch(`/admin/products/${pId}`, { method: 'DELETE' });
      loadAdminData();
      setMsg('Product item deleted');
    } catch (err) {
      alert(err.message);
    }
  };

  return (
    <div className="admin-container container">
      {/* Admin Title Bar */}
      <section className="admin-header-bar flex-center animate-fade-up">
        <h2>Mahathi Backoffice Management</h2>
        <span className="badge badge-accent">Admin Module active</span>
      </section>

      {msg && <div className="admin-alert-banner text-center">{msg}</div>}

      <div className="admin-layout-grid">
        {/* Left Side: Navigation Links */}
        <aside className="admin-nav-sidebar glass animate-fade-up">
          <ul className="admin-menu-list">
            <li>
              <button 
                className={`admin-menu-item ${activeTab === 'overview' ? 'active' : ''}`}
                onClick={() => setActiveTab('overview')}
              >
                <LayoutDashboard size={18} /> Overview Stats
              </button>
            </li>
            <li>
              <button 
                className={`admin-menu-item ${activeTab === 'orders' ? 'active' : ''}`}
                onClick={() => setActiveTab('orders')}
              >
                <ShoppingCart size={18} /> Manage Orders
              </button>
            </li>
            <li>
              <button 
                className={`admin-menu-item ${activeTab === 'bookings' ? 'active' : ''}`}
                onClick={() => setActiveTab('bookings')}
              >
                <Calendar size={18} /> Manage Reservations
              </button>
            </li>
            <li>
              <button 
                className={`admin-menu-item ${activeTab === 'services' ? 'active' : ''}`}
                onClick={() => setActiveTab('services')}
              >
                <Scissors size={18} /> Services CRUD
              </button>
            </li>
            <li>
              <button 
                className={`admin-menu-item ${activeTab === 'products' ? 'active' : ''}`}
                onClick={() => setActiveTab('products')}
              >
                <Box size={18} /> Products CRUD
              </button>
            </li>
          </ul>
        </aside>

        {/* Right Side: Main display content */}
        <main className="admin-main-section animate-fade-up">
          {loading ? (
            <div className="admin-loading flex-center"><div className="loading-spinner"></div></div>
          ) : (
            <>
              {/* OVERVIEW PANEL */}
              {activeTab === 'overview' && stats && (
                <div className="admin-tab-view">
                  <div className="grid-cols-4 stats-widgets-grid">
                    <div className="stat-widget glass">
                      <div className="widget-header">
                        <DollarSign />
                        <span>Sales Volume</span>
                      </div>
                      <h3>₹{stats.metrics.totalSales}</h3>
                    </div>

                    <div className="stat-widget glass">
                      <div className="widget-header">
                        <ShoppingCart />
                        <span>Total Orders</span>
                      </div>
                      <h3>{stats.metrics.totalOrders}</h3>
                    </div>

                    <div className="stat-widget glass">
                      <div className="widget-header">
                        <Calendar />
                        <span>Bookings</span>
                      </div>
                      <h3>{stats.metrics.totalBookings}</h3>
                    </div>

                    <div className="stat-widget glass">
                      <div className="widget-header">
                        <Users />
                        <span>Customers</span>
                      </div>
                      <h3>{stats.metrics.totalCustomers}</h3>
                    </div>
                  </div>

                  <div className="overview-tables-row grid-cols-2">
                    <div className="admin-data-card glass">
                      <h4>Recent Order Placements</h4>
                      <table className="admin-table">
                        <thead>
                          <tr>
                            <th>Order No</th>
                            <th>Customer</th>
                            <th>Amount</th>
                            <th>Status</th>
                          </tr>
                        </thead>
                        <tbody>
                          {stats.recentSales.map((s) => (
                            <tr key={s.id}>
                              <td>{s.order_number}</td>
                              <td>{s.customer_name}</td>
                              <td>₹{s.total_price}</td>
                              <td><span className={`badge status-${s.status.toLowerCase()}`}>{s.status}</span></td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>

                    <div className="admin-data-card glass">
                      <h4>Recent Booking Reservations</h4>
                      <table className="admin-table">
                        <thead>
                          <tr>
                            <th>Service</th>
                            <th>Customer</th>
                            <th>Date</th>
                            <th>Status</th>
                          </tr>
                        </thead>
                        <tbody>
                          {stats.bookingTrends.map((bt) => (
                            <tr key={bt.id}>
                              <td>{bt.service_title.substring(0, 15)}...</td>
                              <td>{bt.customer_name}</td>
                              <td>{bt.booking_date}</td>
                              <td><span className={`badge status-${bt.status.toLowerCase()}`}>{bt.status}</span></td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}

              {/* ORDERS MANAGEMENT */}
              {activeTab === 'orders' && (
                <div className="admin-tab-view admin-data-card glass">
                  <h3>Fulfillment Order Manager</h3>
                  <table className="admin-table full-width">
                    <thead>
                      <tr>
                        <th>Order Ref</th>
                        <th>Customer Details</th>
                        <th>Total Price</th>
                        <th>Delivery Date</th>
                        <th>Status</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {orders.map((o) => (
                        <tr key={o.id}>
                          <td>
                            <strong>{o.order_number}</strong>
                            <div className="order-items-sub">
                              {o.items && o.items.map(it => `${it.product_name || it.service_title} (x${it.quantity})`).join(', ')}
                            </div>
                          </td>
                          <td>
                            <div>{o.customer_name}</div>
                            <div className="sub-text text-muted">{o.customer_phone}</div>
                          </td>
                          <td>₹{o.total_price}</td>
                          <td>{o.delivery_date}</td>
                          <td>
                            <span className={`badge status-${o.status.toLowerCase()}`}>{o.status}</span>
                          </td>
                          <td>
                            <select 
                              value={o.status} 
                              onChange={(e) => handleUpdateOrderStatus(o.id, e.target.value)}
                              className="form-input table-select"
                            >
                              <option value="pending">Pending</option>
                              <option value="confirmed">Confirmed</option>
                              <option value="completed">Completed</option>
                              <option value="delivered">Delivered</option>
                              <option value="cancelled">Cancelled</option>
                            </select>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {/* BOOKINGS RESERVATIONS */}
              {activeTab === 'bookings' && (
                <div className="admin-tab-view">
                  {/* Category 1: Standard Bookings */}
                  <div className="admin-data-card glass margin-bottom">
                    <h3>Boutique Tailoring Reservations</h3>
                    <table className="admin-table full-width">
                      <thead>
                        <tr>
                          <th>Service</th>
                          <th>Customer Details</th>
                          <th>Date / Time</th>
                          <th>Status</th>
                          <th>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {bookings.map((b) => (
                          <tr key={b.id}>
                            <td>{b.service_title}</td>
                            <td>{b.customer_name} ({b.customer_phone})</td>
                            <td>{b.booking_date} @ {b.booking_time}</td>
                            <td><span className={`badge status-${b.status.toLowerCase()}`}>{b.status}</span></td>
                            <td>
                              <select 
                                value={b.status} 
                                onChange={(e) => handleUpdateBookingStatus(b.id, 'standard', e.target.value)}
                                className="form-input table-select"
                              >
                                <option value="pending">Pending</option>
                                <option value="confirmed">Confirmed</option>
                                <option value="completed">Completed</option>
                                <option value="cancelled">Cancelled</option>
                              </select>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Category 2: Home Measurements */}
                  <div className="admin-data-card glass margin-bottom">
                    <h3>Home Visit Measurement Bookings</h3>
                    <table className="admin-table full-width">
                      <thead>
                        <tr>
                          <th>Customer</th>
                          <th>Visit Address</th>
                          <th>Date / Slot</th>
                          <th>Status</th>
                          <th>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {measBookings.map((mb) => (
                          <tr key={mb.id}>
                            <td>{mb.customer_name} ({mb.customer_phone})</td>
                            <td>
                              {mb.address}
                              {mb.coordinates && <div className="sub-text text-accent">GPS: {mb.coordinates}</div>}
                            </td>
                            <td>{mb.booking_date} ({mb.time_slot})</td>
                            <td><span className={`badge status-${mb.status.toLowerCase()}`}>{mb.status}</span></td>
                            <td>
                              <select 
                                value={mb.status} 
                                onChange={(e) => handleUpdateBookingStatus(mb.id, 'measurement', e.target.value)}
                                className="form-input table-select"
                              >
                                <option value="pending">Pending</option>
                                <option value="assigned">Assigned</option>
                                <option value="completed">Completed</option>
                                <option value="cancelled">Cancelled</option>
                              </select>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Category 3: Makeup Bookings */}
                  <div className="admin-data-card glass">
                    <h3>Makeup Artist Bookings</h3>
                    <table className="admin-table full-width">
                      <thead>
                        <tr>
                          <th>Artist</th>
                          <th>Customer / Event</th>
                          <th>Venue</th>
                          <th>Date / Time</th>
                          <th>Status</th>
                          <th>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {makeupBookings.map((mb) => (
                          <tr key={mb.id}>
                            <td>{mb.artist_name}</td>
                            <td>{mb.customer_name} ({mb.event_type.toUpperCase()})</td>
                            <td>{mb.venue}</td>
                            <td>{mb.date} @ {mb.time}</td>
                            <td><span className={`badge status-${mb.status.toLowerCase()}`}>{mb.status}</span></td>
                            <td>
                              <select 
                                value={mb.status} 
                                onChange={(e) => handleUpdateBookingStatus(mb.id, 'makeup', e.target.value)}
                                className="form-input table-select"
                              >
                                <option value="pending">Pending</option>
                                <option value="confirmed">Confirmed</option>
                                <option value="completed">Completed</option>
                                <option value="cancelled">Cancelled</option>
                              </select>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* SERVICES CRUD */}
              {activeTab === 'services' && (
                <div className="admin-tab-view">
                  <div className="admin-sub-header flex-center">
                    <h3>Service Catalog Profiles</h3>
                    <button className="btn btn-primary btn-sm flex-center" onClick={() => setShowServiceForm(true)}>
                      <Plus size={16} /> Add Service Profile
                    </button>
                  </div>

                  {showServiceForm && (
                    <div className="crud-form-box glass animate-fade-up">
                      <h4>{editingServiceId ? 'Edit Service Profile' : 'Create New Service Profile'}</h4>
                      <form onSubmit={handleServiceSubmit}>
                        <div className="grid-cols-2">
                          <div className="form-group">
                            <label className="form-label">Service Title</label>
                            <input type="text" required value={serviceTitle} onChange={(e) => setServiceTitle(e.target.value)} className="form-input" />
                          </div>
                          <div className="form-group">
                            <label className="form-label">Category</label>
                            <select value={serviceCategory} onChange={(e) => setServiceCategory(e.target.value)} className="form-input">
                              <option value="Stitching">Stitching Services</option>
                              <option value="Aari Work">Aari Work Designs</option>
                              <option value="Beautician Services">Beautician Services</option>
                              <option value="Makeup Booking">Makeup Booking</option>
                              <option value="Home Measurement">Home Measurement</option>
                            </select>
                          </div>
                        </div>

                        <div className="form-group">
                          <label className="form-label">Description</label>
                          <textarea rows="3" required value={serviceDesc} onChange={(e) => setServiceDesc(e.target.value)} className="form-input"></textarea>
                        </div>

                        <div className="grid-cols-3">
                          <div className="form-group">
                            <label className="form-label">Reserve Price (INR)</label>
                            <input type="number" required value={servicePrice} onChange={(e) => setServicePrice(e.target.value)} className="form-input" />
                          </div>
                          <div className="form-group">
                            <label className="form-label">Assigned Designer / Stylist</label>
                            <select value={serviceDesignerId} onChange={(e) => setServiceDesignerId(e.target.value)} className="form-input">
                              <option value="">None</option>
                              {designers.map(d => <option key={d.id} value={d.id}>{d.name} ({d.specialization})</option>)}
                            </select>
                          </div>
                          <div className="form-group">
                            <label className="form-label">Image URL</label>
                            <input type="text" value={serviceImage} onChange={(e) => setServiceImage(e.target.value)} className="form-input" placeholder="https://..." />
                          </div>
                        </div>

                        <div className="form-buttons-row">
                          <button type="submit" className="btn btn-primary">{editingServiceId ? 'Update Service' : 'Add Service'}</button>
                          <button type="button" className="btn btn-secondary" onClick={resetServiceForm}>Cancel</button>
                        </div>
                      </form>
                    </div>
                  )}

                  <table className="admin-table full-width">
                    <thead>
                      <tr>
                        <th>Image</th>
                        <th>Title / Category</th>
                        <th>Price</th>
                        <th>Stylist</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {services.map((s) => (
                        <tr key={s.id}>
                          <td><img src={s.image_url} alt={s.title} className="table-row-img" /></td>
                          <td>
                            <strong>{s.title}</strong>
                            <div className="sub-text text-muted">{s.category}</div>
                          </td>
                          <td>₹{s.price}</td>
                          <td>{s.designer_name || 'Unassigned'}</td>
                          <td>
                            <button className="btn-table-action" onClick={() => handleEditService(s)} title="Edit"><Edit size={16} /></button>
                            <button className="btn-table-action text-pink" onClick={() => handleDeleteService(s.id)} title="Delete"><Trash size={16} /></button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {/* PRODUCTS CRUD */}
              {activeTab === 'products' && (
                <div className="admin-tab-view">
                  <div className="admin-sub-header flex-center">
                    <h3>Boutique Spares & Material Stocks</h3>
                    <button className="btn btn-primary btn-sm flex-center" onClick={() => setShowProductForm(true)}>
                      <Plus size={16} /> catalogue Item
                    </button>
                  </div>

                  {showProductForm && (
                    <div className="crud-form-box glass animate-fade-up">
                      <h4>{editingProductId ? 'Edit Catalog Item' : 'Add Catalog Item'}</h4>
                      <form onSubmit={handleProductSubmit}>
                        <div className="grid-cols-2">
                          <div className="form-group">
                            <label className="form-label">Item Name</label>
                            <input type="text" required value={productName} onChange={(e) => setProductName(e.target.value)} className="form-input" />
                          </div>
                          <div className="form-group">
                            <label className="form-label">Category</label>
                            <select value={productCategory} onChange={(e) => setProductCategory(e.target.value)} className="form-input">
                              <option value="Tailor Machine Products">Tailor Machine Products</option>
                              <option value="Blouse Stitching Materials">Blouse Stitching Materials</option>
                              <option value="Ready-to-Wear Dresses">Ready-to-Wear Dresses</option>
                            </select>
                          </div>
                        </div>

                        <div className="form-group">
                          <label className="form-label">Description</label>
                          <textarea rows="3" required value={productDesc} onChange={(e) => setProductDesc(e.target.value)} className="form-input"></textarea>
                        </div>

                        <div className="grid-cols-3">
                          <div className="form-group">
                            <label className="form-label">Sales Price (INR)</label>
                            <input type="number" required value={productPrice} onChange={(e) => setProductPrice(e.target.value)} className="form-input" />
                          </div>
                          <div className="form-group">
                            <label className="form-label">Stock Quantity</label>
                            <input type="number" required value={productQty} onChange={(e) => setProductQty(e.target.value)} className="form-input" />
                          </div>
                          <div className="form-group">
                            <label className="form-label">Image URL</label>
                            <input type="text" value={productImage} onChange={(e) => setProductImage(e.target.value)} className="form-input" placeholder="https://..." />
                          </div>
                        </div>

                        <div className="form-buttons-row">
                          <button type="submit" className="btn btn-primary">{editingProductId ? 'Update Item' : 'Add Item'}</button>
                          <button type="button" className="btn btn-secondary" onClick={resetProductForm}>Cancel</button>
                        </div>
                      </form>
                    </div>
                  )}

                  <table className="admin-table full-width">
                    <thead>
                      <tr>
                        <th>Image</th>
                        <th>Item Name / Category</th>
                        <th>Price</th>
                        <th>Stock Qty</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {products.map((p) => (
                        <tr key={p.id}>
                          <td><img src={p.image_url} alt={p.name} className="table-row-img" /></td>
                          <td>
                            <strong>{p.name}</strong>
                            <div className="sub-text text-muted">{p.category}</div>
                          </td>
                          <td>₹{p.price}</td>
                          <td>
                            <span className={`badge ${p.quantity > 5 ? 'badge-secondary' : 'badge-pink'}`}>
                              {p.quantity} left
                            </span>
                          </td>
                          <td>
                            <button className="btn-table-action" onClick={() => handleEditProduct(p)} title="Edit"><Edit size={16} /></button>
                            <button className="btn-table-action text-pink" onClick={() => handleDeleteProduct(p.id)} title="Delete"><Trash size={16} /></button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </>
          )}
        </main>
      </div>
    </div>
  );
}
