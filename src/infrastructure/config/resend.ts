import { Resend } from 'resend';

const apiKey = process.env.RESEND_API_KEY;
if (!apiKey) throw new Error('RESEND_API_KEY not set');

export const resend = new Resend(apiKey);
export const RESEND_FROM_EMAIL = process.env.RESEND_FROM_EMAIL || '';
export const APP_BASE_URL = process.env.APP_BASE_URL || 'http://localhost:3000';
