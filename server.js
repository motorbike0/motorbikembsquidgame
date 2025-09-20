const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const { body, validationResult } = require('express-validator');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const crypto = require('crypto');
const morgan = require('morgan');
const compression = require('compression');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Security middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      fontSrc: ["'self'", "https://fonts.gstatic.com"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
    },
  },
  crossOriginEmbedderPolicy: false
}));

// CORS configuration
const corsOptions = {
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  optionsSuccessStatus: 200,
  credentials: true
};
app.use(cors(corsOptions));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: {
    error: 'Too many requests from this IP, please try again later.',
    retryAfter: '15 minutes'
  },
  standardHeaders: true,
  legacyHeaders: false,
});
app.use(limiter);

// Registration rate limit (more restrictive)
const registrationLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 3, // limit each IP to 3 registrations per hour
  message: {
    error: 'Too many registration attempts. Please wait before trying again.',
    retryAfter: '1 hour'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Middleware
app.use(compression());
app.use(morgan('combined'));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname)));

// Database setup
const db = new sqlite3.Database('./registrations.db', (err) => {
  if (err) {
    console.error('Error opening database:', err.message);
  } else {
    console.log('Connected to SQLite database.');
    createTables();
  }
});

function createTables() {
  const createRegistrationsTable = `
    CREATE TABLE IF NOT EXISTS registrations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      role TEXT NOT NULL,
      firstName TEXT,
      lastName TEXT,
      class TEXT,
      phone TEXT,
      bringsPhone TEXT,
      willingToHelp TEXT,
      guardName TEXT,
      guardClass TEXT,
      guardPhone TEXT,
      ipAddress TEXT,
      userAgent TEXT,
      timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
      webhookStatus TEXT DEFAULT 'pending',
      discordMessageId TEXT
    )
  `;

  const createWebhookLogsTable = `
    CREATE TABLE IF NOT EXISTS webhook_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      registrationId INTEGER,
      attempt INTEGER,
      status TEXT,
      response TEXT,
      timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (registrationId) REFERENCES registrations (id)
    )
  `;

  db.run(createRegistrationsTable, (err) => {
    if (err) {
      console.error('Error creating registrations table:', err.message);
    } else {
      console.log('Registrations table ready.');
    }
  });

  db.run(createWebhookLogsTable, (err) => {
    if (err) {
      console.error('Error creating webhook_logs table:', err.message);
    } else {
      console.log('Webhook logs table ready.');
    }
  });
}

// Input validation middleware
const validateRegistration = [
  body('role').isIn(['player', 'guard']).withMessage('Invalid role'),
  body('firstName').optional().trim().isLength({ min: 1, max: 50 }).withMessage('First name must be 1-50 characters'),
  body('lastName').optional().trim().isLength({ min: 1, max: 50 }).withMessage('Last name must be 1-50 characters'),
  body('class').optional().trim().isLength({ min: 1, max: 10 }).withMessage('Class must be 1-10 characters'),
  body('phone').optional().matches(/^[\d\s\(\)\-+]+$/).withMessage('Invalid phone number format'),
  body('bringsPhone').optional().isIn(['yes', 'no']).withMessage('Invalid bringsPhone value'),
  body('willingToHelp').optional().isIn(['yes', 'no']).withMessage('Invalid willingToHelp value'),
  body('guardName').optional().trim().isLength({ min: 1, max: 100 }).withMessage('Guard name must be 1-100 characters'),
  body('guardClass').optional().trim().isLength({ min: 1, max: 10 }).withMessage('Guard class must be 1-10 characters'),
  body('guardPhone').optional().matches(/^[\d\s\(\)\-+]+$/).withMessage('Invalid guard phone number format')
];

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// Registration endpoint
app.post('/api/register', registrationLimiter, validateRegistration, async (req, res) => {
  try {
    // Check validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        error: 'Validation failed',
        details: errors.array()
      });
    }

    const { role, firstName, lastName, class: playerClass, phone, bringsPhone, willingToHelp, guardName, guardClass, guardPhone } = req.body;

    // Get client information
    const ipAddress = req.ip || req.connection.remoteAddress;
    const userAgent = req.get('User-Agent');

    // Sanitize inputs
    const sanitizedData = {
      role,
      firstName: firstName ? firstName.trim() : null,
      lastName: lastName ? lastName.trim() : null,
      class: playerClass ? playerClass.trim() : null,
      phone: phone ? phone.trim() : null,
      bringsPhone,
      willingToHelp,
      guardName: guardName ? guardName.trim() : null,
      guardClass: guardClass ? guardClass.trim() : null,
      guardPhone: guardPhone ? guardPhone.trim() : null,
      ipAddress,
      userAgent
    };

    // Insert into database
    const insertQuery = `
      INSERT INTO registrations (role, firstName, lastName, class, phone, bringsPhone, willingToHelp, guardName, guardClass, guardPhone, ipAddress, userAgent)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    db.run(insertQuery, [
      sanitizedData.role,
      sanitizedData.firstName,
      sanitizedData.lastName,
      sanitizedData.class,
      sanitizedData.phone,
      sanitizedData.bringsPhone,
      sanitizedData.willingToHelp,
      sanitizedData.guardName,
      sanitizedData.guardClass,
      sanitizedData.guardPhone,
      sanitizedData.ipAddress,
      sanitizedData.userAgent
    ], async function(err) {
      if (err) {
        console.error('Database error:', err);
        return res.status(500).json({ error: 'Database error occurred' });
      }

      const registrationId = this.lastID;

      // Send to Discord webhook
      const webhookSuccess = await sendToDiscordWebhook(sanitizedData, registrationId);

      // Update webhook status
      const status = webhookSuccess ? 'sent' : 'failed';
      db.run('UPDATE registrations SET webhookStatus = ? WHERE id = ?', [status, registrationId]);

      res.json({
        success: true,
        message: 'Registration completed successfully',
        id: registrationId,
        webhookStatus: status
      });
    });

  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Webhook status endpoint
app.get('/api/registration/:id', (req, res) => {
  const { id } = req.params;

  db.get('SELECT * FROM registrations WHERE id = ?', [id], (err, row) => {
    if (err) {
      return res.status(500).json({ error: 'Database error' });
    }

    if (!row) {
      return res.status(404).json({ error: 'Registration not found' });
    }

    res.json({
      id: row.id,
      role: row.role,
      timestamp: row.timestamp,
      webhookStatus: row.webhookStatus
    });
  });
});

// Admin endpoint to get all registrations (with basic auth)
app.get('/api/admin/registrations', (req, res) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || authHeader !== `Bearer ${process.env.ADMIN_TOKEN}`) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  db.all('SELECT * FROM registrations ORDER BY timestamp DESC', (err, rows) => {
    if (err) {
      return res.status(500).json({ error: 'Database error' });
    }

    res.json({ registrations: rows });
  });
});

// Function to send data to Discord webhook
async function sendToDiscordWebhook(data, registrationId) {
  try {
    const webhookUrl = process.env.DISCORD_WEBHOOK_URL;

    if (!webhookUrl) {
      console.error('Discord webhook URL not configured');
      return false;
    }

    // Create Discord embed
    const embed = {
      title: 'New Registration',
      color: data.role === 'player' ? 0x00ff00 : 0xff0000,
      fields: [],
      timestamp: new Date().toISOString(),
      footer: {
        text: `ID: ${registrationId}`
      }
    };

    if (data.role === 'player') {
      embed.fields = [
        { name: 'Role', value: 'Player', inline: true },
        { name: 'Name', value: `${data.firstName} ${data.lastName}`, inline: true },
        { name: 'Class', value: data.class || 'N/A', inline: true },
        { name: 'IP Address', value: data.ipAddress, inline: true },
        { name: 'User Agent', value: data.userAgent?.substring(0, 100) || 'N/A', inline: false }
      ];
    } else {
      embed.fields = [
        { name: 'Role', value: 'Guard', inline: true },
        { name: 'Name', value: data.guardName || 'N/A', inline: true },
        { name: 'Class', value: data.guardClass || 'N/A', inline: true },
        { name: 'Phone', value: data.guardPhone || 'N/A', inline: true },
        { name: 'Brings Phone', value: data.bringsPhone || 'N/A', inline: true },
        { name: 'Willing to Help', value: data.willingToHelp || 'N/A', inline: true },
        { name: 'IP Address', value: data.ipAddress, inline: true },
        { name: 'User Agent', value: data.userAgent?.substring(0, 100) || 'N/A', inline: false }
      ];
    }

    const payload = { embeds: [embed] };

    // Send to Discord with retry logic
    let attempts = 0;
    const maxAttempts = 3;

    while (attempts < maxAttempts) {
      try {
        const response = await fetch(webhookUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(payload)
        });

        if (response.ok) {
          const responseData = await response.text();
          console.log(`Webhook sent successfully on attempt ${attempts + 1}`);

          // Log successful webhook
          db.run('INSERT INTO webhook_logs (registrationId, attempt, status, response) VALUES (?, ?, ?, ?)',
            [registrationId, attempts + 1, 'success', responseData]);

          return true;
        } else {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
      } catch (error) {
        attempts++;
        console.error(`Webhook attempt ${attempts} failed:`, error.message);

        // Log failed webhook
        db.run('INSERT INTO webhook_logs (registrationId, attempt, status, response) VALUES (?, ?, ?, ?)',
          [registrationId, attempts, 'failed', error.message]);

        if (attempts < maxAttempts) {
          // Wait before retrying (exponential backoff)
          await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempts) * 1000));
        }
      }
    }

    console.error('All webhook attempts failed');
    return false;

  } catch (error) {
    console.error('Webhook error:', error);
    return false;
  }
}

// Serve the HTML file for all other routes
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong'
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Endpoint not found' });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Secure Squid Game Registration Server running on port ${PORT}`);
  console.log(`📊 Health check: http://localhost:${PORT}/api/health`);
  console.log(`🔐 Admin panel: http://localhost:${PORT}/api/admin/registrations (requires token)`);
});

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('Shutting down gracefully...');
  db.close((err) => {
    if (err) {
      console.error('Error closing database:', err.message);
    } else {
      console.log('Database connection closed.');
    }
    process.exit(0);
  });
});
