import { loadLaboratoryIdForActiveUser } from '../../lib/load-laboratory-for-active-user.js';
import { prismaClient } from '../../lib/prisma.js';
import { Prisma } from '@prisma/client';
import { Request, Response } from 'express';
import {
    columnsFromJson,
    parseReportRequest,
    parseRunRequest,
    reportFields,
    reportStatuses,
    runReport,
} from './report.run.js';

function personName(firstName: string | null, lastName: string | null) {
    const name = [firstName, lastName].filter(Boolean).join(' ');
    return name || 'Unknown';
}

function toSavedReport(report: {
    id: string;
    name: string;
    source: 'ANIMAL' | 'EXPERIMENT' | 'TASK';
    columns: Prisma.JsonValue;
    statusFilter: string | null;
    updatedAt: Date;
    createdBy: { firstName: string | null; lastName: string | null };
}) {
    return {
        id: report.id,
        name: report.name,
        source: report.source,
        columns: columnsFromJson(report.columns),
        statusFilter: report.statusFilter,
        updatedAt: report.updatedAt,
        createdByName: personName(report.createdBy.firstName, report.createdBy.lastName),
    };
}

const reportSelect = {
    id: true,
    name: true,
    source: true,
    columns: true,
    statusFilter: true,
    updatedAt: true,
    createdBy: { select: { firstName: true, lastName: true } },
} as const;

export const listReportDefinitions = async (req: Request, res: Response) => {
    try {
        const { userId, labId } = req.params;
        const lab = await loadLaboratoryIdForActiveUser(userId, labId);
        if (!lab) {
            return res.status(403).json({ success: false, message: 'Access denied to this laboratory' });
        }

        const reports = await prismaClient.reportDefinition.findMany({
            where: { laboratoryId: lab.laboratoryId },
            orderBy: { updatedAt: 'desc' },
            select: reportSelect,
        });

        return res.status(200).json({
            success: true,
            data: {
                reports: reports.map(toSavedReport),
                fields: reportFields,
                statuses: reportStatuses,
            },
        });
    } catch (error) {
        console.error('Error listing reports:', error);
        return res.status(500).json({ success: false, message: 'Failed to list reports' });
    }
};

export const previewReport = async (req: Request, res: Response) => {
    try {
        const { userId, labId } = req.params;
        const lab = await loadLaboratoryIdForActiveUser(userId, labId);
        if (!lab) {
            return res.status(403).json({ success: false, message: 'Access denied to this laboratory' });
        }
        const parsed = parseRunRequest(req.body);
        if (!parsed) {
            return res.status(400).json({ success: false, message: 'Choose a source and at least one column.' });
        }
        const result = await runReport(lab.laboratoryId, parsed.source, parsed.columns, parsed.statusFilter);
        return res.status(200).json({ success: true, data: result });
    } catch (error) {
        console.error('Error previewing report:', error);
        return res.status(500).json({ success: false, message: 'Failed to preview report' });
    }
};

export const createReportDefinition = async (req: Request, res: Response) => {
    try {
        const { userId, labId } = req.params;
        const lab = await loadLaboratoryIdForActiveUser(userId, labId);
        if (!lab) {
            return res.status(403).json({ success: false, message: 'Access denied to this laboratory' });
        }
        const parsed = parseReportRequest(req.body);
        if (!parsed) {
            return res.status(400).json({ success: false, message: 'Choose a name, a source, and at least one column.' });
        }

        const report = await prismaClient.reportDefinition.create({
            data: {
                laboratoryId: lab.laboratoryId,
                createdById: userId,
                name: parsed.name,
                source: parsed.source,
                columns: parsed.columns,
                statusFilter: parsed.statusFilter,
            },
            select: reportSelect,
        });
        return res.status(201).json({ success: true, data: toSavedReport(report) });
    } catch (error) {
        if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
            return res.status(409).json({ success: false, message: 'A report with this name already exists.' });
        }
        console.error('Error creating report:', error);
        return res.status(500).json({ success: false, message: 'Failed to create report' });
    }
};

export const updateReportDefinition = async (req: Request, res: Response) => {
    try {
        const { userId, labId, reportId } = req.params;
        const lab = await loadLaboratoryIdForActiveUser(userId, labId);
        if (!lab) {
            return res.status(403).json({ success: false, message: 'Access denied to this laboratory' });
        }
        const parsed = parseReportRequest(req.body);
        if (!parsed) {
            return res.status(400).json({ success: false, message: 'Choose a name, a source, and at least one column.' });
        }

        const existing = await prismaClient.reportDefinition.findFirst({
            where: { id: reportId, laboratoryId: lab.laboratoryId },
            select: { id: true },
        });
        if (!existing) {
            return res.status(404).json({ success: false, message: 'Report not found' });
        }

        const report = await prismaClient.reportDefinition.update({
            where: { id: reportId },
            data: {
                name: parsed.name,
                source: parsed.source,
                columns: parsed.columns,
                statusFilter: parsed.statusFilter,
            },
            select: reportSelect,
        });
        return res.status(200).json({ success: true, data: toSavedReport(report) });
    } catch (error) {
        if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
            return res.status(409).json({ success: false, message: 'A report with this name already exists.' });
        }
        console.error('Error updating report:', error);
        return res.status(500).json({ success: false, message: 'Failed to update report' });
    }
};

export const deleteReportDefinition = async (req: Request, res: Response) => {
    try {
        const { userId, labId, reportId } = req.params;
        const lab = await loadLaboratoryIdForActiveUser(userId, labId);
        if (!lab) {
            return res.status(403).json({ success: false, message: 'Access denied to this laboratory' });
        }

        const existing = await prismaClient.reportDefinition.findFirst({
            where: { id: reportId, laboratoryId: lab.laboratoryId },
            select: { id: true },
        });
        if (!existing) {
            return res.status(404).json({ success: false, message: 'Report not found' });
        }

        await prismaClient.reportDefinition.delete({ where: { id: reportId } });
        return res.status(200).json({ success: true });
    } catch (error) {
        console.error('Error deleting report:', error);
        return res.status(500).json({ success: false, message: 'Failed to delete report' });
    }
};

export const openReportDefinition = async (req: Request, res: Response) => {
    try {
        const { userId, labId, reportId } = req.params;
        const lab = await loadLaboratoryIdForActiveUser(userId, labId);
        if (!lab) {
            return res.status(403).json({ success: false, message: 'Access denied to this laboratory' });
        }

        const report = await prismaClient.reportDefinition.findFirst({
            where: { id: reportId, laboratoryId: lab.laboratoryId },
            select: reportSelect,
        });
        if (!report) {
            return res.status(404).json({ success: false, message: 'Report not found' });
        }

        const columns = columnsFromJson(report.columns);
        const result = await runReport(lab.laboratoryId, report.source, columns, report.statusFilter);
        return res.status(200).json({
            success: true,
            data: { report: toSavedReport(report), result },
        });
    } catch (error) {
        console.error('Error opening report:', error);
        return res.status(500).json({ success: false, message: 'Failed to open report' });
    }
};
