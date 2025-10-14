import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export default async function sendInvitationCode(email: string, code: string, labId: string, role: string) {
    const signupUrl = 'https://lab-rador-assist.vercel.app/signup';
    const joinLabUrl = 'https://lab-rador-assist.vercel.app/laboratory-setup?tab=join';

    await resend.emails.send({
        from: 'onboarding@resend.dev',
        to: email,
        subject: 'Your Invitation Code',
        html: `
            <div style="font-family: Arial, sans-serif; padding: 20px; color: #333;">
                <div style="text-align: center; margin-bottom: 30px;">
                    <img src="https://lab-rador-assist.vercel.app/favicon.ico" alt="Lab-Rador Logo" width="120" />
                </div>
                <h2 style="text-align: center; color: #2d3748;">Welcome to Lab-Rador Assist</h2>
                <p style="text-align: center;">You have been invited to join laboratory: <strong>${labId}</strong></p>
                <p style="text-align: center;">Your role will be: <strong>${role}</strong></p>
                
                <div style="background-color: #f7fafc; border-radius: 8px; padding: 20px; margin: 20px 0;">
                    <p style="text-align: center; margin-bottom: 10px;">Your 6-digit verification code is:</p>
                    <p style="font-size: 28px; font-weight: bold; text-align: center; color: #4a90e2; background-color: #e2e8f0; padding: 15px; border-radius: 6px; margin: 10px 0;">
                        ${code}
                    </p>
                </div>

                <div style="text-align: center; margin: 30px 0;">
                    <p style="margin-bottom: 15px;">Choose your next step:</p>
                    
                    <div style="margin-bottom: 15px;">
                        <a href="${signupUrl}" 
                           style="background-color: #4a90e2; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">
                            Register New Account
                        </a>
                    </div>
                    
                    <div style="margin-bottom: 15px;">
                        <a href="${joinLabUrl}" 
                           style="background-color: #38a169; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">
                            Join Laboratory
                        </a>
                    </div>
                </div>

                <p style="text-align: center; font-size: 14px; color: #888; margin-top: 20px;">
                    This invitation code will expire in 24 hours.
                </p>
                
                <p style="text-align: center; font-size: 12px; color: #a0aec0; margin-top: 20px;">
                    If you didn't request this invitation, you can safely ignore this email.
                </p>
            </div>
        `,
    });
}
