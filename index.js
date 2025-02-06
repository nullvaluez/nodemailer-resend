import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import express from 'express';
import cors from 'cors';
import { transporter } from './utils/transport.js';
import { verifyTurnstileToken } from './utils/turnstile.js';
import { getDomainConfig, domainEmailMap } from './config/domainMap.js';
import rateLimit from 'express-rate-limit';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
dotenv.config({ path: path.resolve(__dirname, '.env') });

// Verify required environment variables
const requiredEnvVars = ['PORT', 'NODE_ENV', 'RESEND_API_KEY'];
for (const varName of requiredEnvVars) {
    if (!process.env[varName]) {
        console.error(`❌ Missing required environment variable: ${varName}`);
        process.exit(1);
    }
}

// Create Express app
export async function createRequestListener() {
    const app = express();
    const PORT = process.env.PORT || 3001;

    // Parse allowed origins
    const allowedOrigins = [
        ...Object.keys(domainEmailMap).map(domain => `https://${domain}`),
        'http://localhost:3000',
        'http://127.0.0.1:3000',
        null // Allow null origin in development
    ];

    // Configure CORS
    app.use(cors({
        origin: function(origin, callback) {
            console.log('Incoming request from origin:', origin);

            // In development, allow all origins
            if (process.env.NODE_ENV === 'development') {
                return callback(null, true);
            }
            
            // In production, check against allowed origins
            if (!allowedOrigins.includes(origin)) {
                console.log('Blocked origin:', origin);
                return callback(new Error('Not allowed by CORS'));
            }

            console.log('Allowed origin:', origin);
            return callback(null, true);
        },
        methods: ['POST', 'GET', 'OPTIONS'],
        credentials: true,
        allowedHeaders: ['Content-Type', 'Origin']
    }));

    // Middleware to parse URL-encoded data and JSON
    app.use(express.urlencoded({ extended: true }));
    app.use(express.json());

    // Rate limiting middleware
    const limiter = rateLimit({
        windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000,
        max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100
    });
    app.use(limiter);

    // Get site key endpoint
    app.get('/turnstile-key/:domain', (req, res) => {
        const { domain } = req.params;
        const config = domainEmailMap[domain];

        if (!config || !config.turnstile || !config.turnstile.siteKey) {
            return res.status(404).json({ error: 'Domain not found or missing Turnstile configuration' });
        }

        res.json({ siteKey: config.turnstile.siteKey });
    });

    // Submit endpoint
    app.post('/submit', async (req, res) => {
        const origin = req.get('origin') || 'http://localhost:3000'; // Default for local testing
        const clientIp = req.get('CF-Connecting-IP') || req.get('x-forwarded-for') || req.socket.remoteAddress;
        
        try {
            // Get form data from either JSON or form-urlencoded
            const formData = req.body;
            const turnstileToken = formData['cf-turnstile-response'];
            
            // Remove turnstile token from form data
            delete formData['cf-turnstile-response'];

            // Get domain configuration
            const domainConfig = getDomainConfig(origin);
            
            // Validate the request
            if (!formData || Object.keys(formData).length === 0) {
                return res.status(400).json({ 
                    error: 'Missing form data',
                    redirect: `${origin}/form-error`
                });
            }

            if (!domainConfig) {
                return res.status(403).json({ 
                    error: 'Unauthorized domain',
                    redirect: `${origin}/form-error`
                });
            }

            if (!turnstileToken) {
                return res.status(400).json({
                    error: 'Missing Turnstile verification',
                    redirect: `${origin}/form-error`
                });
            }

            // Verify Turnstile token
            const isValidToken = await verifyTurnstileToken(
                turnstileToken,
                domainConfig.turnstile.secretKey,
                clientIp
            );

            if (!isValidToken) {
                return res.status(400).json({
                    error: 'Invalid Turnstile verification',
                    redirect: `${origin}/form-error`
                });
            }

            // Create HTML representation of the form data
            let htmlContent = `
            <!DOCTYPE html>
            <html>
            <head>
                <style>
                    body { font-family: Arial, sans-serif; }
                    .container { padding: 20px; }
                    table { width: 100%; border-collapse: collapse; margin-top: 20px; }
                    th, td { border: 1px solid #ddd; padding: 12px; text-align: left; }
                    th { background-color: #f8f9fa; }
                    .header { background-color: #f8f9fa; padding: 20px; border-radius: 5px; margin-bottom: 20px; }
                    .origin { color: #666; font-size: 0.9em; }
                </style>
            </head>
            <body>
                <div class="container">
                    <div class="header">
                        <h2>New Form Submission</h2>
                        <p class="origin">From: ${origin || 'Unknown origin'}</p>
                    </div>
                    <table>
                        <thead>
                            <tr>
                                <th>Field</th>
                                <th>Value</th>
                            </tr>
                        </thead>
                        <tbody>
            `;

            for (const [field, value] of Object.entries(formData)) {
                // Sanitize the data to prevent XSS
                const sanitizedField = field.replace(/[<>]/g, '');
                const sanitizedValue = typeof value === 'string' ? 
                    value.replace(/[<>]/g, '') : value;

                htmlContent += `
                    <tr>
                        <td>${sanitizedField}</td>
                        <td>${sanitizedValue}</td>
                    </tr>
                `;
            }

            htmlContent += `
                        </tbody>
                    </table>
                </div>
            </body>
            </html>`;

            // Define the email options using domain configuration
            const mailOptions = {
                from: `"${domainConfig.fromName}" <${domainConfig.fromAddress}>`,
                to: domainConfig.to,
                cc: domainConfig.cc,
                bcc: domainConfig.bcc,
                subject: `New Form Submission from ${new URL(origin).hostname}`,
                html: htmlContent,
                replyTo: formData.email || null
            };

            // Send the email
            await transporter.sendMail(mailOptions);

            // Always respond with JSON
            res.status(200).json({
                success: true,
                message: 'Form submission sent successfully',
                redirect: `${origin}/form-success`
            });
        } catch (error) {
            console.error('Error processing submission:', error);
            
            // Always respond with JSON
            res.status(500).json({
                success: false,
                message: 'There was an error processing your submission',
                error: process.env.NODE_ENV === 'development' ? error.message : undefined,
                redirect: `${origin}/form-error`
            });
        }
    });

    // Health check endpoint
    app.get('/health', (req, res) => {
        const timestamp = new Date().toISOString();
        const uptime = process.uptime();
        const status = {
            status: 'healthy',
            timestamp,
            uptime: `${Math.floor(uptime)}s`,
            environment: process.env.NODE_ENV,
            memory: process.memoryUsage()
        };
        
        console.log(`[${timestamp}] Health check - Status: healthy, Uptime: ${Math.floor(uptime)}s`);
        res.status(200).json(status);
    });

    return app;
}

// Start server if running directly (not imported as a module)
if (import.meta.url === `file://${process.argv[1]}`) {
    const app = await createRequestListener();
    const PORT = process.env.PORT || 3001;
    
    app.listen(PORT, () => {
        console.log(`Email routing server is running on port ${PORT}`);
        console.log(`Allowed origins:`, allowedOrigins);
    });
}


