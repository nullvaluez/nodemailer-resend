const express = require('express');
const path = require('path');
const cors = require('cors');

const app = express();
const PORT = 3000;

// Error handling middleware
const errorHandler = (err, req, res, next) => {
    console.error('Server error:', err.stack);
    res.status(500).json({
        error: 'Internal Server Error',
        message: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong'
    });
};

// Request logging middleware
const requestLogger = (req, res, next) => {
    const timestamp = new Date().toISOString();
    console.log(`[${timestamp}] ${req.method} ${req.url}`);
    next();
};

// Enable CORS for the main API server
app.use(cors({
    origin: ['http://localhost:3001', 'http://127.0.0.1:3001'],
    credentials: true,
    methods: ['GET', 'POST', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Origin', 'cf-turnstile-response']
}));

// Add request logging
app.use(requestLogger);

// Serve static files from test directory
app.use(express.static(__dirname, {
    setHeaders: (res, path) => {
        if (path.endsWith('.html')) {
            // Set security headers for HTML files
            res.setHeader('X-Content-Type-Options', 'nosniff');
            res.setHeader('X-Frame-Options', 'DENY');
            res.setHeader('X-XSS-Protection', '1; mode=block');
        }
    }
}));

// Serve the test page
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// Success page
app.get('/form-success', (req, res) => {
    res.send(`
        <!DOCTYPE html>
        <html>
        <head>
            <title>Form Submission Success</title>
            <style>
                body {
                    font-family: Arial, sans-serif;
                    max-width: 600px;
                    margin: 40px auto;
                    padding: 20px;
                    background: #f5f5f5;
                }
                .success-container {
                    background: white;
                    padding: 20px;
                    border-radius: 8px;
                    box-shadow: 0 2px 4px rgba(0,0,0,0.1);
                    text-align: center;
                }
                .success-icon {
                    color: #4CAF50;
                    font-size: 48px;
                    margin-bottom: 20px;
                }
                .back-link {
                    display: inline-block;
                    margin-top: 20px;
                    color: #2196F3;
                    text-decoration: none;
                }
                .back-link:hover {
                    text-decoration: underline;
                }
            </style>
        </head>
        <body>
            <div class="success-container">
                <div class="success-icon">✓</div>
                <h1>Thank You!</h1>
                <p>Your form has been submitted successfully.</p>
                <a href="/" class="back-link">← Return to Form</a>
            </div>
        </body>
        </html>
    `);
});

// Error page
app.get('/form-error', (req, res) => {
    res.status(500).send(`
        <!DOCTYPE html>
        <html>
        <head>
            <title>Form Submission Error</title>
            <style>
                body {
                    font-family: Arial, sans-serif;
                    max-width: 600px;
                    margin: 40px auto;
                    padding: 20px;
                    background: #f5f5f5;
                }
                .error-container {
                    background: white;
                    padding: 20px;
                    border-radius: 8px;
                    box-shadow: 0 2px 4px rgba(0,0,0,0.1);
                    text-align: center;
                }
                .error-icon {
                    color: #f44336;
                    font-size: 48px;
                    margin-bottom: 20px;
                }
                .back-link {
                    display: inline-block;
                    margin-top: 20px;
                    color: #2196F3;
                    text-decoration: none;
                }
                .back-link:hover {
                    text-decoration: underline;
                }
            </style>
        </head>
        <body>
            <div class="error-container">
                <div class="error-icon">✕</div>
                <h1>Oops!</h1>
                <p>Something went wrong while submitting your form.</p>
                <p>Please try again.</p>
                <a href="/" class="back-link">← Return to Form</a>
            </div>
        </body>
        </html>
    `);
});

// Add error handling
app.use(errorHandler);

// Start server with error handling
const server = app.listen(PORT, () => {
    console.log(`
    Test server running at:
    - http://localhost:${PORT}
    
    Make sure the main server is running on port 3001.
    
    Environment: ${process.env.NODE_ENV || 'development'}
    CORS enabled for: http://localhost:3001
    `);
});

// Handle server shutdown gracefully
process.on('SIGTERM', () => {
    console.log('SIGTERM signal received: closing HTTP server');
    server.close(() => {
        console.log('HTTP server closed');
    });
});

process.on('SIGINT', () => {
    console.log('SIGINT signal received: closing HTTP server');
    server.close(() => {
        console.log('HTTP server closed');
    });
}); 