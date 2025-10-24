/**
 * Boilerplate Configuration
 *
 * This file contains all the project-specific values that should be customized
 * when using this boilerplate for a new project. Update these values and run
 * the setup script to automatically replace them throughout the codebase.
 */

export const boilerplateConfig = {
  // Project Information
  projectName: 'g1-core',
  projectDisplayName: 'G1 Core API',
  projectDescription:
    'The G1 API Core. A high-performance, enterprise, typescript API boilerplate built for maximum scale and security. Powered by Hono, Cloudflare workers, D1, Drizzle, and Better-Auth.',

  // Package Information
  packageName: '@g-1/core',
  packageVersion: '1.14.2',

  // Organization/Company
  orgScope: '@g-1', // npm scope (e.g., '@my-company')
  orgName: 'G1',

  // Contact Information
  authorName: 'Your Name',
  authorEmail: 'contact@example.com',
  supportEmail: 'support@example.com',

  // URLs
  homepageUrl: 'https://example.com',
  repositoryUrl: 'https://github.com/username/my-api-project',
  issuesUrl: 'https://github.com/username/my-api-project/issues',

  // Cloudflare Configuration
  workerName: 'my-api-project',
  databaseName: 'my_api_project',
  kvNamespace: 'MY_API_PROJECT_KV_AUTH',

  // API Configuration
  apiTitle: 'G1 Core API',
  apiVersion: '1.0.0',
  apiDescription: 'RESTful API built with Cloudflare Workers',

  // Development
  devPort: 8787,

  // Environment-specific overrides
  environments: {
    development: {
      workerName: 'my-api-project-dev',
      databaseName: 'my_api_project_dev',
    },
    staging: {
      workerName: 'my-api-project-staging',
      databaseName: 'my_api_project_staging',
    },
    production: {
      workerName: 'my-api-project',
      databaseName: 'my_api_project',
    },
  },
}

// Derived values (computed from above)
export const derived = {
  kebabCase: boilerplateConfig.projectName.toLowerCase().replace(/[^a-z0-9]/g, '-'),
  snakeCase: boilerplateConfig.projectName.toLowerCase().replace(/[^a-z0-9]/g, '_'),
  pascalCase: boilerplateConfig.projectName
    .split(/[-_\s]/)
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(''),
  constantCase: boilerplateConfig.projectName.toUpperCase().replace(/[^A-Z0-9]/g, '_'),
}
