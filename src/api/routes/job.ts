import express from 'express';
import { JobService } from '../../services/jobService';

const router = express.Router();
const jobService = new JobService();

router.get('/', async (req, res) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const jobs = await jobService.getAllJobs(page, limit);
    res.json(jobs);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch jobs' });
  }
});


router.get('/filter', async (req, res) => {
  try {
    const { company, location, fromDate } = req.query;
    const filters = {
      ...(company && { company: company as string }),
      ...(location && { location: location as string }),
      ...(fromDate && { fromDate: new Date(fromDate as string) }),
    };
    const jobs = await jobService.getJobsByFilter(filters);
    res.json(jobs);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch filtered jobs' });
  }
});

export default router;