import swaggerJSDoc from 'swagger-jsdoc';
import yaml from 'js-yaml';
import { writeFileSync, mkdirSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Cents Per Point API',
      version: '1.0.0'
    }
  },
  apis: [join(__dirname, '../src/routes/*.js')]
};

const spec = swaggerJSDoc(options);
const yamlSpec = yaml.dump(spec);
const outDir = join(__dirname, '../../docs/openapi');
mkdirSync(outDir, { recursive: true });
writeFileSync(join(outDir, 'openapi.yaml'), yamlSpec);
console.log('OpenAPI spec generated at docs/openapi/openapi.yaml');

