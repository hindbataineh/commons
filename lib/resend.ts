import { Resend } from "resend";

export const resend = new Resend(process.env.RESEND_API_KEY!);

export async function sendBookingConfirmation({
  to,
  eventName,
  eventDate,
  eventTime,
  eventLocation,
  communityName,
}: {
  to: string;
  memberName: string;
  eventName: string;
  eventDate: string;
  eventTime: string;
  eventLocation: string;
  communityName: string;
}) {
  return resend.emails.send({
    from: "Commons <no-reply@usecommons.co>",
    to,
    subject: `You're booked — ${eventName}`,
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
      </div>
    `,
  });
}
