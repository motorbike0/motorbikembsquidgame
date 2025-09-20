n# 🦑 Secure Squid Game Registration System

A secure event registration system with backend API, webhook integration, and comprehensive security features.

## 🚀 Features

### Security Features
- **Helmet.js** - Security headers and XSS protection
- **CORS** - Cross-origin resource sharing configuration
- **Rate Limiting** - Prevents spam and abuse
- **Input Validation** - Server-side validation with express-validator
- **SQL Injection Protection** - Parameterized queries with SQLite
- **Request Logging** - Comprehensive logging with Morgan
- **Compression** - Response compression for better performance

### Backend Features
- **Express.js Server** - Fast, secure Node.js backend
- **SQLite Database** - Local database for data persistence
- **Discord Webhook Integration** - Automated notifications
- **Admin API** - Secure admin endpoints with token authentication
- **Health Check** - Server monitoring endpoint
- **Error Handling** - Comprehensive error handling and logging

### Frontend Features
- **Responsive Design** - Mobile-friendly interface
- **Form Validation** - Client-side validation
- **Modal System** - Smooth user interactions
- **Local Storage** - Registration status persistence

## 📋 Prerequisites

- Node.js (v16 or higher)
- npm or yarn
- Discord Webhook URL (optional, for notifications)

## 🛠️ Installation
pip help install
1. **Install Dependencies**
   ```bash
   npm install
   ```

2. **Environment Setup**
   - Copy `.env` and configure your settings:
   ```bash
   cp .env .env.local
   ```

3. **Configure Environment Variables**
   Edit `.env` file:
   ```env
   # Server Configuration
   PORT=3000
   NODE_ENV=development
   FRONTEND_URL=http://localhost:3000

   # Security
   ADMIN_TOKEN=your-secure-admin-token-here-change-this

   # Discord Webhook
   DISCORD_WEBHOOK_URL=https://discord.com/api/webhooks/your-webhook-id/your-webhook-token
   ```

## 🚀 Running the Application

### Development Mode
```bash
npm run dev
```

### Production Mode
```bash
npm start
```

The server will start on `http://localhost:3000`

## 📡 API Endpoints

### Public Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/` | Serve the main HTML page |
| GET | `/api/health` | Health check endpoint |
| POST | `/api/register` | Register new player/guard |

### Admin Endpoints

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/api/admin/registrations` | Get all registrations | Bearer Token |

### Registration Data Structure

**Player Registration:**
```json
{
  "role": "player",
  "firstName": "John",
  "lastName": "Doe",
  "class": "7A",
  "timestamp": "2024-01-01T12:00:00.000Z"
}
```

**Guard Registration:**
```json
{
  "role": "guard",
  "name": "Jane Smith",
  "class": "7B",
  "phone": "+1234567890",
  "bringsPhone": "yes",
  "willingToHelp": "yes",
  "timestamp": "2024-01-01T12:00:00.000Z"
}
```

## 🔐 Security Features Explained

### 1. Rate Limiting
- **General**: 100 requests per 15 minutes per IP
- **Registration**: 3 registrations per hour per IP
- Prevents spam and abuse

### 2. Input Validation
- Server-side validation using express-validator
- Sanitizes all user inputs
- Prevents malicious data injection

### 3. Security Headers
- XSS protection
- Content Security Policy
- Frame options protection
- HSTS headers

### 4. CORS Configuration
- Configurable allowed origins
- Credentials support
- Secure cross-origin requests

### 5. Database Security
- Parameterized queries prevent SQL injection
- Input sanitization
- Secure data storage

## 📊 Monitoring

### Health Check
```bash
curl http://localhost:3000/api/health
```

### Admin Dashboard
```bash
curl -H "Authorization: Bearer your-admin-token" \
     http://localhost:3000/api/admin/registrations
```

## 🔧 Configuration

### Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `PORT` | Server port | 3000 |
| `NODE_ENV` | Environment mode | development |
| `FRONTEND_URL` | Frontend URL for CORS | http://localhost:3000 |
| `ADMIN_TOKEN` | Admin authentication token | (required) |
| `DISCORD_WEBHOOK_URL` | Discord webhook URL | (optional) |

### Database

The system uses SQLite for data persistence:
- **File**: `registrations.db`
- **Tables**: `registrations`, `webhook_logs`
- **Auto-creation**: Tables are created automatically on startup

## 🚨 Security Best Practices

1. **Change Admin Token**: Always change the default admin token
2. **HTTPS**: Use HTTPS in production
3. **Environment Variables**: Never commit `.env` files
4. **Regular Updates**: Keep dependencies updated
5. **Monitoring**: Monitor logs for suspicious activity
6. **Backup**: Regular database backups

## 📝 Development

### Project Structure
```
├── server.js          # Main server file
├── package.json       # Dependencies
├── .env              # Environment variables
├── index.html        # Frontend
├── registrations.db  # Database (auto-created)
└── README.md         # Documentation
```

### Adding New Features
1. Create new routes in server.js
2. Add validation middleware
3. Update database schema if needed
4. Add frontend functionality
5. Update documentation

## 🐛 Troubleshooting

### Common Issues

1. **Port Already in Use**
   ```bash
   # Kill process using port 3000
   lsof -ti:3000 | xargs kill -9
   ```

2. **Database Locked**
   - Restart the server
   - Check file permissions
   - Ensure no other processes are using the database

3. **Discord Webhook Not Working**
   - Verify webhook URL in .env
   - Check Discord webhook permissions
   - Review server logs for errors

### Logs

Server logs are displayed in the console:
- Request logs (Morgan)
- Database operations
- Webhook status
- Error messages

## 📄 License

This project is for educational purposes. Please ensure compliance with your organization's security policies before deploying to production.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

---

**⚠️ Important**: This system handles personal data. Ensure compliance with data protection regulations (GDPR, CCPA, etc.) in your jurisdiction.
