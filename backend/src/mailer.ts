import nodemailer from "nodemailer";
import type { Booking } from "./types";

function createTransport() {
  if (process.env.SMTP_ENABLED !== "true") return null;
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST ?? "smtp.gmail.com",
    port: Number(process.env.SMTP_PORT ?? 587),
    secure: false,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });
}

export async function sendBookingConfirmation(booking: Booking): Promise<void> {
  const transport = createTransport();
  if (!transport) return; // Email disabled — skip silently.

  const subject = `Booking Confirmed — ${booking.reference}`;
  const text = `
Hi ${booking.name},

Your booking request has been received at JEON ENGINEERING SERVICES.

Reference : ${booking.reference}
Service   : ${booking.serviceName}
Date      : ${booking.date}
Time      : ${booking.time}
Vehicle   : ${booking.vehicle}

We will contact you shortly to confirm your appointment.

Thank you,
JEON Engineering Services
`.trim();

  const html = `
<div style="font-family:Arial,sans-serif;max-width:560px;margin:0 auto;color:#18181b">
  <div style="background:#f97316;padding:24px 32px;border-radius:8px 8px 0 0">
    <h1 style="color:#fff;margin:0;font-size:20px">Booking Request Received</h1>
  </div>
  <div style="border:1px solid #e4e4e7;border-top:none;padding:32px;border-radius:0 0 8px 8px">
    <p>Hi <strong>${booking.name}</strong>,</p>
    <p>Your booking request has been received. Here are your details:</p>
    <table style="width:100%;border-collapse:collapse;margin:16px 0">
      <tr><td style="padding:8px 0;color:#71717a;width:120px">Reference</td><td style="padding:8px 0;font-weight:bold;font-family:monospace;font-size:16px">${booking.reference}</td></tr>
      <tr><td style="padding:8px 0;color:#71717a">Service</td><td style="padding:8px 0">${booking.serviceName}</td></tr>
      <tr><td style="padding:8px 0;color:#71717a">Date</td><td style="padding:8px 0">${booking.date}</td></tr>
      <tr><td style="padding:8px 0;color:#71717a">Time</td><td style="padding:8px 0">${booking.time}</td></tr>
      <tr><td style="padding:8px 0;color:#71717a">Vehicle</td><td style="padding:8px 0">${booking.vehicle}</td></tr>
    </table>
    <p style="color:#71717a;font-size:14px">We will contact you shortly to confirm your appointment. If you need to make changes, quote your reference number.</p>
    <p style="color:#71717a;font-size:14px">Thank you,<br><strong>JEON Engineering Services</strong></p>
  </div>
</div>
`.trim();

  await transport.sendMail({
    from: process.env.SMTP_FROM ?? "JEON Engineering <noreply@jeonengineering.example>",
    to: booking.email,
    subject,
    text,
    html,
  });
}
