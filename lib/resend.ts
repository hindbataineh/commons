import { Resend } from "resend";

console.log("RESEND_API_KEY exists:", !!process.env.RESEND_API_KEY);
export const resend = new Resend(process.env.RESEND_API_KEY!);

export async function sendBookingConfirmation({
  to,
  memberName,
  eventName,
  eventDate,
  eventTime,
  eventLocation,
  communityName,
  bookingRef,
}: {
  to: string;
  memberName: string;
  eventName: string;
  eventDate: string;
  eventTime: string;
  eventLocation: string;
  communityName: string;
  bookingRef?: string;
}) {
  console.log('[email] attempting send to:', to)
  console.log('[email] from:', 'Commons <hello@join-commons.com>')
  const refLine = bookingRef ? ` Booking ref: ${bookingRef}.` : '';
  const result = await resend.emails.send({
    from: 'Commons <hello@join-commons.com>',
    replyTo: 'hello@join-commons.com',
    to,
    subject: `Booking confirmed: ${eventName}`,
    text: `Hi ${memberName}, your booking for ${eventName} on ${eventDate} at ${eventTime} is confirmed. Location: ${eventLocation}.${refLine} See you there!`,
    html: `
      <div style="font-family: sans-serif; max-width: 520px; margin: 0 auto; padding: 32px 24px; background: #FDFCFA; color: #1A1714;">
        <p style="font-size: 13px; color: #7A7569; margin: 0 0 24px;">${communityName}</p>
        <h1 style="font-size: 28px; font-weight: 600; margin: 0 0 8px;">You're in.</h1>
        <p style="color: #7A7569; margin: 0 0 32px;">See you at ${eventName}.</p>
        <div style="background: #F7F4EF; border-radius: 8px; padding: 20px; margin-bottom: 32px;">
          <p style="margin: 0 0 8px;"><strong>${eventName}</strong></p>
          <p style="margin: 0 0 4px; color: #7A7569; font-size: 14px;">${eventDate} at ${eventTime}</p>
          <p style="margin: 0; color: #7A7569; font-size: 14px;">${eventLocation}</p>
        </div>
        <p style="font-size: 13px; color: #7A7569;">You'll receive a reminder email before the event.</p>
        <p style="font-size: 11px; color: #999; margin-top: 32px;">Commons · Dubai, UAE · <a href="mailto:hello@join-commons.com" style="color: #999;">hello@join-commons.com</a></p>
      </div>
    `,
  })
  console.log('[email] resend result:', JSON.stringify(result))
  return result
}
