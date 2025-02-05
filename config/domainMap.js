const validateDomainConfig = (domain, config) => {
    const required = ['to', 'fromAddress', 'fromName', 'turnstile'];
    const missing = required.filter(field => !config[field]);
    
    if (missing.length > 0) {
        throw new Error(`Domain ${domain} is missing required fields: ${missing.join(', ')}`);
    }

    if (!config.turnstile.siteKey || !config.turnstile.secretKey) {
        throw new Error(`Domain ${domain} is missing Turnstile configuration`);
    }

    // Validate email addresses
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(config.to)) {
        throw new Error(`Domain ${domain} has invalid 'to' email address`);
    }
    if (!emailRegex.test(config.fromAddress)) {
        throw new Error(`Domain ${domain} has invalid 'fromAddress' email address`);
    }
    if (config.cc && !emailRegex.test(config.cc)) {
        throw new Error(`Domain ${domain} has invalid 'cc' email address`);
    }
    if (config.bcc && !emailRegex.test(config.bcc)) {
        throw new Error(`Domain ${domain} has invalid 'bcc' email address`);
    }
};

const domainEmailMap = {
    'localhost': {  // Local testing configuration
        to: 'your-email@example.com',  // Replace with your verified email for testing
        cc: null,
        bcc: null,
        fromAddress: 'onboarding@resend.dev',  // Default Resend test sender
        fromName: 'Local Test Form',
        turnstile: {
            siteKey: '1x00000000000000000000AA',  // Cloudflare's test site key
            secretKey: '1x0000000000000000000000000000000AA'  // Cloudflare's test secret key
        }
    },
    'example.com': {  // Example production configuration
        to: 'contact@example.com',
        cc: null,
        bcc: 'archive@example.com',
        fromAddress: 'noreply@example.com',
        fromName: 'Example Contact Form',
        turnstile: {
            siteKey: 'YOUR_CLOUDFLARE_SITE_KEY',
            secretKey: 'YOUR_CLOUDFLARE_SECRET_KEY'
        }
    }
};

// Validate all domain configurations on startup
Object.entries(domainEmailMap).forEach(([domain, config]) => {
    validateDomainConfig(domain, config);
});


// Helper function to get domain config
const getDomainConfig = (origin) => {
    if (!origin) return null;
    
    // Extract domain from origin URL
    try {
        const domain = new URL(origin).hostname;
        const config = domainEmailMap[domain];
        
        if (!config) {
            console.error(`No configuration found for domain: ${domain}`);
            return null;
        }

        return config;
    } catch (error) {
        console.error('Error parsing origin:', error);
        return null;
    }
};

// SMTP configuration for the email router server
const smtpConfig = {
    host: 'smtp.office365.com',
    port: 587,
    secure: false,
    auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
    },
};

module.exports = {
    domainEmailMap,
    getDomainConfig,
    smtpConfig
}; 