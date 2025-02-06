const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });
const { verifyTransporter } = require('../utils/transport');
const { domainEmailMap } = require('../config/domainMap');

async function verifySetup() {
    console.log('\nVerifying Email Router Setup...\n');

    // Check environment variables
    console.log('1. Checking Environment Variables:');
    const requiredEnvVars = ['PORT', 'NODE_ENV', 'RESEND_API_KEY'];
    let envOk = true;
    
    for (const varName of requiredEnvVars) {
        if (!process.env[varName]) {
            console.log(`❌ Missing ${varName} in .env file`);
            envOk = false;
        } else {
            console.log(`✅ ${varName} is set to: ${varName === 'RESEND_API_KEY' ? '********' : process.env[varName]}`);
        }
    }

    if (!envOk) {
        console.log('\n❌ Environment variables check failed. Please check your .env file.');
        console.log(`Looking for .env file at: ${path.resolve(__dirname, '../.env')}`);
        return;
    }

    // Check domain configurations
    console.log('\n2. Checking Domain Configurations:');
    for (const [domain, config] of Object.entries(domainEmailMap)) {
        console.log(`\nDomain: ${domain}`);
        
        // Check required fields
        const requiredFields = ['to', 'fromAddress', 'fromName', 'turnstile'];
        let configOk = true;
        
        for (const field of requiredFields) {
            if (!config[field]) {
                console.log(`❌ Missing ${field}`);
                configOk = false;
            } else {
                console.log(`✅ ${field} is set`);
            }
        }

        // Check Turnstile configuration
        if (config.turnstile) {
            if (!config.turnstile.siteKey) {
                console.log('❌ Missing Turnstile site key');
                configOk = false;
            } else {
                console.log('✅ Turnstile site key is set');
            }
            
            if (!config.turnstile.secretKey) {
                console.log('❌ Missing Turnstile secret key');
                configOk = false;
            } else {
                console.log('✅ Turnstile secret key is set');
            }
        }
    }

    // Verify Resend connection
    console.log('\n3. Verifying Resend Connection:');
    try {
        const isValid = await verifyTransporter();
        if (isValid) {
            console.log('✅ Successfully connected to Resend');
        } else {
            console.log('❌ Failed to connect to Resend');
        }
    } catch (error) {
        console.log('❌ Error connecting to Resend:', error.message);
    }

    console.log('\nSetup verification complete!');
}

verifySetup(); 