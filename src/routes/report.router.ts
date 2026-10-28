import {
    createReportDefinition,
    deleteReportDefinition,
    listReportDefinitions,
    openReportDefinition,
    previewReport,
    updateReportDefinition,
} from '../controllers/report/report.definition.controller.js';
import { Router } from 'express';

const reportRouter = Router();

reportRouter.get('/:userId/:labId', listReportDefinitions);
reportRouter.post('/:userId/:labId/preview', previewReport);
reportRouter.post('/:userId/:labId', createReportDefinition);
reportRouter.get('/:userId/:labId/:reportId', openReportDefinition);
reportRouter.put('/:userId/:labId/:reportId', updateReportDefinition);
reportRouter.delete('/:userId/:labId/:reportId', deleteReportDefinition);

export default reportRouter;
