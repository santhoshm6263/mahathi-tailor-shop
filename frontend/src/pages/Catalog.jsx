import React, { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Search, Star, Filter, ShoppingCart, Calendar } from 'lucide-react';
import { useCart } from '../context/AppContext';

export default function Catalog() {
  const { addToCart } = useCart();
  const [searchParams, setSearchParams] = useSearchParams();
  
  // States
  const [services, setServices] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Filter States
  const [search, setSearch] = useState('');
  const [activeTab, setActiveTab] = useState(searchParams.get('category') || 'All');
  const [viewMode, setViewMode] = useState('all'); // all, services, products
  const [sortBy, setSortBy] = useState('rating'); // rating, price_low, price_high

  // Sync category tab with query param
  useEffect(() => {
    const cat = searchParams.get('category');
    if (cat) {
      setActiveTab(cat);
      // Automatically toggle view mode based on selected category
      if (['Stitching', 'Aari Work', 'Beautician Services', 'Makeup Booking', 'Home Measurement'].includes(cat)) {
        setViewMode('services');
      } else if (['Tailor Machine Products', 'Blouse Stitching Materials', 'Ready-to-Wear Dresses'].includes(cat)) {
        setViewMode('products');
      }
    }
  }, [searchParams]);

  // Fetch Catalog Data
  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      setError('');
      try {
        const [servicesRes, productsRes] = await Promise.all([
          fetch('http://localhost:5000/api/services').then(r => r.json()),
          fetch('http://localhost:5000/api/products').then(r => r.json())
        ]);
        setServices(servicesRes);
        setProducts(productsRes);
      } catch (err) {
        setError('Failed to fetch catalog. Please ensure the backend server is running.');
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  const categories = [
    { name: 'All', count: services.length + products.length },
    { name: 'Stitching', count: services.filter(s => s.category === 'Stitching').length },
    { name: 'Aari Work', count: services.filter(s => s.category === 'Aari Work').length },
    { name: 'Beautician Services', count: services.filter(s => s.category === 'Beautician Services').length },
    { name: 'Makeup Booking', count: services.filter(s => s.category === 'Makeup Booking').length },
    { name: 'Home Measurement', count: services.filter(s => s.category === 'Home Measurement').length },
    { name: 'Ready-to-Wear Dresses', count: products.filter(p => p.category === 'Ready-to-Wear Dresses').length },
    { name: 'Blouse Stitching Materials', count: products.filter(p => p.category === 'Blouse Stitching Materials').length },
    { name: 'Tailor Machine Products', count: products.filter(p => p.category === 'Tailor Machine Products').length }
  ];

  const handleTabChange = (categoryName) => {
    setActiveTab(categoryName);
    if (categoryName === 'All') {
      setViewMode('all');
      setSearchParams({});
    } else {
      setSearchParams({ category: categoryName });
    }
  };

  // Filter and sort computation
  const getFilteredItems = () => {
    let itemsList = [];

    // Add services if applicable
    if (viewMode === 'all' || viewMode === 'services') {
      const mappedServices = services.map(s => ({ ...s, type: 'service' }));
      itemsList = [...itemsList, ...mappedServices];
    }

    // Add products if applicable
    if (viewMode === 'all' || viewMode === 'products') {
      const mappedProducts = products.map(p => ({ ...p, title: p.name, type: 'product' }));
      itemsList = [...itemsList, ...mappedProducts];
    }

    // Filter by Tab/Category
    if (activeTab !== 'All') {
      itemsList = itemsList.filter(item => item.category === activeTab);
    }

    // Filter by Search Query
    if (search.trim()) {
      const q = search.toLowerCase();
      itemsList = itemsList.filter(item => 
        item.title.toLowerCase().includes(q) || 
        (item.description && item.description.toLowerCase().includes(q))
      );
    }

    // Sorting
    itemsList.sort((a, b) => {
      if (sortBy === 'rating') {
        return (b.rating || 5) - (a.rating || 5);
      } else if (sortBy === 'price_low') {
        return a.price - b.price;
      } else if (sortBy === 'price_high') {
        return b.price - a.price;
      }
      return 0;
    });

    return itemsList;
  };

  const filteredItems = getFilteredItems();

  return (
    <div className="catalog-container container">
      {/* Search & Filter Header */}
      <section className="catalog-header animate-fade-up">
        <div className="section-header text-center">
          <h1 className="text-gradient">Our Catalog & Booking Services</h1>
          <p>Browse customize stitching materials, machine spares, ready-to-wear girls outfits, or book personalized tailoring & makeover appointments online.</p>
        </div>

        <div className="filters-bar-wrapper glass">
          <div className="search-box">
            <Search className="search-icon" size={20} />
            <input
              type="text"
              placeholder="Search blouses, aari patterns, makeovers, sewing machine items..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="form-input"
            />
          </div>

          <div className="quick-filters">
            <div className="filter-group-buttons">
              <button 
                className={`filter-btn ${viewMode === 'all' ? 'active' : ''}`}
                onClick={() => setViewMode('all')}
              >
                Show All
              </button>
              <button 
                className={`filter-btn ${viewMode === 'services' ? 'active' : ''}`}
                onClick={() => setViewMode('services')}
              >
                Services
              </button>
              <button 
                className={`filter-btn ${viewMode === 'products' ? 'active' : ''}`}
                onClick={() => setViewMode('products')}
              >
                Products
              </button>
            </div>

            <div className="sort-dropdown-wrapper">
              <Filter size={16} />
              <select 
                value={sortBy} 
                onChange={(e) => setSortBy(e.target.value)}
                className="form-input sort-select"
              >
                <option value="rating">Top Rated</option>
                <option value="price_low">Price: Low to High</option>
                <option value="price_high">Price: High to Low</option>
              </select>
            </div>
          </div>
        </div>
      </section>

      <div className="catalog-content-layout">
        {/* Sidebar Categories */}
        <aside className="catalog-sidebar glass animate-fade-up">
          <h3>Categories</h3>
          <ul className="category-list">
            {categories.map((cat) => (
              <li key={cat.name}>
                <button
                  className={`category-item-btn ${activeTab === cat.name ? 'active' : ''}`}
                  onClick={() => handleTabChange(cat.name)}
                >
                  <span>{cat.name}</span>
                  <span className="count-badge">{cat.count}</span>
                </button>
              </li>
            ))}
          </ul>
        </aside>

        {/* Catalog Items Grid */}
        <main className="catalog-main animate-fade-up">
          {loading ? (
            <div className="catalog-status-msg text-center">
              <div className="loading-spinner"></div>
              <p>Loading items, please wait...</p>
            </div>
          ) : error ? (
            <div className="catalog-status-msg error-msg text-center">
              <p>{error}</p>
            </div>
          ) : filteredItems.length === 0 ? (
            <div className="catalog-status-msg text-center">
              <p>No items match your search/filter criteria.</p>
            </div>
          ) : (
            <div className="grid-cols-3 catalog-grid">
              {filteredItems.map((item) => (
                <div className="catalog-card glass" key={`${item.id}-${item.type}`}>
                  <div className="card-image-wrapper">
                    <img src={item.image_url} alt={item.title} />
                    <span className={`card-type-badge ${item.type === 'service' ? 'badge-primary' : 'badge-secondary'} badge`}>
                      {item.type === 'service' ? 'Service / Booking' : 'Product'}
                    </span>
                  </div>

                  <div className="card-details">
                    <div className="card-meta">
                      <span className="card-cat-name">{item.category}</span>
                      <div className="card-rating">
                        <Star size={14} fill="var(--accent)" stroke="var(--accent)" />
                        <span>{item.rating || '4.8'}</span>
                      </div>
                    </div>

                    <h3 className="card-title">{item.title}</h3>
                    <p className="card-description">{item.description}</p>

                    {item.type === 'service' && item.designer_name && (
                      <div className="designer-tag text-muted">
                        <span>Designer: <strong>{item.designer_name}</strong></span>
                      </div>
                    )}

                    {item.type === 'product' && (
                      <div className="stock-info">
                        {item.quantity > 0 ? (
                          <span className="stock-in font-semibold text-secondary">In Stock ({item.quantity})</span>
                        ) : (
                          <span className="stock-out font-semibold text-pink">Out of Stock</span>
                        )}
                      </div>
                    )}

                    <div className="card-action-bar">
                      <span className="card-price">₹{item.price}</span>
                      {item.type === 'service' ? (
                        <Link to={`/services/${item.id}`} className="btn btn-primary btn-sm flex-center">
                          <Calendar size={14} /> Book Slots
                        </Link>
                      ) : (
                        <button
                          className="btn btn-accent btn-sm flex-center"
                          onClick={() => addToCart(item, 'product')}
                          disabled={item.quantity <= 0}
                        >
                          <ShoppingCart size={14} /> Add to Cart
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
