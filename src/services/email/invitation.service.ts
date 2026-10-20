import { sendActionLinkEmail } from './action-link.service.js';

const INVITE_TTL_DAYS = 10;

export default async function sendInvitationLink(
    email: string,
    url: string,
    laboratoryName: string,
    role: string,
) {
    await sendActionLinkEmail({
        to: email,
        subject: `Join ${laboratoryName}`,
        heading: 'You are invited to a laboratory',
        body: `Join ${laboratoryName} as ${role}. This link signs you in and adds you to the laboratory. No separate registration is required.`,
        buttonLabel: 'Join laboratory',
        url,
        footnote: `This link expires in ${INVITE_TTL_DAYS} days and can be used once.`,
    });
}
