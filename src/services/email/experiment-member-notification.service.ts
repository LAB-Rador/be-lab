import { Resend } from 'resend';
import { escapeHtml } from './html-escape.js';

const resend = new Resend(process.env.RESEND_API_KEY);

const layoutHead = `
            <div style="font-family: Arial, sans-serif; padding: 20px; color: #333;">
                <div style="text-align: center; margin-bottom: 30px;">
                    <img src="https://labradorassist.app/favicon.ico" alt="Lab-Rador Logo" width="120" />
                </div>`;

const layoutFoot = `
                <p style="text-align: center; font-size: 12px; color: #a0aec0; margin-top: 24px;">
                    This message was sent by Lab-Rador Assist.
                </p>
            </div>`;

export type ExperimentMemberEmailActor = {
    displayName: string;
};

export async function sendExperimentMemberAddedEmail(params: {
    to: string;
    experimentTitle: string;
    laboratoryName: string;
    actor: ExperimentMemberEmailActor;
}): Promise<void> {
    const { to, experimentTitle, laboratoryName, actor } = params;
    const title = escapeHtml(experimentTitle);
    const lab = escapeHtml(laboratoryName);
    const by = escapeHtml(actor.displayName);

    await resend.emails.send({
        from: 'noreply@labradorassist.app',
        to,
        subject: 'You were added to an experiment',
        html: `
            ${layoutHead}
                <h2 style="text-align: center; color: #2d3748;">Added to experiment</h2>
                <p style="text-align: center;">
                    You have been added to experiment <strong>${title}</strong>
                    in laboratory <strong>${lab}</strong>.
                </p>
                <p style="text-align: center; font-size: 14px; color: #555;">
                    Added by: <strong>${by}</strong>
                </p>
            ${layoutFoot}
        `,
    });
}

export async function sendExperimentMemberRemovedEmail(params: {
    to: string;
    experimentTitle: string;
    laboratoryName: string;
    actor: ExperimentMemberEmailActor;
}): Promise<void> {
    const { to, experimentTitle, laboratoryName, actor } = params;
    const title = escapeHtml(experimentTitle);
    const lab = escapeHtml(laboratoryName);
    const by = escapeHtml(actor.displayName);

    await resend.emails.send({
        from: 'noreply@labradorassist.app',
        to,
        subject: 'You were removed from an experiment',
        html: `
            ${layoutHead}
                <h2 style="text-align: center; color: #2d3748;">Removed from experiment</h2>
                <p style="text-align: center;">
                    You have been removed from experiment <strong>${title}</strong>
                    in laboratory <strong>${lab}</strong>.
                </p>
                <p style="text-align: center; font-size: 14px; color: #555;">
                    Action by: <strong>${by}</strong>
                </p>
            ${layoutFoot}
        `,
    });
}
