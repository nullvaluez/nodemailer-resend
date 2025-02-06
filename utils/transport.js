const { Resend } = require('resend');

if (!process.env.RESEND_API_KEY) {
    throw new Error('RESEND_API_KEY environment variable is not set');
}

const resend = new Resend(process.env.RESEND_API_KEY);

// Retry configuration
const RETRY_ATTEMPTS = 3;
const RETRY_DELAY = 1000; // 1 second

const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// Create a transporter-like interface for Resend
const transporter = {
    sendMail: async (mailOptions) => {
        let lastError;
        
        for (let attempt = 1; attempt <= RETRY_ATTEMPTS; attempt++) {
            try {
                // Validate required fields
                if (!mailOptions.from) throw new Error('From address is required');
                if (!mailOptions.to) throw new Error('To address is required');
                if (!mailOptions.subject) throw new Error('Subject is required');
                if (!mailOptions.html && !mailOptions.text) {
                    throw new Error('Either HTML or text content is required');
                }

                const result = await resend.emails.send({
                    from: mailOptions.from,
                    to: mailOptions.to,
                    cc: mailOptions.cc,
                    bcc: mailOptions.bcc,
                    reply_to: mailOptions.replyTo,
                    subject: mailOptions.subject,
                    html: mailOptions.html,
                    text: mailOptions.text
                });
                
                if (result.error) {
                    throw new Error(result.error.message);
                }
                
                console.log(`Email sent successfully on attempt ${attempt}`);
                return { success: true, messageId: result.id };
            } catch (error) {
                lastError = error;
                console.error(`Attempt ${attempt} failed:`, error.message);
                
                // Don't retry if it's a validation error
                if (error.message.includes('required')) {
                    throw error;
                }
                
                // Don't retry on the last attempt
                if (attempt < RETRY_ATTEMPTS) {
                    await sleep(RETRY_DELAY * attempt); // Exponential backoff
                    continue;
                }
            }
        }
        
        throw new Error(`Failed to send email after ${RETRY_ATTEMPTS} attempts. Last error: ${lastError.message}`);
    }
};

// Verify Resend connection
const verifyTransporter = async () => {
    try {
        // Try to send a test email
        const result = await resend.emails.send({
            from: 'onboarding@resend.dev',
            to: 'delivered@resend.dev',
            subject: 'Test Email',
            html: '<p>Test email from Email Router</p>'
        });

        if (result.error) {
            console.error('Resend verification error:', result.error.message);
            return false;
        }

        return true;
    } catch (error) {
        // If the error is about restricted API key, that's actually okay
        if (error.message.includes('restricted to only send emails')) {
            return true;
        }
        console.error('Resend verification error:', error.message);
        return false;
    }
};

module.exports = {
    transporter,
    verifyTransporter
};

