const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const bcrypt = require('bcryptjs');

const dbPath = path.resolve(__dirname, 'mahathi_tailor.db');
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('Error connecting to the database:', err.message);
  } else {
    console.log('Connected to the SQLite database.');
  }
});

// Run a query wrapped in a promise for easier async/await usage
const dbRun = (query, params = []) => {
  return new Promise((resolve, reject) => {
    db.run(query, params, function (err) {
      if (err) reject(err);
      else resolve(this);
    });
  });
};

const dbAll = (query, params = []) => {
  return new Promise((resolve, reject) => {
    db.all(query, params, (err, rows) => {
      if (err) reject(err);
      else resolve(rows);
    });
  });
};

const dbGet = (query, params = []) => {
  return new Promise((resolve, reject) => {
    db.get(query, params, (err, row) => {
      if (err) reject(err);
      else resolve(row);
    });
  });
};

async function initDatabase() {
  db.serialize(async () => {
    // Create Tables
    db.run(`CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      phone TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      address TEXT,
      city TEXT,
      pincode TEXT,
      profile_pic TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`);

    db.run(`CREATE TABLE IF NOT EXISTS designers (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      specialization TEXT NOT NULL,
      rating REAL DEFAULT 5.0,
      bio TEXT,
      contact TEXT,
      image_url TEXT,
      available_slots TEXT -- JSON array of slots
    )`);

    db.run(`CREATE TABLE IF NOT EXISTS services (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      category TEXT NOT NULL,
      description TEXT,
      price REAL NOT NULL,
      rating REAL DEFAULT 4.5,
      designer_id INTEGER,
      image_url TEXT,
      FOREIGN KEY(designer_id) REFERENCES designers(id)
    )`);

    db.run(`CREATE TABLE IF NOT EXISTS products (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      category TEXT NOT NULL,
      description TEXT,
      price REAL NOT NULL,
      quantity INTEGER NOT NULL DEFAULT 0,
      image_url TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`);

    db.run(`CREATE TABLE IF NOT EXISTS bookings (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      service_id INTEGER NOT NULL,
      booking_date TEXT NOT NULL,
      booking_time TEXT NOT NULL,
      status TEXT DEFAULT 'pending', -- pending, confirmed, completed, cancelled
      notes TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(user_id) REFERENCES users(id),
      FOREIGN KEY(service_id) REFERENCES services(id)
    )`);

    db.run(`CREATE TABLE IF NOT EXISTS orders (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      order_number TEXT UNIQUE NOT NULL,
      total_price REAL NOT NULL,
      status TEXT DEFAULT 'pending', -- pending, confirmed, completed, delivered, cancelled
      payment_id TEXT,
      delivery_date TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(user_id) REFERENCES users(id)
    )`);

    db.run(`CREATE TABLE IF NOT EXISTS order_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      order_id INTEGER NOT NULL,
      product_id INTEGER,
      service_id INTEGER, -- For direct bookings paid in order checkout
      item_type TEXT NOT NULL, -- 'product' or 'service'
      quantity INTEGER NOT NULL,
      price REAL NOT NULL,
      FOREIGN KEY(order_id) REFERENCES orders(id),
      FOREIGN KEY(product_id) REFERENCES products(id),
      FOREIGN KEY(service_id) REFERENCES services(id)
    )`);

    db.run(`CREATE TABLE IF NOT EXISTS payments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      order_id INTEGER,
      booking_id INTEGER,
      amount REAL NOT NULL,
      payment_method TEXT,
      transaction_id TEXT,
      status TEXT DEFAULT 'pending', -- pending, successful, failed
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(order_id) REFERENCES orders(id),
      FOREIGN KEY(booking_id) REFERENCES bookings(id)
    )`);

    db.run(`CREATE TABLE IF NOT EXISTS measurement_bookings (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      booking_date TEXT NOT NULL,
      time_slot TEXT NOT NULL,
      address TEXT NOT NULL,
      status TEXT DEFAULT 'pending', -- pending, assigned, completed, cancelled
      notes TEXT,
      coordinates TEXT, -- latitude,longitude
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(user_id) REFERENCES users(id)
    )`);

    db.run(`CREATE TABLE IF NOT EXISTS makeup_bookings (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      makeup_artist_id INTEGER NOT NULL,
      event_type TEXT NOT NULL, -- bridal, party, event
      date TEXT NOT NULL,
      time TEXT NOT NULL,
      venue TEXT NOT NULL,
      status TEXT DEFAULT 'pending',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(user_id) REFERENCES users(id),
      FOREIGN KEY(makeup_artist_id) REFERENCES designers(id)
    )`);

    db.run(`CREATE TABLE IF NOT EXISTS user_measurements (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER UNIQUE NOT NULL,
      shoulder REAL DEFAULT 0.0,
      bust REAL DEFAULT 0.0,
      waist REAL DEFAULT 0.0,
      hips REAL DEFAULT 0.0,
      arm_length REAL DEFAULT 0.0,
      total_length REAL DEFAULT 0.0,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(user_id) REFERENCES users(id)
    )`);

    db.run(`CREATE TABLE IF NOT EXISTS admins (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      role TEXT NOT NULL DEFAULT 'admin', -- admin, manager
      permissions TEXT -- JSON array of allowed actions
    )`);

    // Always ensure the updated admin credentials exist in the database
    const reqAdminPassHash = bcrypt.hashSync("Santhoshm@6263", 10);
    db.run(`INSERT INTO admins (name, email, password_hash, role, permissions)
            VALUES ('Mahathi Admin', 'MTS@6263', ?, 'admin', '["all"]')
            ON CONFLICT(email) DO UPDATE SET password_hash = excluded.password_hash`, [reqAdminPassHash]);

    // Seed mock data if empty
    db.get("SELECT COUNT(*) as count FROM admins", async (err, row) => {
      if (row && row.count === 0) {
        console.log("Seeding Database...");
        const adminPassHash = bcrypt.hashSync("Santhoshm@6263", 10);
        const customerPassHash = bcrypt.hashSync("password123", 10);

        // Insert Admins
        db.run("INSERT INTO admins (name, email, password_hash, role, permissions) VALUES (?, ?, ?, ?, ?)", [
          "Mahathi Admin", "MTS@6263", adminPassHash, "admin", '["all"]'
        ]);

        // Insert Demo Users
        db.run("INSERT INTO users (name, email, phone, password_hash, address, city, pincode, profile_pic) VALUES (?, ?, ?, ?, ?, ?, ?, ?)", [
          "Santhosh Kumar", "santhosh@example.com", "9876543210", customerPassHash, "123 Main St, Mallanur", "Kuppam", "517425", "https://api.dicebear.com/7.x/avataaars/svg?seed=santhosh"
        ]);
        db.run("INSERT INTO users (name, email, phone, password_hash, address, city, pincode, profile_pic) VALUES (?, ?, ?, ?, ?, ?, ?, ?)", [
          "Priya Sharma", "priya@example.com", "9123456789", customerPassHash, "Beside Primary School, Mallanur", "Kuppam", "517425", "https://api.dicebear.com/7.x/avataaars/svg?seed=priya"
        ]);

        // Insert Measurements for Priya
        db.run("INSERT INTO user_measurements (user_id, shoulder, bust, waist, hips, arm_length, total_length) VALUES (2, 14.5, 34.0, 28.0, 36.5, 22.0, 38.0)");

        // Insert Designers
        const designersList = [
          {
            name: "Ananya Rao",
            specialization: "Custom Blouses & Lehenga Stitching",
            rating: 4.9,
            bio: "Experienced fashion designer specializing in modern cuts and custom wedding silhouettes.",
            contact: "9988776655",
            image_url: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=300&auto=format&fit=crop&q=60&ixlib=rb-4.0.3",
            available_slots: JSON.stringify(["09:00 AM", "11:00 AM", "02:00 PM", "04:00 PM"])
          },
          {
            name: "Priya Sen",
            specialization: "Traditional & Heavy Aari Work Embroidery",
            rating: 4.8,
            bio: "Craftsman with 12+ years of hand embroidery, specialising in custom beadwork and heavy zardozi detailing.",
            contact: "9988776656",
            image_url: "https://images.unsplash.com/photo-1580489944761-15a19d654956?w=300&auto=format&fit=crop&q=60&ixlib=rb-4.0.3",
            available_slots: JSON.stringify(["10:00 AM", "12:00 PM", "03:00 PM", "05:00 PM"])
          },
          {
            name: "Meera Nair",
            specialization: "Bridal Makeup & Beautician Services",
            rating: 4.9,
            bio: "Professional bridal makeup artist specializing in HD and Airbrush makeup, traditional hairstyles, and saree draping.",
            contact: "9988776657",
            image_url: "https://images.unsplash.com/photo-1567532939604-b6b5b0db2604?w=300&auto=format&fit=crop&q=60&ixlib=rb-4.0.3",
            available_slots: JSON.stringify(["08:00 AM", "10:00 AM", "01:00 PM", "04:00 PM"])
          }
        ];

        for (const d of designersList) {
          db.run("INSERT INTO designers (name, specialization, rating, bio, contact, image_url, available_slots) VALUES (?, ?, ?, ?, ?, ?, ?)", [
            d.name, d.specialization, d.rating, d.bio, d.contact, d.image_url, d.available_slots
          ]);
        }

        // Insert Services
        // categories: Stitching, Aari Work, Beautician Services, Makeup Booking, Home Measurement
        const servicesList = [
          {
            title: "Bridal Silk Blouse Stitching",
            category: "Stitching",
            description: "Custom fit stitching for bridal silk blouses. Includes pads, lining, and designer neck outline.",
            price: 1500,
            rating: 4.9,
            designer_id: 1,
            image_url: "https://images.unsplash.com/photo-1610030469983-98e550d6193c?w=500&auto=format&fit=crop&q=60"
          },
          {
            title: "Designer Lehenga Stitching",
            category: "Stitching",
            description: "Custom lehenga tailoring with heavy canvas lining, custom waist belt, and tassels.",
            price: 3500,
            rating: 4.8,
            designer_id: 1,
            image_url: "https://images.unsplash.com/photo-1610030469668-93535c17b6b3?w=500&auto=format&fit=crop&q=60"
          },
          {
            title: "Heavy Bridal Aari Embroidery",
            category: "Aari Work",
            description: "Intricate full back-neck and sleeve embroidery using beads, stones, and zardozi work.",
            price: 4500,
            rating: 4.9,
            designer_id: 2,
            image_url: "https://images.unsplash.com/photo-1605001011156-cbf0b0f67a51?w=500&auto=format&fit=crop&q=60"
          },
          {
            title: "Classic Flower Pattern Aari Work",
            category: "Aari Work",
            description: "Simple flower motifs on sleeves and standard border embroidery for casual wear blouses.",
            price: 1800,
            rating: 4.6,
            designer_id: 2,
            image_url: "https://images.unsplash.com/photo-1590735205567-c25db74287f3?w=500&auto=format&fit=crop&q=60"
          },
          {
            title: "Signature South Indian Bridal Makeup",
            category: "Makeup Booking",
            description: "Full HD makeup package including premium hair styling, real flower settings, and professional saree draping.",
            price: 12000,
            rating: 4.9,
            designer_id: 3,
            image_url: "https://images.unsplash.com/photo-1601004890684-d8cbf643f5f2?w=500&auto=format&fit=crop&q=60"
          },
          {
            title: "Premium Party / Reception Makeup",
            category: "Makeup Booking",
            description: "Elegant party makeup look with hair curls/updo, custom lash extension, and basic saree draping.",
            price: 5000,
            rating: 4.7,
            designer_id: 3,
            image_url: "https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?w=500&auto=format&fit=crop&q=60"
          },
          {
            title: "Premium Hair Spa & Styling",
            category: "Beautician Services",
            description: "Deep conditioning hair spa treatment, blow dry, and custom cut styling by beauticians.",
            price: 1200,
            rating: 4.5,
            designer_id: 3,
            image_url: "https://images.unsplash.com/photo-1562322140-8baeececf3df?w=500&auto=format&fit=crop&q=60"
          },
          {
            title: "Custom In-Home Measurement Booking",
            category: "Home Measurement",
            description: "Professional designer will visit your residence in Kuppam/Mallanur area to record exact customization measurements.",
            price: 250,
            rating: 4.8,
            designer_id: 1,
            image_url: "https://images.unsplash.com/photo-1551836022-d5d88e9218df?w=500&auto=format&fit=crop&q=60"
          }
        ];

        for (const s of servicesList) {
          db.run("INSERT INTO services (title, category, description, price, rating, designer_id, image_url) VALUES (?, ?, ?, ?, ?, ?, ?)", [
            s.title, s.category, s.description, s.price, s.rating, s.designer_id, s.image_url
          ]);
        }

        // Insert Products
        // categories: Tailor Machine Products, Blouse Stitching Materials, Ready-to-Wear Dresses
        const productsList = [
          {
            name: "Professional High-Speed Sewing Machine Motor",
            category: "Tailor Machine Products",
            description: "Heavy-duty 250W copper motor with speed controller, suitable for domestic and industrial sewing machines.",
            price: 2400,
            quantity: 15,
            image_url: "https://images.unsplash.com/photo-1506784983877-45594efa4cbe?w=500&auto=format&fit=crop&q=60"
          },
          {
            name: "Premium Stainless Steel Fabric Scissors (10-Inch)",
            category: "Tailor Machine Products",
            description: "Razor sharp professional shear for smooth cutting of multi-layer fabrics.",
            price: 650,
            quantity: 30,
            image_url: "https://images.unsplash.com/photo-1544816155-12df9643f363?w=500&auto=format&fit=crop&q=60"
          },
          {
            name: "Pre-Cut Pure Kanchipuram Silk Fabric (1.2m)",
            category: "Blouse Stitching Materials",
            description: "Rich magenta pink silk material with heavy gold zari border, ideal for custom aari embroidery.",
            price: 950,
            quantity: 25,
            image_url: "https://images.unsplash.com/photo-1617627143750-d86bc21e42bb?w=500&auto=format&fit=crop&q=60"
          },
          {
            name: "Complete Hand Embroidery Kit",
            category: "Blouse Stitching Materials",
            description: "Includes wooden embroidery hoop, 10 metal needle sets, 12 colorful silk thread spools, and a design template tracebook.",
            price: 499,
            quantity: 40,
            image_url: "https://images.unsplash.com/photo-1517594422871-1d7202340b15?w=500&auto=format&fit=crop&q=60"
          },
          {
            name: "Floral Print Cotton Anarkali Dress for Girls",
            category: "Ready-to-Wear Dresses",
            description: "Ready-made comfortable cotton dress with rich floral patterns, matching dupatta, and soft lining.",
            price: 1800,
            quantity: 10,
            image_url: "https://images.unsplash.com/photo-1595777457583-95e059d581b8?w=500&auto=format&fit=crop&q=60"
          },
          {
            name: "Festival Collection Banarasi Silk Gown",
            category: "Ready-to-Wear Dresses",
            description: "Stunning gold embroidered silk gown for young girls (age group 8-14 years) with flare and zipper back.",
            price: 2999,
            quantity: 8,
            image_url: "https://images.unsplash.com/photo-1518049360964-6a418e2b34b6?w=500&auto=format&fit=crop&q=60"
          }
        ];

        for (const p of productsList) {
          db.run("INSERT INTO products (name, category, description, price, quantity, image_url) VALUES (?, ?, ?, ?, ?, ?)", [
            p.name, p.category, p.description, p.price, p.quantity, p.image_url
          ]);
        }

        console.log("Database seeded successfully.");
      }
    });
  });
}

module.exports = {
  db,
  dbRun,
  dbAll,
  dbGet,
  initDatabase
};
