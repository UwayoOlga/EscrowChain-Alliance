import nodemailer from 'nodemailer';
import bcrypt from 'bcryptjs';
import db from './db.js';
import dotenv from 'dotenv';

dotenv.config();

const transporter = nodemailer.createTransport({
    service: 'gmail', // or your preferred service
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    }
});

export const generateOTP = () => {
    return Math.floor(100000 + Math.random() * 900000).toString();
};

export const sendOTPEmail = async (email, otp) => {
    const mailOptions = {
        from: `"EscrowChain Alliance" <${process.env.EMAIL_USER}>`,
        to: email,
        subject: 'Your Verification Code - EscrowChain Alliance',
        html: `
            <div style="font-family: sans-serif; max-width: 500px; margin: auto; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
                <h2 style="color: #2563eb; text-align: center;">Verify Your Account</h2>
                <p>Thank you for joining the Alliance. Use the following code to complete your registration:</p>
                <div style="background: #f3f4f6; padding: 20px; text-align: center; font-size: 32px; font-weight: bold; letter-spacing: 5px; color: #111827; border-radius: 8px;">
                    ${otp}
                </div>
                <p style="margin-top: 20px; font-size: 12px; color: #6b7280; text-align: center;">
                    This code will expire in 10 minutes. If you didn't request this, please ignore this email.
                </p>
            </div>
        `
    };

    return transporter.sendMail(mailOptions);
};

export const hashPassword = async (password) => {
    return await bcrypt.hash(password, 10);
};

export const comparePassword = async (password, hash) => {
    return await bcrypt.compare(password, hash);
};
