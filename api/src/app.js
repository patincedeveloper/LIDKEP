import cors from 'cors';
import cookieParser from 'cookie-parser';
import express from 'express';
import helmet from 'helmet';
import pino from 'pino';
import pinoHttp from 'pino-http';
import { env } from './config/env.js';
import { errorHandler } from './middleware/errorHandler.js';
import { notFound } from './middleware/notFound.js';
import { globalRateLimit } from './middleware/rateLimit.js';
import { requestContext } from './middleware/requestContext.js';
import { apiRouter } from './routes/index.js';

const logger = pino({ level: env.LOG_LEVEL });

export function createApp() {
  const app = express();
  app.disable('x-powered-by');
  app.set('trust proxy', env.TRUST_PROXY);
  app.use(requestContext);
  app.use(pinoHttp({
    logger,
    genReqId: (req) => req.requestId,
    serializers: {
      req: (req) => ({ id: req.id, method: req.method, url: req.url }),
      res: (res) => ({ statusCode: res.statusCode })
    }
  }));
  app.use(helmet());
  app.use(cors({
    origin(origin, callback) {
      if (!origin || env.corsOrigins.includes(origin)) return callback(null, true);
      return callback(new Error('Origin not allowed by CORS policy.'));
    },
    credentials: true
  }));
  app.use(express.json({ limit: env.JSON_BODY_LIMIT }));
  app.use(cookieParser());
  app.use(globalRateLimit);
  app.use(env.API_PREFIX, apiRouter);
  app.use(notFound);
  app.use(errorHandler);
  return app;
}

export default createApp();
