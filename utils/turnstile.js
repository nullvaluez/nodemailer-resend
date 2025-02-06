const { Resend } = require('resend');
const fetch = require('node-fetch');
const { FormData } = require('formdata-node');
const crypto = require('crypto');

const verifyTurnstileToken = async (token, secretKey, remoteip) => {
    try {
        // Special handling for test site key
        if (secretKey === '1x0000000000000000000000000000000AA') {
            // When using the test keys, any token that starts with "XXXX." is considered valid
            if (token && token.startsWith('XXXX.')) {
                console.log('Test token validated successfully');
                return true;
            }
        }

        // For production keys, verify with Cloudflare
        const formData = new FormData();
        formData.append('secret', secretKey);
        formData.append('response', token);
        formData.append('remoteip', remoteip);
        
        // Add idempotency key for additional security
        const idempotencyKey = crypto.randomUUID();
        formData.append('idempotency_key', idempotencyKey);

        const url = 'https://challenges.cloudflare.com/turnstile/v0/siteverify';
        const response = await fetch(url, {
            body: formData,
            method: 'POST',
        });

        const data = await response.json();
        console.log('Turnstile verification response:', data);
        
        if (!data.success) {
            console.error('Turnstile validation failed:', data['error-codes']);
            return false;
        }

        return true;
    } catch (error) {
        console.error('Error verifying Turnstile token:', error);
        return false;
    }
};

module.exports = {
    verifyTurnstileToken
}; 