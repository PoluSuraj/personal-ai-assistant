import dotenv from "dotenv";
import nodemailer from "nodemailer";

dotenv.config({
	path: "./.env",
});

const SUPPORT_EMAIL = process.env.SUPPORT_EMAIL || "21a91a0547@aec.edu.in";
const SMTP_HOST = process.env.SMTP_HOST?.trim();
const SMTP_PORT = Number(process.env.SMTP_PORT || 587);
const SMTP_SECURE = String(process.env.SMTP_SECURE || "false").toLowerCase() === "true";
const BREVO_API_KEY = process.env.BREVO_API_KEY?.trim();

const createTransporter = () => {
	const mailId = process.env.MAIL_ID?.trim();
	const mailPassword = process.env.MAIL_PASSWORD?.trim();

	if (!mailId || !mailPassword) {
		return null;
	}

	const cleanPassword = mailPassword.replace(/\s/g, "");

	if (SMTP_HOST) {
		return nodemailer.createTransport({
			host: SMTP_HOST,
			port: SMTP_PORT,
			secure: SMTP_SECURE,
			logger: false,
			debug: false,
			auth: {
				user: mailId,
				pass: cleanPassword,
			},
		});
	}

	return nodemailer.createTransport({
		service: "gmail",
		secure: true,
		port: 465,
		logger: false,
		debug: false,
		auth: {
			user: mailId,
			pass: cleanPassword,
		},
	});
};

const sendWithBrevoApi = async ({ to, subject, textContent, htmlContent }) => {
	if (!BREVO_API_KEY) {
		return null;
	}

	const senderEmail = process.env.SUPPORT_EMAIL?.trim() || process.env.MAIL_ID?.trim();
	const senderName = "Personal AI Assistant";

	const response = await fetch("https://api.brevo.com/v3/smtp/email", {
		method: "POST",
		headers: {
			accept: "application/json",
			"content-type": "application/json",
			"api-key": BREVO_API_KEY,
		},
		body: JSON.stringify({
			sender: {
				name: senderName,
				email: senderEmail,
			},
			to: [{ email: to }],
			subject,
			textContent,
			htmlContent,
			replyTo: {
				email: SUPPORT_EMAIL,
				name: senderName,
			},
		}),
	});

	if (!response.ok) {
		const details = await response.text();
		throw new Error(`Brevo API ${response.status}: ${details}`);
	}

	return response.json();
};

const sendMail = async ({ to, subject, textContent, htmlContent }) => {
	if (BREVO_API_KEY) {
		return sendWithBrevoApi({ to, subject, textContent, htmlContent });
	}

	const mailId = process.env.MAIL_ID?.trim();
	const mailPassword = process.env.MAIL_PASSWORD?.trim();

	if (!mailId || !mailPassword) {
		return null;
	}

	const transporter = createTransporter();
	await transporter.verify();
	return transporter.sendMail({
		from: `"Personal AI Assistant" <${mailId}>`,
		to,
		replyTo: SUPPORT_EMAIL,
		subject,
		text: textContent,
		html: htmlContent,
	});
};

const sendOtpMail = async (to, otp) => {
	const mailId = process.env.MAIL_ID?.trim();
	const mailPassword = process.env.MAIL_PASSWORD?.trim();

	if (!BREVO_API_KEY && (!mailId || !mailPassword)) {
		console.log(`Email not configured. OTP for ${to}: ${otp}`);
		return { sent: false, otp };
	}

	const subject = "Your OTP Code for Secure Login";
	const textContent = `Dear user,\n\nYour One-Time Password (OTP) is: ${otp}\n\nThis code is valid for 10 minutes. Please do not share it with anyone.\n\nIf you did not request this, please ignore this email.\n\nBest regards,\nPAT @ PERSONAL AI TUTOR PVT. LTD.`;
	const htmlContent = `
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
	</div>`;

	try {
		const info = await sendMail({ to, subject, textContent, htmlContent });
		console.log(`OTP Email sent successfully to ${to}. Message ID: ${info?.messageId || info?.messageId || "n/a"}`);
		return { sent: true };
	} catch (error) {
		console.error(`❌ Error sending OTP email to ${to}:`, error.message);
		console.log(`OTP for ${to}: ${otp} (email sending failed)`);
		return { sent: false, otp, error: error.message };
	}
};

const sendResetMail = async (to, token) => {
	const mailId = process.env.MAIL_ID?.trim();
	const mailPassword = process.env.MAIL_PASSWORD?.trim();

	if (!BREVO_API_KEY && (!mailId || !mailPassword)) {
		console.log(`⚠️  Email not configured. Reset token for ${to}: ${token}`);
		return;
	}

	try {
		const frontend = process.env.FRONTEND_URL || "http://localhost:5173";
		const resetUrl = `${frontend}/reset-password?token=${token}`;
		const info = await sendMail({
			to,
			subject: "Password Reset Instructions",
			textContent: `You requested a password reset. Use this link: ${resetUrl}`,
			htmlContent: `
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

		console.log(`✅ Reset Email sent to ${to}. Message ID: ${info?.messageId || "n/a"}`);
	} catch (error) {
		console.error(`❌ Error sending reset email to ${to}:`, error.message);
		console.log(`⚠️  Reset token for ${to}: ${token}`);
	}
};

const sendContactMail = async (to, name) => {
	const mailId = process.env.MAIL_ID?.trim();
	const mailPassword = process.env.MAIL_PASSWORD?.trim();

	if (!BREVO_API_KEY && (!mailId || !mailPassword)) {
		console.log(`⚠️  Email not configured. Contact confirmation for ${to}`);
		return;
	}

	try {
		const info = await sendMail({
			to,
			subject: "We received your message",
			textContent: `Hi ${name},\n\nThank you for reaching out to us. We have received your message and will get back to you as soon as possible.\n\nBest regards,\nPAT Team`,
			htmlContent: `
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

		console.log(`✅ Contact confirmation email sent to ${to}. Message ID: ${info?.messageId || "n/a"}`);
	} catch (error) {
		console.error(`❌ Error sending contact confirmation to ${to}:`, error.message);
	}
};

export { sendOtpMail, sendResetMail, sendContactMail };
