const jwt = require('jsonwebtoken');
const admin = require('firebase-admin');
const https = require('https');

const JWT_SECRET = 'mahathi_secret_key_12345!@#$';

// Initialize Firebase Admin SDK
let firebaseAdminInitialized = false;
try {
  if (process.env.FIREBASE_SERVICE_ACCOUNT) {
    const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount)
    });
    firebaseAdminInitialized = true;
    console.log('Firebase Admin SDK initialized successfully using service account credentials.');
  } else {
    // Attempt fallback initialization
    const projectId = process.env.FIREBASE_PROJECT_ID || 'mahathi-tailor-shop';
    admin.initializeApp({
      projectId: projectId
    });
    firebaseAdminInitialized = true;
    console.log(`Firebase Admin SDK initialized with project ID: ${projectId} (no service account).`);
  }
} catch (error) {
  console.warn('Firebase Admin SDK initialization warning:', error.message);
}

// Cache for Google's securetoken public keys to avoid fetching on every request
let cachedPublicKeys = null;
let publicKeysExpiresAt = 0;

function fetchGooglePublicKeys() {
  return new Promise((resolve, reject) => {
    // If cache is valid, return it
    if (cachedPublicKeys && Date.now() < publicKeysExpiresAt) {
      return resolve(cachedPublicKeys);
    }

    https.get('https://www.googleapis.com/service_accounts/v1/metadata/x509/securetoken@system.gserviceaccount.com', (res) => {
      let data = '';
      
      const cacheControl = res.headers['cache-control'];
      let maxAge = 3600; // default 1 hour cache
      if (cacheControl) {
        const match = cacheControl.match(/max-age=(\d+)/);
        if (match) maxAge = parseInt(match[1], 10);
      }

      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        try {
          const keys = JSON.parse(data);
          cachedPublicKeys = keys;
          publicKeysExpiresAt = Date.now() + (maxAge * 1000);
          resolve(keys);
        } catch (e) {
          reject(new Error('Failed to parse Google public keys JSON: ' + e.message));
        }
      });
    }).on('error', (err) => {
      if (cachedPublicKeys) {
        console.warn('Network error fetching Google keys, using expired cache:', err.message);
        return resolve(cachedPublicKeys);
      }
      reject(err);
    });
  });
}

async function verifyFirebaseIdTokenManually(token) {
  const projectId = process.env.FIREBASE_PROJECT_ID || 'mahathi-tailor-shop';
  const decoded = jwt.decode(token, { complete: true });
  if (!decoded || !decoded.header || !decoded.header.kid) {
    throw new Error('Invalid Firebase ID token format');
  }

  const kid = decoded.header.kid;
  const publicKeys = await fetchGooglePublicKeys();
  const cert = publicKeys[kid];
  if (!cert) {
    throw new Error('Firebase ID token signed with unknown public key');
  }

  return jwt.verify(token, cert, {
    algorithms: ['RS256'],
    audience: projectId,
    issuer: `https://securetoken.google.com/${projectId}`
  });
}

async function verifyFirebaseIdToken(token) {
  if (!token) {
    throw new Error('Firebase ID token is missing');
  }

  if (firebaseAdminInitialized) {
    try {
      return await admin.auth().verifyIdToken(token);
    } catch (err) {
      console.warn('Firebase Admin SDK verifyIdToken failed, trying manual verification fallback:', err.message);
    }
  }

  return await verifyFirebaseIdTokenManually(token);
}

function generateToken(user, isAdmin = false) {
  return jwt.sign(
    {
      id: user.id,
      email: user.email,
      name: user.name,
      role: isAdmin ? (user.role || 'admin') : 'user'
    },
    JWT_SECRET,
    { expiresIn: '7d' }
  );
}

function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ message: 'Access token missing' });
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ message: 'Token invalid or expired' });
    }
    req.user = user;
    next();
  });
}

function requireAdmin(req, res, next) {
  if (!req.user || (req.user.role !== 'admin' && req.user.role !== 'manager')) {
    return res.status(403).json({ message: 'Admin permissions required' });
  }
  next();
}

// Temporary storage for OTP verification
const otpCache = new Map();

function sendMockOTP(phoneOrEmail) {
  // Generate a random 6-digit OTP code
  const code = Math.floor(100000 + Math.random() * 900000).toString();
  otpCache.set(phoneOrEmail, {
    code,
    expiresAt: Date.now() + 5 * 60 * 1000 // 5 minutes expiration
  });
  
  // Log it to console so we can see it in terminal, and return it in API during dev (for ease of use)
  console.log(`[MOCK OTP] Sent code ${code} to ${phoneOrEmail}`);
  return code;
}

function verifyOTP(phoneOrEmail, code) {
  const cached = otpCache.get(phoneOrEmail);
  if (!cached) return false;
  if (Date.now() > cached.expiresAt) {
    otpCache.delete(phoneOrEmail);
    return false;
  }
  if (cached.code === code) {
    otpCache.delete(phoneOrEmail);
    return true;
  }
  return false;
}

module.exports = {
  generateToken,
  authenticateToken,
  requireAdmin,
  sendMockOTP,
  verifyOTP,
  verifyFirebaseIdToken
};
