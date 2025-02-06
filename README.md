# Email Router with Cloudflare Turnstile

A secure, production-ready email routing system for handling form submissions with Cloudflare Turnstile protection. Built with Node.js, Express, and Resend.

## Features

- 🛡️ **Cloudflare Turnstile Integration** - Bot protection without the UX compromise
- 📧 **Resend Email Integration** - Modern, reliable email delivery
- 🌐 **Multi-Domain Support** - Handle forms from multiple domains with different configurations
- 🔒 **Security Features**:
  - CORS protection
  - Rate limiting
  - XSS prevention
  - Input validation
- 🧪 **Test Environment** - Complete test setup for local development 
- 🚦 **Health Checks** - Monitor system status and performance
- ⚡ **Performance Optimized** - Efficient request handling with proper error management
- ☁️ **Cloudflare Ready** - Easy deployment to Cloudflare Pages

## Prerequisites

- Node.js 18+ (LTS recommended)
- A Resend account (get one at [resend.com](https://resend.com))
- A Cloudflare account for Turnstile and Pages (set up at [cloudflare.com](https://cloudflare.com))
- Wrangler CLI (install with `npm install -g wrangler`)

## Quick Start

1. Clone the repository:
   ```bash
   git clone https://github.com/yourusername/email-router.git
   cd email-router
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Set up environment variables:
   ```bash
   cp .env.example .env
   ```
   Edit `.env` with your settings:
   - `PORT`: Server port (default: 3001)
   - `NODE_ENV`: 'development' or 'production'
   - `RESEND_API_KEY`: Your Resend API key

4. Configure your domains in `config/domainMap.js`:
   ```javascript
   {
     'yourdomain.com': {
       to: 'recipient@yourdomain.com',
       fromAddress: 'noreply@yourdomain.com',
       fromName: 'Your Form Name',
       turnstile: {
         siteKey: 'YOUR_TURNSTILE_SITE_KEY',
         secretKey: 'YOUR_TURNSTILE_SECRET_KEY'
       }
     }
   }
   ```

5. **IMPORTANT**: Verify your setup first:
   ```bash
   npm run verify
   ```
   This script will check:
   - Environment variables
   - Domain configurations
   - Resend API connection
   - Turnstile configuration
   
   Fix any issues before proceeding.

## Testing

### 1. Initial Verification (Required)
Always start with verifying your setup:
```bash
npm run verify
```
This ensures all configurations are correct before running the servers.

### 2. Start the Servers
Once verification passes, start both servers:

a. Start the main server:
```bash
npm run dev
```

b. In a new terminal, start the test server:
```bash
npm run test:server
```

### 3. Test the Form
1. Open `http://localhost:3000` in your browser
2. You should see a test form with:
   - Name field
   - Email field
   - Message field
   - Turnstile widget
3. Fill out the form and submit
4. Check your configured email for the test message

### 4. Monitoring
- Watch the server console for request logs
- Check the browser console for client-side logs
- Monitor the debug panel below the form for detailed information

## Development vs Production

### Development Mode
- Set `NODE_ENV=development` in `.env`
- Uses Cloudflare Turnstile test keys
- Allows all CORS origins
- Detailed error messages
- Test form available at `http://localhost:3000`

### Production Mode
- Set `NODE_ENV=production` in `.env`
- Requires valid Cloudflare Turnstile keys
- Strict CORS policy (configured domains only)
- Limited error information in responses
- Rate limiting enforced

## API Endpoints

### POST /submit
Handles form submissions with the following requirements:
- Valid Turnstile token
- JSON body with form data
- Origin from configured domain

### GET /health
Returns server health status and metrics.

### GET /turnstile-key/:domain
Returns the Turnstile site key for the specified domain.

## Security Considerations

1. **API Keys**: Never commit `.env` file with real keys
2. **CORS**: Configure allowed origins carefully
3. **Rate Limiting**: Adjust limits based on your needs
4. **Validation**: All inputs are sanitized and validated

## Troubleshooting

### Common Issues

1. **Verification Script Failures**
   - Check your Resend API key
   - Verify environment variables
   - Ensure domain configurations are complete
   - Check email address formats

2. **CORS Errors**
   - Check allowed origins in configuration
   - Verify protocol (http/https) matches
   - Ensure test server is running on port 3000
   - Ensure main server is running on port 3001

3. **Email Not Sending**
   - Verify Resend API key
   - Check domain verification status
   - Confirm sender email is verified
   - Check server logs for detailed errors

4. **Turnstile Not Working**
   - Verify site and secret keys
   - Check browser console for errors
   - Ensure domain is configured
   - Test with development keys first

## Contributing

1. Fork the repository
2. Create your feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

## License

MIT License - feel free to use this in your own projects!

## Support

- Create an issue for bugs or feature requests
- Star the repository if you find it useful
- Contributions welcome!

## Cloudflare Pages Deployment

### 1. Install Wrangler
```bash
npm install -g wrangler
```

### 2. Login to Cloudflare
```bash
wrangler login
```

### 3. Configure Environment Variables
1. Go to Cloudflare Pages dashboard
2. Select your project
3. Go to Settings > Environment Variables
4. Add the following variables:
   - `RESEND_API_KEY`: Your Resend API key
   - `NODE_ENV`: Set to 'development' or 'production'
   - `RATE_LIMIT_WINDOW_MS`: Rate limit window (default: 900000)
   - `RATE_LIMIT_MAX_REQUESTS`: Max requests per window (default: 100)

### 4. Deploy
```bash
# Development deployment
wrangler deploy --env development

# Production deployment
wrangler deploy --env production
```

### 5. Configure Domain
1. Go to your Cloudflare Pages project
2. Click on "Custom Domains"
3. Add your domain
4. Update your domain's DNS settings

### 6. Test the Deployment
1. Visit your deployed site (e.g., https://email-router-demo.pages.dev)
2. Use the test form at /test
3. Monitor the Function Logs in Cloudflare Dashboard

### Environment Variables in Cloudflare

You can set environment variables in three ways:
1. **Wrangler.toml** (for development)
2. **Cloudflare Dashboard** (for production)
3. **Command Line**:
   ```bash
   wrangler secret put RESEND_API_KEY
   ```

### Development vs Production on Cloudflare

#### Development
- Uses `.dev` subdomain
- Detailed error messages
- Test mode enabled
- Cloudflare Turnstile test keys

#### Production
- Uses custom domain
- Limited error information
- Rate limiting enabled
- Production Turnstile keys

### Cloudflare-Specific Issues

1. **Deployment Failures**
   - Check wrangler.toml configuration
   - Verify environment variables are set
   - Check function size limits
   - Review build logs

2. **Environment Variables**
   - Verify variables in Cloudflare Dashboard
   - Check environment selection (dev/prod)
   - Use wrangler secret list to verify

3. **Domain Configuration**
   - Verify DNS settings
   - Check SSL/TLS configuration
   - Ensure domain is active in Cloudflare 
