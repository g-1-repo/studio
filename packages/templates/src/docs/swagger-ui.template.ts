/**
 * Swagger UI template for interactive API documentation interface
 */

export interface SwaggerUIConfig {
  title?: string
  specUrl?: string
  spec?: object
  dom_id?: string
  deepLinking?: boolean
  displayOperationId?: boolean
  defaultModelsExpandDepth?: number
  defaultModelExpandDepth?: number
  defaultModelRendering?: 'example' | 'model'
  displayRequestDuration?: boolean
  docExpansion?: 'list' | 'full' | 'none'
  filter?: boolean | string
  maxDisplayedTags?: number
  operationsSorter?: 'alpha' | 'method' | ((a: any, b: any) => number)
  showExtensions?: boolean
  showCommonExtensions?: boolean
  tagsSorter?: 'alpha' | ((a: any, b: any) => number)
  tryItOutEnabled?: boolean
  requestInterceptor?: (request: any) => any
  responseInterceptor?: (response: any) => any
  showMutatedRequest?: boolean
  supportedSubmitMethods?: string[]
  validatorUrl?: string | null
  withCredentials?: boolean
  persistAuthorization?: boolean
  oauth2RedirectUrl?: string
  presets?: any[]
  plugins?: any[]
  layout?: string
  theme?: 'light' | 'dark'
  customCss?: string
  customJs?: string
}

export const DEFAULT_SWAGGER_CONFIG: SwaggerUIConfig = {
  title: 'API Documentation',
  dom_id: '#swagger-ui',
  deepLinking: true,
  displayOperationId: false,
  defaultModelsExpandDepth: 1,
  defaultModelExpandDepth: 1,
  defaultModelRendering: 'example',
  displayRequestDuration: false,
  docExpansion: 'list',
  filter: false,
  showExtensions: false,
  showCommonExtensions: false,
  tryItOutEnabled: true,
  supportedSubmitMethods: ['get', 'put', 'post', 'delete', 'options', 'head', 'patch', 'trace'],
  validatorUrl: 'https://validator.swagger.io/validator',
  withCredentials: false,
  persistAuthorization: false,
  theme: 'light',
}

export function generateSwaggerHTML(config: SwaggerUIConfig = DEFAULT_SWAGGER_CONFIG): string {
  const configJson = JSON.stringify(
    {
      ...config,
      dom_id: undefined, // Remove dom_id from config object
    },
    null,
    2
  )

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>${config.title || 'API Documentation'}</title>
  <link rel="stylesheet" type="text/css" href="https://unpkg.com/swagger-ui-dist@5.9.0/swagger-ui.css" />
  <link rel="icon" type="image/png" href="https://unpkg.com/swagger-ui-dist@5.9.0/favicon-32x32.png" sizes="32x32" />
  <link rel="icon" type="image/png" href="https://unpkg.com/swagger-ui-dist@5.9.0/favicon-16x16.png" sizes="16x16" />
  <style>
    html {
      box-sizing: border-box;
      overflow: -moz-scrollbars-vertical;
      overflow-y: scroll;
    }

    *, *:before, *:after {
      box-sizing: inherit;
    }

    body {
      margin: 0;
      background: #fafafa;
    }

    ${
      config.theme === 'dark'
        ? `
    body {
      background: #1a1a1a;
      color: #ffffff;
    }
    
    .swagger-ui .topbar {
      background: #2d2d2d;
    }
    
    .swagger-ui .info {
      background: #2d2d2d;
    }
    `
        : ''
    }

    ${config.customCss || ''}
  </style>
</head>

<body>
  <div id="swagger-ui"></div>

  <script src="https://unpkg.com/swagger-ui-dist@5.9.0/swagger-ui-bundle.js"></script>
  <script src="https://unpkg.com/swagger-ui-dist@5.9.0/swagger-ui-standalone-preset.js"></script>
  <script>
    window.onload = function() {
      const ui = SwaggerUIBundle({
        dom_id: '${config.dom_id || '#swagger-ui'}',
        presets: [
          SwaggerUIBundle.presets.apis,
          SwaggerUIStandalonePreset
        ],
        plugins: [
          SwaggerUIBundle.plugins.DownloadUrl
        ],
        layout: "StandaloneLayout",
        ${config.spec ? `spec: ${JSON.stringify(config.spec)},` : ''}
        ${config.specUrl ? `url: "${config.specUrl}",` : ''}
        ...${configJson}
      });

      // Custom request interceptor for authentication
      if (${JSON.stringify(!!config.requestInterceptor)}) {
        ui.getConfigs().requestInterceptor = ${config.requestInterceptor?.toString() || 'null'};
      }

      // Custom response interceptor
      if (${JSON.stringify(!!config.responseInterceptor)}) {
        ui.getConfigs().responseInterceptor = ${config.responseInterceptor?.toString() || 'null'};
      }

      window.ui = ui;
    };
  </script>

  ${config.customJs ? `<script>${config.customJs}</script>` : ''}
</body>
</html>`
}

export function createSwaggerUIMiddleware(config: SwaggerUIConfig = DEFAULT_SWAGGER_CONFIG) {
  return (c: any) => {
    const html = generateSwaggerHTML(config)
    c.header('Content-Type', 'text/html')
    return c.html(html)
  }
}

export function createSwaggerUIRoute(specUrl: string, config: Partial<SwaggerUIConfig> = {}) {
  const fullConfig = {
    ...DEFAULT_SWAGGER_CONFIG,
    ...config,
    specUrl,
  }

  return createSwaggerUIMiddleware(fullConfig)
}

export function createSwaggerUIWithSpec(spec: object, config: Partial<SwaggerUIConfig> = {}) {
  const fullConfig = {
    ...DEFAULT_SWAGGER_CONFIG,
    ...config,
    spec,
  }

  return createSwaggerUIMiddleware(fullConfig)
}

// Predefined Swagger UI configurations
export const SWAGGER_UI_CONFIGS = {
  default: {
    ...DEFAULT_SWAGGER_CONFIG,
    title: 'API Documentation',
    docExpansion: 'list',
    tryItOutEnabled: true,
  } as SwaggerUIConfig,

  minimal: {
    ...DEFAULT_SWAGGER_CONFIG,
    title: 'API Docs',
    docExpansion: 'none',
    defaultModelsExpandDepth: 0,
    filter: false,
    showExtensions: false,
    tryItOutEnabled: false,
  } as SwaggerUIConfig,

  developer: {
    ...DEFAULT_SWAGGER_CONFIG,
    title: 'Developer API Documentation',
    docExpansion: 'full',
    displayOperationId: true,
    defaultModelsExpandDepth: 2,
    defaultModelExpandDepth: 2,
    showExtensions: true,
    showCommonExtensions: true,
    displayRequestDuration: true,
    tryItOutEnabled: true,
    filter: true,
  } as SwaggerUIConfig,

  production: {
    ...DEFAULT_SWAGGER_CONFIG,
    title: 'API Documentation',
    docExpansion: 'list',
    tryItOutEnabled: false,
    validatorUrl: null, // Disable validator in production
    showExtensions: false,
    displayRequestDuration: false,
  } as SwaggerUIConfig,

  dark: {
    ...DEFAULT_SWAGGER_CONFIG,
    title: 'API Documentation',
    theme: 'dark',
    customCss: `
      .swagger-ui .topbar { background: #2d2d2d; }
      .swagger-ui .info { background: #2d2d2d; }
      .swagger-ui .scheme-container { background: #2d2d2d; }
    `,
  } as SwaggerUIConfig,

  branded: {
    ...DEFAULT_SWAGGER_CONFIG,
    title: 'Company API Documentation',
    customCss: `
      .swagger-ui .topbar { 
        background: linear-gradient(90deg, #667eea 0%, #764ba2 100%);
      }
      .swagger-ui .topbar .download-url-wrapper { display: none; }
      .swagger-ui .info .title { color: #667eea; }
    `,
    customJs: `
      // Add custom branding or analytics
      console.log('API Documentation loaded');
    `,
  } as SwaggerUIConfig,
}

// Helper functions for common Swagger UI customizations
export const SWAGGER_UI_HELPERS = {
  // Add authentication header interceptor
  withBearerAuth: (getToken: () => string | null) => ({
    requestInterceptor: (request: any) => {
      const token = getToken()
      if (token) {
        request.headers.Authorization = `Bearer ${token}`
      }
      return request
    },
  }),

  // Add API key header interceptor
  withApiKey: (keyName: string, getKey: () => string | null) => ({
    requestInterceptor: (request: any) => {
      const key = getKey()
      if (key) {
        request.headers[keyName] = key
      }
      return request
    },
  }),

  // Add custom base URL
  withBaseUrl: (baseUrl: string) => ({
    requestInterceptor: (request: any) => {
      if (request.url.startsWith('/')) {
        request.url = baseUrl + request.url
      }
      return request
    },
  }),

  // Add request/response logging
  withLogging: () => ({
    requestInterceptor: (request: any) => {
      console.log('API Request:', request)
      return request
    },
    responseInterceptor: (response: any) => {
      console.log('API Response:', response)
      return response
    },
  }),

  // Add CORS headers for development
  withCors: () => ({
    requestInterceptor: (request: any) => {
      request.headers['Access-Control-Allow-Origin'] = '*'
      request.headers['Access-Control-Allow-Methods'] = 'GET, POST, PUT, DELETE, OPTIONS'
      request.headers['Access-Control-Allow-Headers'] = 'Content-Type, Authorization'
      return request
    },
  }),
}

// Custom themes
export const SWAGGER_UI_THEMES = {
  light: {
    customCss: `
      .swagger-ui { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; }
      .swagger-ui .topbar { background: #ffffff; border-bottom: 1px solid #e8e8e8; }
      .swagger-ui .info { background: #ffffff; }
    `,
  },

  dark: {
    customCss: `
      body { background: #1a1a1a; color: #ffffff; }
      .swagger-ui { color: #ffffff; }
      .swagger-ui .topbar { background: #2d2d2d; }
      .swagger-ui .info { background: #2d2d2d; }
      .swagger-ui .scheme-container { background: #2d2d2d; }
      .swagger-ui .opblock .opblock-summary { background: #3d3d3d; }
      .swagger-ui .opblock.opblock-post { border-color: #49cc90; background: rgba(73, 204, 144, 0.1); }
      .swagger-ui .opblock.opblock-get { border-color: #61affe; background: rgba(97, 175, 254, 0.1); }
      .swagger-ui .opblock.opblock-put { border-color: #fca130; background: rgba(252, 161, 48, 0.1); }
      .swagger-ui .opblock.opblock-delete { border-color: #f93e3e; background: rgba(249, 62, 62, 0.1); }
    `,
  },

  minimal: {
    customCss: `
      .swagger-ui .topbar { display: none; }
      .swagger-ui .info { margin: 20px 0; }
      .swagger-ui .info .title { font-size: 24px; margin: 0; }
      .swagger-ui .scheme-container { display: none; }
    `,
  },

  compact: {
    customCss: `
      .swagger-ui { font-size: 14px; }
      .swagger-ui .opblock { margin: 5px 0; }
      .swagger-ui .opblock .opblock-summary { padding: 10px 15px; }
      .swagger-ui .info { padding: 15px; }
    `,
  },
}

// Usage examples
export const SWAGGER_UI_EXAMPLES = {
  basic: `
import { createSwaggerUIRoute, SWAGGER_UI_CONFIGS } from './swagger-ui.template'

const app = new Hono()

// Serve Swagger UI at /docs
app.get('/docs', createSwaggerUIRoute('/openapi.json', SWAGGER_UI_CONFIGS.default))

// Serve OpenAPI spec
app.get('/openapi.json', (c) => {
  return c.json(openApiSpec)
})
`,

  withAuthentication: `
import { 
  createSwaggerUIWithSpec, 
  SWAGGER_UI_CONFIGS,
  SWAGGER_UI_HELPERS 
} from './swagger-ui.template'

const swaggerConfig = {
  ...SWAGGER_UI_CONFIGS.developer,
  ...SWAGGER_UI_HELPERS.withBearerAuth(() => {
    // Get token from localStorage or other source
    return localStorage.getItem('authToken')
  }),
  ...SWAGGER_UI_HELPERS.withLogging(),
}

const app = new Hono()
app.get('/docs', createSwaggerUIWithSpec(openApiSpec, swaggerConfig))
`,

  customTheme: `
import { 
  createSwaggerUIRoute,
  SWAGGER_UI_CONFIGS,
  SWAGGER_UI_THEMES 
} from './swagger-ui.template'

const customConfig = {
  ...SWAGGER_UI_CONFIGS.default,
  title: 'My API Documentation',
  ...SWAGGER_UI_THEMES.dark,
  customJs: \`
    // Add custom analytics
    gtag('event', 'page_view', {
      page_title: 'API Documentation',
      page_location: window.location.href
    });
  \`,
}

const app = new Hono()
app.get('/docs', createSwaggerUIRoute('/api-spec.json', customConfig))
`,

  multipleVersions: `
import { createSwaggerUIRoute, SWAGGER_UI_CONFIGS } from './swagger-ui.template'

const app = new Hono()

// Version 1 documentation
app.get('/docs/v1', createSwaggerUIRoute('/openapi/v1.json', {
  ...SWAGGER_UI_CONFIGS.default,
  title: 'API Documentation v1.0',
}))

// Version 2 documentation
app.get('/docs/v2', createSwaggerUIRoute('/openapi/v2.json', {
  ...SWAGGER_UI_CONFIGS.default,
  title: 'API Documentation v2.0',
}))

// Latest version (default)
app.get('/docs', createSwaggerUIRoute('/openapi.json', {
  ...SWAGGER_UI_CONFIGS.default,
  title: 'API Documentation (Latest)',
}))
`,

  embedded: `
import { generateSwaggerHTML, SWAGGER_UI_CONFIGS } from './swagger-ui.template'

// Generate HTML for embedding in existing pages
const swaggerHTML = generateSwaggerHTML({
  ...SWAGGER_UI_CONFIGS.minimal,
  dom_id: '#api-docs',
  specUrl: '/api/openapi.json',
  customCss: \`
    #api-docs { 
      max-height: 600px; 
      overflow-y: auto; 
      border: 1px solid #e8e8e8;
      border-radius: 4px;
    }
  \`,
})

// Use in your template engine
const pageHTML = \`
<!DOCTYPE html>
<html>
<head>
  <title>Dashboard</title>
</head>
<body>
  <h1>API Dashboard</h1>
  <div id="api-docs"></div>
  \${swaggerHTML}
</body>
</html>
\`
`,
}
