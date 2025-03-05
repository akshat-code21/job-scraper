import express from 'express';
import jobRoutes from './routes/job';

const app = express();

app.use(express.json());
app.use('/api/jobs', jobRoutes);

export default app;