import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

dotenv.config();

// Configure nodemailer transporter - FIXED: createTransport (not createTransporter)
const transporter = nodemailer.createTransport({
    service: process.env.EMAIL_SERVICE || 'gmail',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    }
});

// Email templates
const emailTemplates = {
    welcome: (userName, userEmail) => ({
        subject: '🎉 Welcome to MindCare-AI!',
        html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <h2 style="color: #483524;">Welcome to MindCare-AI, ${userName}!</h2>
                <p>Thank you for joining our mental health companion app. We're excited to support your wellness journey!</p>
                
                <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
                    <h3>What you can do with MindCare-AI:</h3>
                    <ul>
                        <li>📊 Track your mental health with AI-powered assessments</li>
                        <li>💓 Monitor vital signs using your phone camera</li>
                        <li>🤖 Chat with our AI companion for support</li>
                        <li>🎵 Access personalized music therapy</li>
                        <li>📈 View your progress over time</li>
                    </ul>
                </div>
                
                <p>Your account details:</p>
                <ul>
                    <li><strong>Email:</strong> ${userEmail}</li>
                    <li><strong>Account created:</strong> ${new Date().toLocaleDateString()}</li>
                </ul>
                
                <p style="color: #666;">Best regards,<br>The MindCare-AI Team</p>
            </div>
        `
    }),

    loginNotification: (userName, loginTime, deviceInfo) => ({
        subject: '🔐 New Login to Your MindCare-AI Account',
        html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <h2 style="color: #483524;">New Login Detected</h2>
                <p>Hello ${userName},</p>
                <p>We detected a new login to your MindCare-AI account:</p>
                
                <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
                    <p><strong>Time:</strong> ${loginTime}</p>
                    <p><strong>Device:</strong> ${deviceInfo || 'Mobile App'}</p>
                </div>
                
                <p>If this wasn't you, please contact our support team immediately.</p>
                <p style="color: #666;">Stay safe,<br>The MindCare-AI Team</p>
            </div>
        `
    })
};

// Send email function
export const sendEmail = async (to, templateType, templateData) => {
    try {
        const template = emailTemplates[templateType];
        if (!template) {
            throw new Error(`Template ${templateType} not found`);
        }

        const emailContent = template(...templateData);

        const mailOptions = {
            from: `"MindCare-AI Support" <${process.env.EMAIL_USER}>`,
            to: to,
            subject: emailContent.subject,
            html: emailContent.html
        };

        const result = await transporter.sendMail(mailOptions);
        console.log(`✅ Email sent successfully to ${to}:`, result.messageId);
        return { success: true, messageId: result.messageId };
    } catch (error) {
        console.error(`❌ Error sending email to ${to}:`, error);
        return { success: false, error: error.message };
    }
};

// Verify email configuration
export const verifyEmailConfig = async () => {
    try {
        await transporter.verify();
        console.log('✅ Email configuration verified');
        return true;
    } catch (error) {
        console.error('❌ Email configuration error:', error);
        return false;
    }
};