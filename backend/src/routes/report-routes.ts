import { Router } from 'express';
import { requireRole } from '../middleware/auth';
import { validate } from '../middleware/validate';
import { ReportService } from '../services/report-service';
import { asyncHandler } from '../utils/async-handler';
import { reportSchema } from './schemas';

export function reportRoutes(reports: ReportService): Router {
  const router = Router();

  router.get('/performance', requireRole('SUPERVISOR', 'ADMIN'), validate(reportSchema), asyncHandler(async (req, res) => {
    res.json({ data: await reports.getPerformanceReport(req.query) });
  }));

  router.get('/performance.csv', requireRole('SUPERVISOR', 'ADMIN'), validate(reportSchema), asyncHandler(async (req, res) => {
    const report = await reports.getPerformanceReport(req.query);
    const rows = [
      ['metric', 'value'],
      ['totalTickets', String(report.totalTickets)],
      ['openTickets', String(report.openTickets)],
      ['resolvedTickets', String(report.resolvedTickets)],
      ['averageResolutionMinutes', String(report.averageResolutionMinutes ?? '')],
      ['slaComplianceRate', String(report.slaComplianceRate)]
    ];
    res.header('content-type', 'text/csv');
    res.attachment(`ticketflow-report-${Date.now()}.csv`);
    res.send(rows.map((row) => row.map((value) => `"${value.replace(/"/g, '""')}"`).join(',')).join('\n'));
  }));

  return router;
}
