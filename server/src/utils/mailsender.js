import dotenv from "dotenv";
import nodemailer from "nodemailer";
dotenv.config({
	path: "./.env",
});

const SUPPORT_EMAIL = process.env.SUPPORT_EMAIL || "21a91a0547@aec.edu.in";

const sendOtpMail = async (to, otp) => {
	const mailId = process.env.MAIL_ID?.trim();
	const mailPassword = process.env.MAIL_PASSWORD?.trim();
	
	if (!mailId || !mailPassword) {
		console.log(`Email not configured. OTP for ${to}: ${otp}`);
		return { sent: false, otp };
	}

	try {
		const cleanPassword = mailPassword.replace(/\s/g, ''); // Remove spaces from App Password
		
		const transporter = nodemailer.createTransport({
			service: "gmail", // Using Gmail as the email service
			secure: true,
			port: 465,
			// Disable verbose debug logs (set to true if you need to troubleshoot)
			logger: false,
			debug: false,
			auth: {
				user: mailId,
				pass: cleanPassword,
			},
		});

		// Verify connection before sending
		await transporter.verify();

		const info = await transporter.sendMail({
			from: `"Personal AI Assistant" <${mailId}>`, // Sender address with name
			to, // Recipient
			replyTo: SUPPORT_EMAIL,
			subject: "Your OTP Code for Secure Login", // Professional subject line
			text: `Dear user,\n\nYour One-Time Password (OTP) is: ${otp}\n\nThis code is valid for 10 minutes. Please do not share it with anyone.\n\nIf you did not request this, please ignore this email.\n\nBest regards,\nPAT @ PERSONAL AI TUTOR PVT. LTD.`, // Plain text fallback
			html: `
			<div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
				<h2 style="color: #0d6efd;">Your One-Time Password (OTP)</h2>
				<p>Dear User,</p>
				<p>Your OTP for secure login is:</p>
				<h3 style="background: #f3f3f3; padding: 10px; display: inline-block; border-radius: 5px;">${otp}</h3>
				<p>This code is valid for <strong>10 minutes</strong>. Please do not share it with anyone.</p>
				<p>If you did not request this, please ignore this email.</p>
				<br>
				<p>Best regards,</p>
				<p><strong>Personal AI Assistant</strong></p>
			</div>
		  `, // HTML body
		});

		console.log(`OTP Email sent successfully to ${to}. Message ID: ${info.messageId}`);
		return { sent: true };
	} catch (error) {
		console.error(`❌ Error sending OTP email to ${to}:`, error.message);
		
		// Provide helpful error messages
		if (error.message.includes('BadCredentials') || error.message.includes('535')) {
			console.error(`\n⚠️  GMAIL AUTHENTICATION ERROR:`);
			console.error(`   The App Password for ${mailId} is incorrect or not set up.`);
			console.error(`   Steps to fix:`);
			console.error(`   1. Go to: https://myaccount.google.com/apppasswords`);
			console.error(`   2. Generate a new App Password for "Mail"`);
			console.error(`   3. Update MAIL_PASSWORD in your .env file`);
			console.error(`   4. Restart the server\n`);
		}
		
		console.log(`OTP for ${to}: ${otp} (email sending failed)`);
		return { sent: false, otp, error: error.message };
	}
};

export { sendOtpMail };

const sendResetMail = async (to, token) => {
	const mailId = process.env.MAIL_ID?.trim();
	const mailPassword = process.env.MAIL_PASSWORD?.trim();

	if (!mailId || !mailPassword) {
		console.log(`⚠️  Email not configured. Reset token for ${to}: ${token}`);
		return;
	}

	try {
		const cleanPassword = mailPassword.replace(/\s/g, '');
		const transporter = nodemailer.createTransport({
			service: 'gmail',
			secure: true,
			port: 465,
			logger: false,
			debug: false,
			auth: { user: mailId, pass: cleanPassword },
		});

		await transporter.verify();

		const frontend = process.env.FRONTEND_URL || 'http://localhost:5173';
		const resetUrl = `${frontend}/reset-password?token=${token}`;

		const info = await transporter.sendMail({
			from: `"Personal AI Assistant" <${mailId}>`,
			to,
			replyTo: SUPPORT_EMAIL,
			subject: 'Password Reset Instructions',
			text: `You requested a password reset. Use this link: ${resetUrl}`,
			html: `
			<div style="font-family: Arial, sans-serif; line-height:1.6; color:#333;">
			  <h2>Password reset request</h2>
			  <p>Click the link below to reset your password. This link is valid for a short time.</p>
			  <a href="${resetUrl}" style="display:inline-block;padding:10px 16px;background:#6b46c1;color:#fff;border-radius:6px;text-decoration:none;">Reset Password</a>
			  <p>If you did not request this, you can safely ignore this email.</p>
			  <p><strong>Personal AI Assistant Team </strong></p>
			  <p><strong>Personal AI Assistant </strong></p>
			</div>
		  `,
		});

		console.log(`✅ Reset Email sent to ${to}. Message ID: ${info.messageId}`);
	} catch (error) {
		console.error(`❌ Error sending reset email to ${to}:`, error.message);
		console.log(`⚠️  Reset token for ${to}: ${token}`);
	}
};

export { sendResetMail };

const sendContactMail = async (to, name) => {
    const mailId = process.env.MAIL_ID?.trim();
    const mailPassword = process.env.MAIL_PASSWORD?.trim();

    if (!mailId || !mailPassword) {
        console.log(`⚠️  Email not configured. Contact confirmation for ${to}`);
        return;
    }

    try {
        const cleanPassword = mailPassword.replace(/\s/g, '');
        const transporter = nodemailer.createTransport({
            service: 'gmail',
            secure: true,
            port: 465,
            logger: false,
            debug: false,
            auth: { user: mailId, pass: cleanPassword },
        });

        await transporter.verify();

        const info = await transporter.sendMail({
            from: `"Personal AI Assistant" <${mailId}>`,
            to,
            replyTo: SUPPORT_EMAIL,
            subject: 'We received your message',
            text: `Hi ${name},\n\nThank you for reaching out to us. We have received your message and will get back to you as soon as possible.\n\nBest regards,\nPAT Team`,
            html: `
            <div style="font-family: Arial, sans-serif; line-height:1.6; color:#333;">
              <h2>Thank You for Contacting Us!</h2>
              <p>Hi ${name},</p>
              <p>We have received your message and appreciate you taking the time to reach out to us.</p>
              <p>Our team will review your inquiry and respond within 24-48 hours.</p>
              <br>
              <p>Best regards,</p>
			  <p><strong>Personal AI Assistant Team </strong></p>
			  <p><strong>Personal AI Assistant </strong></p>
            </div>
          `,
        });

        console.log(`✅ Contact confirmation email sent to ${to}. Message ID: ${info.messageId}`);
    } catch (error) {
        console.error(`❌ Error sending contact confirmation to ${to}:`, error.message);
    }
};

export { sendContactMail };
