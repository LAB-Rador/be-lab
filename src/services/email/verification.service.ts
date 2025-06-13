import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export default async function sendVarificationCode(email: string, code: string) {
    await resend.emails.send({
        from: 'onboarding@resend.dev',
        to: email,
        subject: 'Your Varification Code',
        html: `
            <div style="font-family: Arial, sans-serif; padding: 20px; color: #333;">
                <div style="text-align: center; margin-bottom: 30px;">
                    <img src="https://lucide.dev/icons/microscope" alt="Your Logo" width="120" />
                </div>
                <h2 style="text-align: center; color: #2d3748;">Welcome to Lab-Rador Assist</h2>
                <p style="text-align: center;">Your 6-digit verification code is:</p>
                <p style="font-size: 28px; font-weight: bold; text-align: center; color: #4a90e2;">
                    ${code}
                </p>
                <p style="text-align: center; font-size: 14px; color: #888;">This code will expire in 10 minutes.</p>
            </div>
        `,
    });
}
