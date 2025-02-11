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

## Prerequisites

- Node.js 18+ (LTS recommended)
- A Resend account (get one at [resend.com](https://resend.com))
- A Cloudflare account for Turnstile (set up at [cloudflare.com](https://cloudflare.com))

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
