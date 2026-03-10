import dotenv from 'dotenv';
import { Resend } from 'resend';

dotenv.config();

const apiKey = process.env.RESEND_API_KEY;

if (!apiKey || apiKey.trim().length === 0) {
  throw new Error('RESEND_API_KEY is not defined');
}

export const resendClient = new Resend(apiKey);
