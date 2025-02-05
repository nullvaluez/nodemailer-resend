const { getTransporter, verifyTransporter } = require('../utils/transport');
const { domainEmailMap } = require('../config/domainMap');

async function testEmailConnection() {
    try {
        const config = domainEmailMap['blowpopmedia.com'];
        
        console.log('Testing SMTP connection...');
        const isValid = await verifyTransporter(config.smtp);
        
        if (isValid) {
            console.log('✅ SMTP connection successful!');
            
            // Try sending a test email
            console.log('Sending test email...');
            const transporter = getTransporter(config.smtp);
            
            await transporter.sendMail({
                from: `"Test Email" <${config.smtp.auth.user}>`,
                to: config.to,
                subject: 'Test Email - Email Router',
                text: 'If you receive this email, the SMTP configuration is working correctly!',
                html: `
                    <h2>Email Router Test</h2>
                    <p>If you receive this email, the SMTP configuration is working correctly!</p>
                    <p>Configuration tested:</p>
                    <ul>
                        <li>SMTP Host: ${config.smtp.host}</li>
                        <li>Port: ${config.smtp.port}</li>
                        <li>User: ${config.smtp.auth.user}</li>
                    </ul>
                `
            });
            
            console.log('✅ Test email sent successfully!');
        } else {
            console.error('❌ SMTP connection failed');
        }
    } catch (error) {
        console.error('❌ Error:', error.message);
    }
}

testEmailConnection(); 