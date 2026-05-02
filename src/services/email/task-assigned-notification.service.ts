import { TaskPriority } from '@prisma/client';
import { Resend } from 'resend';
import { escapeHtml } from './html-escape.js';

const resend = new Resend(process.env.RESEND_API_KEY);

function formatPriority(priority: TaskPriority): string {
    return priority.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase());
}

export type TaskAssignedEmailParams = {
    to: string;
    taskTitle: string;
    priority: TaskPriority;
    experimentTitle: string;
    laboratoryName: string;
    assignerDisplayName: string;
};

export async function sendTaskAssignedEmail(params: TaskAssignedEmailParams): Promise<void> {
    const { to, taskTitle, priority, experimentTitle, laboratoryName, assignerDisplayName } = params;

    const safeTitle = escapeHtml(taskTitle);
    const safeExp = escapeHtml(experimentTitle);
    const safeLab = escapeHtml(laboratoryName);
    const safeAssigner = escapeHtml(assignerDisplayName);
    const priorityLabel = escapeHtml(formatPriority(priority));

    await resend.emails.send({
        from: 'noreply@labradorassist.app',
        to,
        subject: `New task assigned: ${taskTitle}`,
        html: `
            <div style="font-family: Arial, sans-serif; padding: 20px; color: #333;">
                <div style="text-align: center; margin-bottom: 30px;">
                    <img src="https://labradorassist.app/favicon.ico" alt="Lab-Rador Logo" width="120" />
                </div>
                <h2 style="text-align: center; color: #2d3748;">New task assigned to you</h2>
                <div style="background-color: #f7fafc; border-radius: 8px; padding: 20px; margin: 20px auto; max-width: 480px;">
                    <p style="margin: 8px 0;"><strong>Title:</strong> ${safeTitle}</p>
                    <p style="margin: 8px 0;"><strong>Priority:</strong> ${priorityLabel}</p>
                    <p style="margin: 8px 0;"><strong>Experiment:</strong> ${safeExp}</p>
                    <p style="margin: 8px 0;"><strong>Laboratory:</strong> ${safeLab}</p>
                    <p style="margin: 8px 0;"><strong>Assigned by:</strong> ${safeAssigner}</p>
                </div>
                <p style="text-align: center; font-size: 12px; color: #a0aec0; margin-top: 24px;">
                    This message was sent by Lab-Rador Assist.
                </p>
            </div>
        `,
    });
}
