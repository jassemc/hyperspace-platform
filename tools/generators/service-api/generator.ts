import { generateApi } from 'swagger-typescript-api';

import * as path from 'path';
import * as fs from 'fs';

async function generateServiceApi() {
    const outputDir = path.join(process.cwd(), 'lib/service');
    const apiSpecPath = path.join(process.cwd(), 'swagger.json');
    const templatesDir = path.join(__dirname, 'templates');
    const serviceName = 'HsService';

    try {
        // Ensure the output directory exists
        if (!fs.existsSync(outputDir)) {
            fs.mkdirSync(outputDir, { recursive: true });
        }

        // Generate API service files
        const { files, configuration } = await generateApi({
            fileName: serviceName,
            apiClassName: serviceName,
            input: apiSpecPath,
            output: outputDir,
            httpClientType: 'fetch',
            templates: templatesDir,
            disableThrowOnError: false,
            generateRouteTypes: true,
            generateResponses: true,
            extractRequestParams: true,
            extractRequestBody: true,
            unwrapResponseData: true,
            addReadonly: true,
            generateUnionEnums: true,
            anotherArrayType: true,
            silent: true,
            singleHttpClient: true,
            extraTemplates: [
                {
                    name: 'index',
                    path: path.resolve(templatesDir, 'index-entry-file.ejs'),
                },
                {
                    name: 'api',
                    path: path.resolve(templatesDir, 'custom-api.ejs'),
                },
                {
                    name: '_meta',
                    path: path.resolve(templatesDir, 'custom-meta.ejs'),
                }
            ].filter((t) => t != null),
        },
        );

        const output = configuration.config.output ? configuration.config.output : outputDir;

        files.forEach(({ fileName, fileContent, fileExtension }) => {
            fs.writeFileSync(path.resolve(output, fileName + fileExtension), fileContent)
        })

        console.log('API service files generated successfully.');
    } catch (error) {
        console.error('Error generating API service files:', error);
    }
}

generateServiceApi()
    .then(() => console.log('Service API generation completed.'))
    .catch((error) => console.error('Service API generation failed:', error));