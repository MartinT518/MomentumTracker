# Deployment Guide

This guide covers deploying AetherRun to various platforms.

## 🚀 Quick Deploy Options

### Option 1: Vercel (Recommended for Frontend + Serverless)

1. **Install Vercel CLI**
   ```bash
   npm i -g vercel
   ```

2. **Deploy**
   ```bash
   vercel
   ```

3. **Environment Variables**
   Set these in Vercel dashboard:
   - `DATABASE_URL`
   - `SESSION_SECRET`
   - `OPENAI_API_KEY`
   - `STRIPE_SECRET_KEY`

### Option 2: Railway (Full-Stack)

1. **Connect GitHub Repository**
   - Go to [Railway](https://railway.app)
   - Connect your GitHub repository

2. **Add Environment Variables**
   - Set all required environment variables
   - Railway will auto-deploy on git push

### Option 3: DigitalOcean App Platform

1. **Create App**
   - Connect GitHub repository
   - Choose Node.js environment

2. **Configure Build**
   - Build command: `npm run build`
   - Run command: `npm start`

## 🐳 Docker Deployment

### Dockerfile
```dockerfile
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY . .
RUN npm run build

EXPOSE 5000

CMD ["npm", "start"]
```

### Docker Compose
```yaml
version: '3.8'
services:
  app:
    build: .
    ports:
      - "5000:5000"
    environment:
      - DATABASE_URL=postgresql://user:pass@db:5432/aetherrun
      - SESSION_SECRET=your-secret
    depends_on:
      - db
  
  db:
    image: postgres:15
    environment:
      - POSTGRES_DB=aetherrun
      - POSTGRES_USER=user
      - POSTGRES_PASSWORD=pass
    volumes:
      - postgres_data:/var/lib/postgresql/data

volumes:
  postgres_data:
```

## 🔧 Environment Configuration

### Required Variables
```env
DATABASE_URL=postgresql://username:password@hostname:port/database_name
SESSION_SECRET=your-super-secret-session-key-change-this-in-production
NODE_ENV=production
```

### Optional Variables
```env
OPENAI_API_KEY=your_openai_api_key
STRIPE_SECRET_KEY=your_stripe_secret_key
REDIS_URL=redis://localhost:6379
SENDGRID_API_KEY=your_sendgrid_api_key
```

### Client Environment Variables
```env
VITE_STRIPE_PUBLIC_KEY=your_stripe_public_key
VITE_APP_NAME=AetherRun
VITE_API_BASE_URL=https://your-api-domain.com
```

## 📊 Database Setup

### PostgreSQL Setup
1. Create database
2. Run migrations: `npm run db:push`
3. Seed data (optional): `npm run db:seed`

### Connection Pooling
For production, use connection pooling:
```env
DATABASE_URL=postgresql://user:pass@host:5432/db?pgbouncer=true&connection_limit=10
```

## 🔒 Security Checklist

- [ ] Set strong `SESSION_SECRET`
- [ ] Use HTTPS in production
- [ ] Configure CORS properly
- [ ] Set up rate limiting
- [ ] Enable database SSL
- [ ] Use environment variables for secrets
- [ ] Set up monitoring and logging

## 📈 Performance Optimization

### CDN Setup
- Use CDN for static assets
- Enable gzip compression
- Set proper cache headers

### Database Optimization
- Set up read replicas
- Configure connection pooling
- Add database indexes

### Monitoring
- Set up error tracking (Sentry)
- Monitor performance (New Relic)
- Set up uptime monitoring

## 🔄 CI/CD Pipeline

### GitHub Actions Example
```yaml
name: Deploy

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: 18
      - run: npm ci
      - run: npm run test
      - run: npm run build
      - run: npm run deploy
```

## 🆘 Troubleshooting

### Common Issues

1. **Database Connection Errors**
   - Check DATABASE_URL format
   - Verify database is accessible
   - Check firewall settings

2. **Build Failures**
   - Ensure all dependencies are installed
   - Check Node.js version compatibility
   - Verify environment variables

3. **Session Issues**
   - Set SESSION_SECRET
   - Check session store configuration
   - Verify cookie settings

### Health Checks
```bash
# Check application health
curl https://your-domain.com/api/health

# Check database connection
npm run db:check
```

