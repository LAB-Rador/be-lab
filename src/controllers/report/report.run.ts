import {
    AnimalStatus,
    ExperimentStatus,
    Prisma,
    ReportSource,
    TaskStatus,
} from '@prisma/client';
import { prismaClient } from '../../lib/prisma.js';

export const reportFields: Record<ReportSource, { key: string; label: string }[]> = {
    ANIMAL: [
        { key: 'identifier', label: 'Identifier' },
        { key: 'name', label: 'Name' },
        { key: 'type', label: 'Type' },
        { key: 'status', label: 'Status' },
        { key: 'sex', label: 'Sex' },
        { key: 'strain', label: 'Strain' },
        { key: 'genotype', label: 'Genotype' },
        { key: 'location', label: 'Location' },
        { key: 'birthDate', label: 'Birth date' },
        { key: 'acquisitionDate', label: 'Acquisition date' },
        { key: 'lastRecordType', label: 'Last record type' },
        { key: 'lastRecordDate', label: 'Last record date' },
        { key: 'lastRecordNotes', label: 'Last record notes' },
    ],
    EXPERIMENT: [
        { key: 'title', label: 'Title' },
        { key: 'status', label: 'Status' },
        { key: 'description', label: 'Description' },
        { key: 'startDate', label: 'Start date' },
        { key: 'endDate', label: 'End date' },
        { key: 'animalCount', label: 'Animals' },
        { key: 'progress', label: 'Progress' },
    ],
    TASK: [
        { key: 'title', label: 'Title' },
        { key: 'status', label: 'Status' },
        { key: 'priority', label: 'Priority' },
        { key: 'dueDate', label: 'Due date' },
        { key: 'assignee', label: 'Assignee' },
        { key: 'experiment', label: 'Experiment' },
        { key: 'description', label: 'Description' },
    ],
};

export const reportStatuses: Record<ReportSource, string[]> = {
    ANIMAL: Object.values(AnimalStatus),
    EXPERIMENT: Object.values(ExperimentStatus),
    TASK: Object.values(TaskStatus),
};

function formatDate(value: Date | null | undefined) {
    if (!value) return '';
    const year = value.getUTCFullYear();
    const month = String(value.getUTCMonth() + 1).padStart(2, '0');
    const day = String(value.getUTCDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

function personName(firstName: string | null | undefined, lastName: string | null | undefined) {
    const name = [firstName, lastName].filter(Boolean).join(' ');
    return name || '';
}

function progressLabel(status: string, startDate: Date, endDate: Date | null) {
    if (status === 'COMPLETED') return 'Completed';
    if (status === 'CANCELLED') return 'Cancelled';
    if (!endDate) return 'No end date';
    const now = Date.now();
    const start = startDate.getTime();
    const end = endDate.getTime();
    if (now < start) return '0%';
    if (now >= end) return '100%';
    return `${Math.round(((now - start) / (end - start)) * 100)}%`;
}

export function parseRunRequest(body: unknown): {
    source: ReportSource;
    columns: string[];
    statusFilter: string | null;
} | null {
    if (!body || typeof body !== 'object') return null;
    const raw = body as Record<string, unknown>;
    const source = raw.source;
    if (source !== 'ANIMAL' && source !== 'EXPERIMENT' && source !== 'TASK') return null;
    if (!Array.isArray(raw.columns)) return null;
    const allowed = new Set(reportFields[source].map((field) => field.key));
    const columns = [...new Set(raw.columns.filter((column): column is string => typeof column === 'string'))]
        .filter((column) => allowed.has(column));
    if (columns.length === 0) return null;
    const statusFilter = typeof raw.statusFilter === 'string' && raw.statusFilter.trim()
        ? raw.statusFilter.trim()
        : null;
    if (statusFilter && !reportStatuses[source].includes(statusFilter)) return null;
    return { source, columns, statusFilter };
}

export function parseReportRequest(body: unknown): {
    name: string;
    source: ReportSource;
    columns: string[];
    statusFilter: string | null;
} | null {
    const run = parseRunRequest(body);
    if (!run || !body || typeof body !== 'object') return null;
    const name = typeof (body as { name?: unknown }).name === 'string'
        ? (body as { name: string }).name.trim()
        : '';
    if (!name || name.length > 80) return null;
    return { name, ...run };
}

function pick(row: Record<string, string>, columns: string[]) {
    const picked: Record<string, string> = {};
    for (const column of columns) picked[column] = row[column] ?? '';
    return picked;
}

export async function runReport(
    laboratoryId: string,
    source: ReportSource,
    columns: string[],
    statusFilter: string | null,
) {
    const labels = new Map(reportFields[source].map((field) => [field.key, field.label]));
    let rows: Record<string, string>[] = [];

    if (source === 'ANIMAL') {
        const animals = await prismaClient.animal.findMany({
            where: {
                laboratoryId,
                archivedAt: null,
                ...(statusFilter ? { status: statusFilter as AnimalStatus } : {}),
            },
            orderBy: { identifier: 'asc' },
            select: {
                identifier: true,
                name: true,
                status: true,
                sex: true,
                strain: true,
                genotype: true,
                location: true,
                birthDate: true,
                acquisitionDate: true,
                animalType: { select: { name: true } },
                records: {
                    orderBy: { date: 'desc' },
                    take: 1,
                    select: { date: true, recordType: true, notes: true },
                },
            },
        });
        rows = animals.map((animal) => {
            const record = animal.records[0];
            return pick({
                identifier: animal.identifier,
                name: animal.name ?? '',
                type: animal.animalType.name,
                status: animal.status,
                sex: animal.sex ?? '',
                strain: animal.strain ?? '',
                genotype: animal.genotype ?? '',
                location: animal.location ?? '',
                birthDate: formatDate(animal.birthDate),
                acquisitionDate: formatDate(animal.acquisitionDate),
                lastRecordType: record?.recordType ?? '',
                lastRecordDate: formatDate(record?.date),
                lastRecordNotes: record?.notes?.trim() ?? '',
            }, columns);
        });
    }

    if (source === 'EXPERIMENT') {
        const experiments = await prismaClient.experiment.findMany({
            where: {
                laboratoryId,
                archivedAt: null,
                ...(statusFilter ? { status: statusFilter as ExperimentStatus } : {}),
            },
            orderBy: { startDate: 'desc' },
            select: {
                title: true,
                status: true,
                description: true,
                startDate: true,
                endDate: true,
                _count: { select: { animals: true } },
            },
        });
        rows = experiments.map((experiment) => pick({
            title: experiment.title,
            status: experiment.status,
            description: experiment.description?.trim() ?? '',
            startDate: formatDate(experiment.startDate),
            endDate: formatDate(experiment.endDate),
            animalCount: String(experiment._count.animals),
            progress: progressLabel(experiment.status, experiment.startDate, experiment.endDate),
        }, columns));
    }

    if (source === 'TASK') {
        const tasks = await prismaClient.task.findMany({
            where: {
                laboratoryId,
                ...(statusFilter ? { status: statusFilter as TaskStatus } : {}),
            },
            orderBy: [{ dueDate: 'asc' }, { createdAt: 'desc' }],
            select: {
                title: true,
                status: true,
                priority: true,
                dueDate: true,
                description: true,
                assignedTo: { select: { firstName: true, lastName: true } },
                experiment: { select: { title: true } },
            },
        });
        rows = tasks.map((task) => pick({
            title: task.title,
            status: task.status,
            priority: task.priority,
            dueDate: formatDate(task.dueDate),
            assignee: personName(task.assignedTo.firstName, task.assignedTo.lastName),
            experiment: task.experiment?.title ?? '',
            description: task.description?.trim() ?? '',
        }, columns));
    }

    return {
        columns: columns.map((key) => ({ key, label: labels.get(key) ?? key })),
        rows,
    };
}

export function columnsFromJson(value: Prisma.JsonValue): string[] {
    if (!Array.isArray(value)) return [];
    return value.filter((item): item is string => typeof item === 'string');
}
