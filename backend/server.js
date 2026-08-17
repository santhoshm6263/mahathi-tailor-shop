const express = require('express');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const { initDatabase, db, dbRun, dbAll, dbGet } = require('./database');
const { generateToken, authenticateToken, requireAdmin, sendMockOTP, verifyOTP, verifyFirebaseIdToken } = require('./auth');

const app = express();
const PORT = process.env.PORT || 5000;

const allowedOrigins = [
  'https://mahathi-tailor-shop.vercel.app',
  'http://localhost:5173',
  'http://localhost:3000',
  'http://localhost:5000'
];

app.use(cors({
  origin: (origin, callback) => {
    if (!origin) return callback(null, true);
    
    const isLocalhost = origin.startsWith('http://localhost:') || origin.startsWith('http://127.0.0.1:');
    if (allowedOrigins.includes(origin) || isLocalhost) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true
}));
app.use(express.json());

// Initialize database schema and data
initDatabase();

// -------------------------------------------------------------
// USER AUTHENTICATION ENDPOINTS
// -------------------------------------------------------------

// Send OTP during Registration or Login
app.post('/api/auth/send-otp', (req, res) => {
  const { phoneOrEmail } = req.body;
  if (!phoneOrEmail) {
    return res.status(400).json({ message: 'Phone or email is required' });
  }
  sendMockOTP(phoneOrEmail);
  res.json({ message: 'OTP sent successfully' });
});

function normalizePhone(num) {
  if (!num) return '';
  let cleaned = num.replace(/[\s\-\(\)]/g, '');
  if (cleaned.length === 10 && /^\d+$/.test(cleaned)) {
    return `+91${cleaned}`;
  }
  if (cleaned.length === 12 && cleaned.startsWith('91')) {
    return `+${cleaned}`;
  }
  return cleaned;
}

// User Registration
app.post('/api/auth/register', async (req, res) => {
  const { name, email, phone, password, address, city, pincode, firebaseToken } = req.body;
  
  if (!name || !email || !phone || !password || !firebaseToken) {
    return res.status(400).json({ message: 'Please provide all required fields including Firebase token' });
  }

  try {
    const decodedToken = await verifyFirebaseIdToken(firebaseToken);
    if (!decodedToken || !decodedToken.email) {
      return res.status(400).json({ message: 'Invalid Firebase authentication token' });
    }

    const verifiedEmail = decodedToken.email.toLowerCase();
    const inputEmail = email.trim().toLowerCase();

    if (verifiedEmail !== inputEmail) {
      return res.status(400).json({ message: 'Submitted email address does not match verified Firebase email address' });
    }

    const inputPhone = normalizePhone(phone);
    const password_hash = bcrypt.hashSync(password, 10);
    const profile_pic = `https://api.dicebear.com/7.x/avataaars/svg?seed=${name.replace(/\s+/g, '')}`;

    const query = `
      INSERT INTO users (name, email, phone, password_hash, address, city, pincode, profile_pic)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `;
    
    db.run(query, [name, inputEmail, inputPhone, password_hash, address || '', city || '', pincode || '', profile_pic], function (err) {
      if (err) {
        if (err.message.includes('UNIQUE constraint failed')) {
          return res.status(400).json({ message: 'Email or phone number already registered' });
        }
        return res.status(500).json({ message: 'Database error: ' + err.message });
      }
      
      const userId = this.lastID;
      const user = { id: userId, name, email: inputEmail, phone: inputPhone };
      const token = generateToken(user);
      
      // Initialize empty measurements profile
      db.run("INSERT INTO user_measurements (user_id) VALUES (?)", [userId]);

      res.status(201).json({
        message: 'Registration successful',
        token,
        user: { id: userId, name, email: inputEmail, phone: inputPhone, profile_pic }
      });
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error: ' + error.message });
  }
});

// User Login (supports password login or Firebase email/password token login)
app.post('/api/auth/login', async (req, res) => {
  const { emailOrPhone, password, otp, firebaseToken } = req.body;

  try {
    let user;

    if (firebaseToken) {
      const decodedToken = await verifyFirebaseIdToken(firebaseToken);
      if (!decodedToken || !decodedToken.email) {
        return res.status(400).json({ message: 'Invalid Firebase authentication token' });
      }

      const verifiedEmail = decodedToken.email.toLowerCase();
      user = await dbGet('SELECT * FROM users WHERE LOWER(email) = ?', [verifiedEmail]);
      if (!user) {
        return res.status(404).json({ message: 'No registered user found with this verified email address. Please register first.' });
      }
    } else {
      if (!emailOrPhone) {
        return res.status(400).json({ message: 'Email or phone is required' });
      }

      const normalizedInput = normalizePhone(emailOrPhone);
      user = await dbGet('SELECT * FROM users WHERE email = ? OR phone = ? OR phone = ?', [emailOrPhone, emailOrPhone, normalizedInput]);
      
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }

      if (password) {
        const isPasswordValid = bcrypt.compareSync(password, user.password_hash);
        if (!isPasswordValid) {
          return res.status(400).json({ message: 'Invalid credentials' });
        }
      } else if (otp) {
        const isOtpValid = verifyOTP(emailOrPhone, otp);
        if (!isOtpValid) {
          return res.status(400).json({ message: 'Invalid or expired OTP code' });
        }
      } else {
        return res.status(400).json({ message: 'Password or OTP is required to login' });
      }
    }

    const token = generateToken(user);
    res.json({
      message: 'Login successful',
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        address: user.address,
        city: user.city,
        pincode: user.pincode,
        profile_pic: user.profile_pic
      }
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error: ' + error.message });
  }
});

// Admin Authentication
app.post('/api/auth/admin-login', async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ message: 'Email and password are required' });
  }

  try {
    const admin = await dbGet('SELECT * FROM admins WHERE email = ?', [email]);
    if (!admin) {
      return res.status(404).json({ message: 'Admin account not found' });
    }

    const isPasswordValid = bcrypt.compareSync(password, admin.password_hash);
    if (!isPasswordValid) {
      return res.status(400).json({ message: 'Invalid admin credentials' });
    }

    const token = generateToken(admin, true);
    res.json({
      message: 'Admin login successful',
      token,
      user: {
        id: admin.id,
        name: admin.name,
        email: admin.email,
        role: admin.role,
        permissions: JSON.parse(admin.permissions || '[]')
      }
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error: ' + error.message });
  }
});

// Profile Management
app.get('/api/auth/profile', authenticateToken, async (req, res) => {
  try {
    const user = await dbGet('SELECT id, name, email, phone, address, city, pincode, profile_pic FROM users WHERE id = ?', [req.user.id]);
    if (!user) {
      return res.status(404).json({ message: 'User profile not found' });
    }
    res.json(user);
  } catch (error) {
    res.status(500).json({ message: 'Server error: ' + error.message });
  }
});

app.put('/api/auth/profile', authenticateToken, async (req, res) => {
  const { name, phone, address, city, pincode, profile_pic } = req.body;
  try {
    await dbRun(
      'UPDATE users SET name = ?, phone = ?, address = ?, city = ?, pincode = ?, profile_pic = ? WHERE id = ?',
      [name, phone, address, city, pincode, profile_pic, req.user.id]
    );
    res.json({ message: 'Profile updated successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error: ' + error.message });
  }
});

// Tailoring Measurement Profiles
app.get('/api/auth/measurements', authenticateToken, async (req, res) => {
  try {
    let measurements = await dbGet('SELECT * FROM user_measurements WHERE user_id = ?', [req.user.id]);
    if (!measurements) {
      // Create profile if doesn't exist
      await dbRun('INSERT INTO user_measurements (user_id) VALUES (?)', [req.user.id]);
      measurements = await dbGet('SELECT * FROM user_measurements WHERE user_id = ?', [req.user.id]);
    }
    res.json(measurements);
  } catch (error) {
    res.status(500).json({ message: 'Server error: ' + error.message });
  }
});

app.put('/api/auth/measurements', authenticateToken, async (req, res) => {
  const { shoulder, bust, waist, hips, arm_length, total_length } = req.body;
  try {
    await dbRun(
      `INSERT INTO user_measurements (user_id, shoulder, bust, waist, hips, arm_length, total_length, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
       ON CONFLICT(user_id) DO UPDATE SET 
         shoulder = excluded.shoulder,
         bust = excluded.bust,
         waist = excluded.waist,
         hips = excluded.hips,
         arm_length = excluded.arm_length,
         total_length = excluded.total_length,
         updated_at = CURRENT_TIMESTAMP`,
      [req.user.id, shoulder, bust, waist, hips, arm_length, total_length]
    );
    res.json({ message: 'Measurements profile updated' });
  } catch (error) {
    res.status(500).json({ message: 'Server error: ' + error.message });
  }
});

// -------------------------------------------------------------
// SERVICES CATALOG ENDPOINTS
// -------------------------------------------------------------
app.get('/api/services', async (req, res) => {
  const { category, search } = req.query;
  let query = `
    SELECT s.*, d.name as designer_name, d.specialization as designer_specialization
    FROM services s
    LEFT JOIN designers d ON s.designer_id = d.id
  `;
  const params = [];

  if (category || search) {
    query += ' WHERE';
    const conditions = [];
    if (category) {
      conditions.push(' s.category = ?');
      params.push(category);
    }
    if (search) {
      conditions.push(' (s.title LIKE ? OR s.description LIKE ?)');
      params.push(`%${search}%`, `%${search}%`);
    }
    query += conditions.join(' AND');
  }

  try {
    const services = await dbAll(query, params);
    res.json(services);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

app.get('/api/services/:id', async (req, res) => {
  try {
    const service = await dbGet(`
      SELECT s.*, d.name as designer_name, d.specialization as designer_specialization, d.bio as designer_bio, d.image_url as designer_image, d.available_slots
      FROM services s
      LEFT JOIN designers d ON s.designer_id = d.id
      WHERE s.id = ?
    `, [req.params.id]);

    if (!service) {
      return res.status(404).json({ message: 'Service not found' });
    }
    
    // Parse slots
    if (service.available_slots) {
      service.available_slots = JSON.parse(service.available_slots);
    } else {
      service.available_slots = [];
    }

    res.json(service);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

app.get('/api/designers', async (req, res) => {
  try {
    const designers = await dbAll('SELECT * FROM designers');
    designers.forEach(d => {
      d.available_slots = JSON.parse(d.available_slots || '[]');
    });
    res.json(designers);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// -------------------------------------------------------------
// PRODUCTS CATALOG ENDPOINTS
// -------------------------------------------------------------
app.get('/api/products', async (req, res) => {
  const { category, search } = req.query;
  let query = 'SELECT * FROM products';
  const params = [];

  if (category || search) {
    query += ' WHERE';
    const conditions = [];
    if (category) {
      conditions.push(' category = ?');
      params.push(category);
    }
    if (search) {
      conditions.push(' (name LIKE ? OR description LIKE ?)');
      params.push(`%${search}%`, `%${search}%`);
    }
    query += conditions.join(' AND');
  }

  try {
    const products = await dbAll(query, params);
    res.json(products);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

app.get('/api/products/:id', async (req, res) => {
  try {
    const product = await dbGet('SELECT * FROM products WHERE id = ?', [req.params.id]);
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }
    res.json(product);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// -------------------------------------------------------------
// SERVICE BOOKINGS ENDPOINTS
// -------------------------------------------------------------

// Create Service Booking
app.post('/api/bookings', authenticateToken, async (req, res) => {
  const { service_id, booking_date, booking_time, notes } = req.body;
  if (!service_id || !booking_date || !booking_time) {
    return res.status(400).json({ message: 'Missing booking details' });
  }

  try {
    const query = `
      INSERT INTO bookings (user_id, service_id, booking_date, booking_time, status, notes)
      VALUES (?, ?, ?, ?, 'pending', ?)
    `;
    db.run(query, [req.user.id, service_id, booking_date, booking_time, notes || ''], function (err) {
      if (err) {
        return res.status(500).json({ message: err.message });
      }
      res.status(201).json({
        message: 'Booking created successfully',
        bookingId: this.lastID
      });
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

app.get('/api/bookings', authenticateToken, async (req, res) => {
  try {
    const bookings = await dbAll(`
      SELECT b.*, s.title as service_title, s.price as service_price, s.image_url as service_image, d.name as designer_name
      FROM bookings b
      JOIN services s ON b.service_id = s.id
      LEFT JOIN designers d ON s.designer_id = d.id
      WHERE b.user_id = ?
      ORDER BY b.created_at DESC
    `, [req.user.id]);
    res.json(bookings);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Home Measurement Booking
app.post('/api/measurement-bookings', authenticateToken, async (req, res) => {
  const { booking_date, time_slot, address, notes, coordinates } = req.body;
  if (!booking_date || !time_slot || !address) {
    return res.status(400).json({ message: 'Missing measurement booking details' });
  }

  try {
    const query = `
      INSERT INTO measurement_bookings (user_id, booking_date, time_slot, address, status, notes, coordinates)
      VALUES (?, ?, ?, ?, 'pending', ?, ?)
    `;
    db.run(query, [req.user.id, booking_date, time_slot, address, notes || '', coordinates || ''], function (err) {
      if (err) {
        return res.status(500).json({ message: err.message });
      }
      res.status(201).json({
        message: 'Home measurement service scheduled successfully',
        bookingId: this.lastID
      });
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

app.get('/api/measurement-bookings', authenticateToken, async (req, res) => {
  try {
    const bookings = await dbAll(`
      SELECT * FROM measurement_bookings 
      WHERE user_id = ? 
      ORDER BY created_at DESC
    `, [req.user.id]);
    res.json(bookings);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Makeup Booking
app.post('/api/makeup-bookings', authenticateToken, async (req, res) => {
  const { makeup_artist_id, event_type, date, time, venue } = req.body;
  if (!makeup_artist_id || !event_type || !date || !time || !venue) {
    return res.status(400).json({ message: 'Missing makeup event booking details' });
  }

  try {
    const query = `
      INSERT INTO makeup_bookings (user_id, makeup_artist_id, event_type, date, time, venue, status)
      VALUES (?, ?, ?, ?, ?, ?, 'pending')
    `;
    db.run(query, [req.user.id, makeup_artist_id, event_type, date, time, venue], function (err) {
      if (err) {
        return res.status(500).json({ message: err.message });
      }
      res.status(201).json({
        message: 'Makeup artist booked successfully',
        bookingId: this.lastID
      });
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

app.get('/api/makeup-bookings', authenticateToken, async (req, res) => {
  try {
    const bookings = await dbAll(`
      SELECT mb.*, d.name as artist_name, d.image_url as artist_image
      FROM makeup_bookings mb
      JOIN designers d ON mb.makeup_artist_id = d.id
      WHERE mb.user_id = ?
      ORDER BY mb.created_at DESC
    `, [req.user.id]);
    res.json(bookings);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// -------------------------------------------------------------
// CHECKOUT & ORDERS ENDPOINTS
// -------------------------------------------------------------
app.post('/api/checkout', authenticateToken, async (req, res) => {
  const { items, total_price, address, city, pincode, payment_method, transaction_id } = req.body;

  if (!items || items.length === 0 || !total_price) {
    return res.status(400).json({ message: 'Invalid cart checkout items' });
  }

  const order_number = 'MTS-' + Math.floor(100000 + Math.random() * 900000);
  const delivery_date = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]; // 7 days delivery

  db.serialize(() => {
    // 1. Create order record
    db.run(
      'INSERT INTO orders (user_id, order_number, total_price, status, payment_id, delivery_date) VALUES (?, ?, ?, ?, ?, ?)',
      [req.user.id, order_number, total_price, 'confirmed', transaction_id || 'MOCK-TXN-' + Date.now(), delivery_date],
      function (err) {
        if (err) {
          return res.status(500).json({ message: 'Order database error: ' + err.message });
        }
        
        const orderId = this.lastID;

        // 2. Add order items
        const itemQuery = 'INSERT INTO order_items (order_id, product_id, service_id, item_type, quantity, price) VALUES (?, ?, ?, ?, ?, ?)';
        
        for (const item of items) {
          const prodId = item.type === 'product' ? item.id : null;
          const servId = item.type === 'service' ? item.id : null;
          
          db.run(itemQuery, [orderId, prodId, servId, item.type, item.quantity, item.price], (itemErr) => {
            if (itemErr) {
              console.error('Error adding order item:', itemErr.message);
            }
          });

          // Update stock if it's a product
          if (item.type === 'product') {
            db.run('UPDATE products SET quantity = MAX(0, quantity - ?) WHERE id = ?', [item.quantity, item.id]);
          }
        }

        // 3. Create payment record
        db.run(
          'INSERT INTO payments (order_id, amount, payment_method, transaction_id, status) VALUES (?, ?, ?, ?, ?)',
          [orderId, total_price, payment_method || 'Online', transaction_id || 'MOCK-TXN-' + Date.now(), 'successful']
        );

        res.status(201).json({
          message: 'Order placed successfully',
          order_number,
          order_id: orderId,
          delivery_date
        });
      }
    );
  });
});

app.get('/api/orders', authenticateToken, async (req, res) => {
  try {
    const orders = await dbAll('SELECT * FROM orders WHERE user_id = ? ORDER BY created_at DESC', [req.user.id]);
    
    // Retrieve items for each order
    const populatedOrders = [];
    for (const order of orders) {
      const items = await dbAll(`
        SELECT oi.*, p.name as product_name, p.image_url as product_image, s.title as service_title, s.image_url as service_image
        FROM order_items oi
        LEFT JOIN products p ON oi.product_id = p.id
        LEFT JOIN services s ON oi.service_id = s.id
        WHERE oi.order_id = ?
      `, [order.id]);
      
      populatedOrders.push({
        ...order,
        items
      });
    }
    
    res.json(populatedOrders);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// -------------------------------------------------------------
// ADMIN PANEL ENDPOINTS (Secured with authenticateToken & requireAdmin)
// -------------------------------------------------------------

app.get('/api/admin/stats', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const salesStat = await dbGet("SELECT SUM(total_price) as totalSales FROM orders WHERE status != 'cancelled'");
    const totalOrders = await dbGet("SELECT COUNT(*) as totalOrders FROM orders");
    const totalBookings = await dbGet("SELECT COUNT(*) as totalBookings FROM bookings");
    const totalCustomers = await dbGet("SELECT COUNT(*) as totalCustomers FROM users");

    const recentSales = await dbAll(`
      SELECT o.id, o.order_number, o.total_price, o.status, o.created_at, u.name as customer_name
      FROM orders o
      JOIN users u ON o.user_id = u.id
      ORDER BY o.created_at DESC LIMIT 5
    `);

    const bookingTrends = await dbAll(`
      SELECT b.id, b.booking_date, b.booking_time, b.status, s.title as service_title, u.name as customer_name
      FROM bookings b
      JOIN services s ON b.service_id = s.id
      JOIN users u ON b.user_id = u.id
      ORDER BY b.created_at DESC LIMIT 5
    `);

    res.json({
      metrics: {
        totalSales: salesStat.totalSales || 0,
        totalOrders: totalOrders.totalOrders || 0,
        totalBookings: totalBookings.totalBookings || 0,
        totalCustomers: totalCustomers.totalCustomers || 0
      },
      recentSales,
      bookingTrends
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Admin - Fetch All Orders
app.get('/api/admin/orders', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const orders = await dbAll(`
      SELECT o.*, u.name as customer_name, u.email as customer_email, u.phone as customer_phone
      FROM orders o
      JOIN users u ON o.user_id = u.id
      ORDER BY o.created_at DESC
    `);
    
    const populatedOrders = [];
    for (const order of orders) {
      const items = await dbAll(`
        SELECT oi.*, p.name as product_name, s.title as service_title
        FROM order_items oi
        LEFT JOIN products p ON oi.product_id = p.id
        LEFT JOIN services s ON oi.service_id = s.id
        WHERE oi.order_id = ?
      `, [order.id]);
      
      populatedOrders.push({
        ...order,
        items
      });
    }
    
    res.json(populatedOrders);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

app.put('/api/admin/orders/:id', authenticateToken, requireAdmin, async (req, res) => {
  const { status } = req.body;
  try {
    await dbRun('UPDATE orders SET status = ? WHERE id = ?', [status, req.params.id]);
    res.json({ message: 'Order status updated successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Admin - Bookings
app.get('/api/admin/bookings', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const bookings = await dbAll(`
      SELECT b.*, s.title as service_title, u.name as customer_name, u.email as customer_email, u.phone as customer_phone
      FROM bookings b
      JOIN services s ON b.service_id = s.id
      JOIN users u ON b.user_id = u.id
      ORDER BY b.booking_date DESC, b.booking_time DESC
    `);
    res.json(bookings);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

app.put('/api/admin/bookings/:id', authenticateToken, requireAdmin, async (req, res) => {
  const { status } = req.body;
  try {
    await dbRun('UPDATE bookings SET status = ? WHERE id = ?', [status, req.params.id]);
    res.json({ message: 'Booking status updated successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Admin - Home Measurements
app.get('/api/admin/measurement-bookings', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const bookings = await dbAll(`
      SELECT mb.*, u.name as customer_name, u.email as customer_email, u.phone as customer_phone
      FROM measurement_bookings mb
      JOIN users u ON mb.user_id = u.id
      ORDER BY mb.booking_date DESC
    `);
    res.json(bookings);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

app.put('/api/admin/measurement-bookings/:id', authenticateToken, requireAdmin, async (req, res) => {
  const { status } = req.body;
  try {
    await dbRun('UPDATE measurement_bookings SET status = ? WHERE id = ?', [status, req.params.id]);
    res.json({ message: 'Measurement booking status updated' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Admin - Makeup Bookings
app.get('/api/admin/makeup-bookings', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const bookings = await dbAll(`
      SELECT mb.*, u.name as customer_name, u.email as customer_email, u.phone as customer_phone, d.name as artist_name
      FROM makeup_bookings mb
      JOIN users u ON mb.user_id = u.id
      JOIN designers d ON mb.makeup_artist_id = d.id
      ORDER BY mb.date DESC
    `);
    res.json(bookings);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

app.put('/api/admin/makeup-bookings/:id', authenticateToken, requireAdmin, async (req, res) => {
  const { status } = req.body;
  try {
    await dbRun('UPDATE makeup_bookings SET status = ? WHERE id = ?', [status, req.params.id]);
    res.json({ message: 'Makeup booking status updated' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Admin - Services Management (CRUD)
app.post('/api/admin/services', authenticateToken, requireAdmin, async (req, res) => {
  const { title, category, description, price, rating, designer_id, image_url } = req.body;
  try {
    await dbRun(
      'INSERT INTO services (title, category, description, price, rating, designer_id, image_url) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [title, category, description, price, rating || 5.0, designer_id, image_url]
    );
    res.status(201).json({ message: 'Service added successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

app.put('/api/admin/services/:id', authenticateToken, requireAdmin, async (req, res) => {
  const { title, category, description, price, rating, designer_id, image_url } = req.body;
  try {
    await dbRun(
      'UPDATE services SET title = ?, category = ?, description = ?, price = ?, rating = ?, designer_id = ?, image_url = ? WHERE id = ?',
      [title, category, description, price, rating, designer_id, image_url, req.params.id]
    );
    res.json({ message: 'Service updated successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

app.delete('/api/admin/services/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    await dbRun('DELETE FROM services WHERE id = ?', [req.params.id]);
    res.json({ message: 'Service deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Admin - Products Management (CRUD)
app.post('/api/admin/products', authenticateToken, requireAdmin, async (req, res) => {
  const { name, category, description, price, quantity, image_url } = req.body;
  try {
    await dbRun(
      'INSERT INTO products (name, category, description, price, quantity, image_url) VALUES (?, ?, ?, ?, ?, ?)',
      [name, category, description, price, quantity, image_url]
    );
    res.status(201).json({ message: 'Product added successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

app.put('/api/admin/products/:id', authenticateToken, requireAdmin, async (req, res) => {
  const { name, category, description, price, quantity, image_url } = req.body;
  try {
    await dbRun(
      'UPDATE products SET name = ?, category = ?, description = ?, price = ?, quantity = ?, image_url = ? WHERE id = ?',
      [name, category, description, price, quantity, image_url, req.params.id]
    );
    res.json({ message: 'Product updated successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

app.delete('/api/admin/products/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    await dbRun('DELETE FROM products WHERE id = ?', [req.params.id]);
    res.json({ message: 'Product deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
