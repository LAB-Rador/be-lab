import {
    createReportDefinition,
    deleteReportDefinition,
    exportReport,
    listReportDefinitions,
    openReportDefinition,
    previewReport,
    updateReportDefinition,
} from '../controllers/report/report.definition.controller.js';
import { rejectForeignUserParam } from '../middleware/require-user.js';
import { requirePaidPlan } from '../middleware/require-paid-plan.js';
import { Router } from 'express';

const reportRouter = Router();

rejectForeignUserParam(reportRouter, 'userId');

reportRouter.get('/:userId/:labId', requirePaidPlan, listReportDefinitions);
reportRouter.post('/:userId/:labId/preview', previewReport);
reportRouter.post('/:userId/:labId/export', requirePaidPlan, exportReport);
reportRouter.post('/:userId/:labId', requirePaidPlan, createReportDefinition);
reportRouter.get('/:userId/:labId/:reportId', requirePaidPlan, openReportDefinition);
reportRouter.put('/:userId/:labId/:reportId', requirePaidPlan, updateReportDefinition);
reportRouter.delete('/:userId/:labId/:reportId', requirePaidPlan, deleteReportDefinition);

export default reportRouter;
