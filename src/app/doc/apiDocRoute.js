import { Router } from 'express';
import swaggerUi from 'swagger-ui-express';
import swaggerDoc from './openapi.json';

const options = {
  customCss: '.swagger-ui .topbar { display: none }',
  customSiteTitle: 'Biblionx LSRD Translator API Docs',
};

const apiDocRoute = Router();

apiDocRoute.use('/', swaggerUi.serve);
apiDocRoute.get('/docs', swaggerUi.setup(swaggerDoc, options));

export default apiDocRoute;
