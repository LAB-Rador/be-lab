import { Resend } from 'resend';
import { escapeHtml } from './html-escape.js';

const resend = new Resend(process.env.RESEND_API_KEY);

type ActionLinkEmail = {
    to: string;
    subject: string;
    heading: string;
    body: string;
    buttonLabel: string;
    url: string;
    footnote: string;
};

export async function sendActionLinkEmail(input: ActionLinkEmail): Promise<void> {
    const href = escapeHtml(input.url);
    await resend.emails.send({
        from: 'noreply@labradorassist.app',
        to: input.to,
        subject: input.subject,
        html: `
            <div style="font-family: Arial, sans-serif; padding: 20px; color: #333;">
                <div style="text-align: center; margin-bottom: 30px;">
                    <img src="https://labradorassist.app/favicon.ico" alt="Lab-Rador Logo" width="120" />
                </div>
                <h2 style="text-align: center; color: #2d3748;">${escapeHtml(input.heading)}</h2>
                <p style="text-align: center;">${escapeHtml(input.body)}</p>
                <div style="text-align: center; margin: 30px 0;">
                    <a href="${href}"
                       style="background-color: #4a90e2; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">
                        ${escapeHtml(input.buttonLabel)}
                    </a>
                </div>
                <p style="text-align: center; font-size: 14px; color: #888;">${escapeHtml(input.footnote)}</p>
                <p style="text-align: center; font-size: 12px; color: #a0aec0;">If you did not request this email, you can ignore it.</p>
            </div>
        `,
    });
}
