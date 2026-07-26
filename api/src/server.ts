import cors from 'cors';
import express from 'express';
import { randomUUID } from 'node:crypto';
import { z } from 'zod';
import mockData from '../../lidkep_mock_data.json';

const app = express();
app.disable('x-powered-by');
app.use(cors());
app.use(express.json({ limit: '1mb' }));

const innovationSchema = z.object({
  id: z.string(),
  slug: z.string(),
  title: z.string(),
  summary: z.string(),
  problem: z.string(),
  solution: z.string(),
  beneficiaries: z.string(),
  sector: z.string(),
  category: z.string(),
  district: z.string(),
  maturity: z.string(),
  status: z.string(),
  impact: z.string(),
  supportNeeded: z.string(),
  owner: z.string(),
  organization: z.string(),
  publishedAt: z.string(),
  version: z.number(),
  completion: z.number(),
  views: z.number(),
  saves: z.number(),
  imageTone: z.string(),
  evidence: z.array(z.string()),
  metrics: z.array(z.object({ value: z.string(), label: z.string() })),
  milestones: z.array(z.object({ title: z.string(), date: z.string(), status: z.string() }))
});

const innovations = z.array(innovationSchema).parse(mockData.innovations);
const publicInnovations = () => innovations.filter((item) => item.status === 'PUBLISHED');
const envelope = <T>(data: T) => ({ data, meta: { requestId: randomUUID() } });

app.get('/api/v1/health', (_req, res) => res.json(envelope({ status: 'ok', database: 'demo-memory' })));

app.get('/api/v1/demo/bootstrap', (_req, res) => {
  res.json(envelope(mockData));
});

app.get('/api/v1/public/innovations', (req, res) => {
  const query = String(req.query.q ?? '').trim().toLowerCase();
  const sector = String(req.query.sector ?? '');
  const district = String(req.query.district ?? '');
  const maturity = String(req.query.maturity ?? '');
  const data = publicInnovations().filter((item) => {
    const searchable = `${item.title} ${item.summary} ${item.problem} ${item.solution}`.toLowerCase();
    return (!query || searchable.includes(query))
      && (!sector || item.sector === sector)
      && (!district || item.district === district)
      && (!maturity || item.maturity === maturity);
  });
  res.json({ data, meta: { total: data.length, page: 1, pageSize: 12, requestId: randomUUID() } });
});

app.get('/api/v1/public/innovations/:slug', (req, res) => {
  const innovation = publicInnovations().find((item) => item.slug === req.params.slug);
  if (!innovation) {
    return res.status(404).json({ error: { code: 'INNOVATION_NOT_FOUND', message: 'The published innovation was not found.', fieldErrors: [], requestId: randomUUID() } });
  }
  return res.json(envelope(innovation));
});

app.get('/api/v1/public/statistics', (_req, res) => res.json(envelope(mockData.statistics)));
app.get('/api/v1/taxonomies', (_req, res) => res.json(envelope(mockData.taxonomies)));

const actionSchema = z.object({ action: z.string().min(2), entityId: z.string().min(1), note: z.string().max(1000).optional() });
app.post('/api/v1/demo/actions', (req, res) => {
  const parsed = actionSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(422).json({ error: { code: 'VALIDATION_ERROR', message: 'Review the supplied action.', fieldErrors: parsed.error.issues, requestId: randomUUID() } });
  }
  return res.status(201).json(envelope({ ...parsed.data, status: 'RECORDED_IN_DEMO', persisted: false, occurredAt: new Date().toISOString() }));
});

app.use((_req, res) => {
  res.status(404).json({ error: { code: 'ROUTE_NOT_FOUND', message: 'The requested API route does not exist.', fieldErrors: [], requestId: randomUUID() } });
});

if (process.env.NODE_ENV !== 'test') {
  app.listen(3001, () => console.log('LIDKEP API listening on http://localhost:3001'));
}

export default app;
