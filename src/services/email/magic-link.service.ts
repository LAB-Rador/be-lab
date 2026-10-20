import { sendActionLinkEmail } from './action-link.service.js';

export async function sendMagicLink(email: string, url: string): Promise<void> {
    await sendActionLinkEmail({
        to: email,
        subject: 'Your sign-in link',
        heading: 'Sign in to Lab-Rador Assist',
        body: 'Use the button below to sign in. If you do not have an account yet, this link creates one.',
        buttonLabel: 'Sign in',
        url,
        footnote: 'This link expires in 15 minutes and can be used once.',
    });
}
