/**
 * ReDoc template for alternative API documentation interface
 */

export interface RedocConfig {
  title?: string
  specUrl?: string
  spec?: object
  theme?: {
    colors?: {
      primary?: {
        main?: string
        light?: string
        dark?: string
        contrastText?: string
      }
      success?: {
        main?: string
        light?: string
        dark?: string
        contrastText?: string
      }
      warning?: {
        main?: string
        light?: string
        dark?: string
        contrastText?: string
      }
      error?: {
        main?: string
        light?: string
        dark?: string
        contrastText?: string
      }
      gray?: {
        50?: string
        100?: string
      }
      text?: {
        primary?: string
        secondary?: string
      }
      border?: {
        dark?: string
        light?: string
      }
    }
    typography?: {
      fontSize?: string
      lineHeight?: string
      fontWeightRegular?: string
      fontWeightBold?: string
      fontWeightLight?: string
      fontFamily?: string
      smoothing?: string
      optimizeSpeed?: boolean
      headings?: {
        fontFamily?: string
        fontWeight?: string
        lineHeight?: string
      }
      code?: {
        fontSize?: string
        fontFamily?: string
        lineHeight?: string
        fontWeight?: string
        color?: string
        backgroundColor?: string
        wrap?: boolean
      }
      links?: {
        color?: string
        visited?: string
        hover?: string
      }
    }
    sidebar?: {
      width?: string
      backgroundColor?: string
      textColor?: string
      activeTextColor?: string
      groupItems?: {
        activeBackgroundColor?: string
        activeTextColor?: string
        textTransform?: string
      }
      level1Items?: {
        activeBackgroundColor?: string
        activeTextColor?: string
        textTransform?: string
      }
      arrow?: {
        size?: string
        color?: string
      }
    }
    rightPanel?: {
      backgroundColor?: string
      width?: string
      textColor?: string
    }
    codeBlock?: {
      backgroundColor?: string
    }
  }
  options?: {
    disableSearch?: boolean
    expandDefaultServerVariables?: boolean
    expandResponses?: string
    generateCodeSamples?: {
      languages?: Array<{
        lang: string
        label?: string
        source?: string
      }>
    }
    hideDownloadButton?: boolean
    hideHostname?: boolean
    hideLoading?: boolean
    hideSingleRequestSampleTab?: boolean
    jsonSampleExpandLevel?: number | 'all'
    maxDisplayedEnumValues?: number
    menuToggle?: boolean
    nativeScrollbars?: boolean
    noAutoAuth?: boolean
    onlyRequiredInSamples?: boolean
    pathInMiddlePanel?: boolean
    requiredPropsFirst?: boolean
    scrollYOffset?: number | string
    showExtensions?: boolean | string[]
    sortPropsAlphabetically?: boolean
    suppressWarnings?: boolean
    payloadSampleIdx?: number
    expandSingleSchemaField?: boolean
    schemaExpansionLevel?: number | 'all'
    simpleOneOfTypeLabel?: boolean
    sortEnumValuesAlphabetically?: boolean
    untrustedSpec?: boolean
  }
  customCss?: string
  customJs?: string
}

export const DEFAULT_REDOC_CONFIG: RedocConfig = {
  title: 'API Documentation',
  theme: {
    colors: {
      primary: {
        main: '#32329f',
      },
    },
    typography: {
      fontSize: '14px',
      lineHeight: '1.5em',
      code: {
        fontSize: '13px',
        fontFamily: 'Courier, monospace',
        lineHeight: '1.5em',
        wrap: false,
      },
    },
    sidebar: {
      width: '260px',
      backgroundColor: '#fafafa',
    },
    rightPanel: {
      backgroundColor: '#263238',
      width: '40%',
    },
  },
  options: {
    disableSearch: false,
    expandResponses: '200,201',
    hideDownloadButton: false,
    hideHostname: false,
    hideLoading: false,
    jsonSampleExpandLevel: 2,
    menuToggle: true,
    nativeScrollbars: false,
    pathInMiddlePanel: false,
    requiredPropsFirst: false,
    scrollYOffset: 0,
    showExtensions: false,
    sortPropsAlphabetically: false,
    suppressWarnings: false,
  },
}

export function generateRedocHTML(config: RedocConfig = DEFAULT_REDOC_CONFIG): string {
  const optionsJson = JSON.stringify(config.options || {}, null, 2)
  const themeJson = JSON.stringify(config.theme || {}, null, 2)

  return `<!DOCTYPE html>
<html>
<head>
  <title>${config.title || 'API Documentation'}</title>
  <meta charset="utf-8"/>
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <link href="https://fonts.googleapis.com/css?family=Montserrat:300,400,700|Roboto:300,400,700" rel="stylesheet">
  <style>
    body {
      margin: 0;
      padding: 0;
    }
    
    ${config.customCss || ''}
  </style>
</head>
<body>
  <div id="redoc-container"></div>
  
  <script src="https://cdn.redoc.ly/redoc/latest/bundles/redoc.standalone.js"></script>
  <script>
    const redocOptions = ${optionsJson};
    const redocTheme = ${themeJson};
    
    Redoc.init(
      ${config.spec ? JSON.stringify(config.spec) : `"${config.specUrl}"`},
      {
        ...redocOptions,
        theme: redocTheme
      },
      document.getElementById('redoc-container')
    );
  </script>
  
  ${config.customJs ? `<script>${config.customJs}</script>` : ''}
</body>
</html>`
}

export function createRedocMiddleware(config: RedocConfig = DEFAULT_REDOC_CONFIG) {
  return (c: any) => {
    const html = generateRedocHTML(config)
    c.header('Content-Type', 'text/html')
    return c.html(html)
  }
}

export function createRedocRoute(
  specUrl: string,
  config: Partial<RedocConfig> = {}
) {
  const fullConfig = {
    ...DEFAULT_REDOC_CONFIG,
    ...config,
    specUrl,
  }

  return createRedocMiddleware(fullConfig)
}

export function createRedocWithSpec(
  spec: object,
  config: Partial<RedocConfig> = {}
) {
  const fullConfig = {
    ...DEFAULT_REDOC_CONFIG,
    ...config,
    spec,
  }

  return createRedocMiddleware(fullConfig)
}

// Predefined ReDoc configurations
export const REDOC_CONFIGS = {
  default: {
    ...DEFAULT_REDOC_CONFIG,
    title: 'API Documentation',
  } as RedocConfig,

  minimal: {
    ...DEFAULT_REDOC_CONFIG,
    title: 'API Docs',
    options: {
      ...DEFAULT_REDOC_CONFIG.options,
      hideDownloadButton: true,
      disableSearch: true,
      menuToggle: false,
    },
    theme: {
      ...DEFAULT_REDOC_CONFIG.theme,
      sidebar: {
        width: '200px',
        backgroundColor: '#ffffff',
      },
    },
  } as RedocConfig,

  dark: {
    ...DEFAULT_REDOC_CONFIG,
    title: 'API Documentation',
    theme: {
      colors: {
        primary: {
          main: '#bb86fc',
        },
        text: {
          primary: '#ffffff',
          secondary: '#aaaaaa',
        },
        border: {
          dark: '#444444',
          light: '#666666',
        },
      },
      typography: {
        fontSize: '14px',
        lineHeight: '1.5em',
        code: {
          fontSize: '13px',
          fontFamily: 'Courier, monospace',
          color: '#bb86fc',
          backgroundColor: '#1e1e1e',
        },
      },
      sidebar: {
        width: '260px',
        backgroundColor: '#121212',
        textColor: '#ffffff',
        activeTextColor: '#bb86fc',
      },
      rightPanel: {
        backgroundColor: '#1e1e1e',
        width: '40%',
        textColor: '#ffffff',
      },
      codeBlock: {
        backgroundColor: '#1e1e1e',
      },
    },
    customCss: `
      body { background-color: #121212; color: #ffffff; }
    `,
  } as RedocConfig,

  compact: {
    ...DEFAULT_REDOC_CONFIG,
    title: 'API Documentation',
    theme: {
      ...DEFAULT_REDOC_CONFIG.theme,
      typography: {
        fontSize: '13px',
        lineHeight: '1.4em',
        code: {
          fontSize: '12px',
          fontFamily: 'Courier, monospace',
        },
      },
      sidebar: {
        width: '220px',
        backgroundColor: '#fafafa',
      },
      rightPanel: {
        width: '35%',
        backgroundColor: '#263238',
      },
    },
    options: {
      ...DEFAULT_REDOC_CONFIG.options,
      jsonSampleExpandLevel: 1,
      schemaExpansionLevel: 1,
    },
  } as RedocConfig,

  enterprise: {
    ...DEFAULT_REDOC_CONFIG,
    title: 'Enterprise API Documentation',
    theme: {
      colors: {
        primary: {
          main: '#1976d2',
        },
        success: {
          main: '#4caf50',
        },
        warning: {
          main: '#ff9800',
        },
        error: {
          main: '#f44336',
        },
      },
      typography: {
        fontSize: '14px',
        lineHeight: '1.6em',
        fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
        headings: {
          fontFamily: '"Montserrat", "Helvetica", "Arial", sans-serif',
          fontWeight: '600',
        },
        code: {
          fontSize: '13px',
          fontFamily: '"Fira Code", "Courier New", monospace',
          wrap: true,
        },
      },
      sidebar: {
        width: '280px',
        backgroundColor: '#f8f9fa',
        groupItems: {
          textTransform: 'uppercase',
        },
      },
      rightPanel: {
        backgroundColor: '#263238',
        width: '45%',
      },
    },
    options: {
      ...DEFAULT_REDOC_CONFIG.options,
      expandResponses: '200,201,400,401,403,404,500',
      jsonSampleExpandLevel: 3,
      requiredPropsFirst: true,
      sortPropsAlphabetically: true,
      showExtensions: ['x-code-samples', 'x-examples'],
    },
  } as RedocConfig,

  mobile: {
    ...DEFAULT_REDOC_CONFIG,
    title: 'Mobile API Documentation',
    theme: {
      ...DEFAULT_REDOC_CONFIG.theme,
      sidebar: {
        width: '100%',
        backgroundColor: '#ffffff',
      },
      rightPanel: {
        width: '100%',
        backgroundColor: '#f5f5f5',
      },
    },
    options: {
      ...DEFAULT_REDOC_CONFIG.options,
      menuToggle: true,
      nativeScrollbars: true,
      pathInMiddlePanel: true,
    },
    customCss: `
      @media (max-width: 768px) {
        .redoc-wrap {
          flex-direction: column;
        }
        
        .menu-content {
          width: 100% !important;
        }
        
        .api-content {
          width: 100% !important;
        }
      }
    `,
  } as RedocConfig,
}

// Helper functions for ReDoc customizations
export const REDOC_HELPERS = {
  // Create a branded theme
  createBrandedTheme: (brandColor: string, logoUrl?: string) => ({
    colors: {
      primary: {
        main: brandColor,
      },
    },
    customCss: logoUrl ? `
      .redoc-wrap > div:first-child::before {
        content: '';
        background-image: url('${logoUrl}');
        background-size: contain;
        background-repeat: no-repeat;
        height: 40px;
        width: 120px;
        display: block;
        margin: 20px;
      }
    ` : '',
  }),

  // Add code samples for multiple languages
  withCodeSamples: (languages: string[]) => ({
    options: {
      generateCodeSamples: {
        languages: languages.map(lang => ({
          lang,
          label: lang.charAt(0).toUpperCase() + lang.slice(1),
        })),
      },
    },
  }),

  // Configure for mobile-first design
  mobileOptimized: () => ({
    options: {
      menuToggle: true,
      nativeScrollbars: true,
      pathInMiddlePanel: true,
    },
    customCss: `
      @media (max-width: 768px) {
        .redoc-wrap { flex-direction: column; }
        .menu-content { width: 100% !important; }
        .api-content { width: 100% !important; }
      }
    `,
  }),

  // Add analytics tracking
  withAnalytics: (trackingId: string) => ({
    customJs: `
      // Google Analytics
      (function(i,s,o,g,r,a,m){i['GoogleAnalyticsObject']=r;i[r]=i[r]||function(){
      (i[r].q=i[r].q||[]).push(arguments)},i[r].l=1*new Date();a=s.createElement(o),
      m=s.getElementsByTagName(o)[0];a.async=1;a.src=g;m.parentNode.insertBefore(a,m)
      })(window,document,'script','https://www.google-analytics.com/analytics.js','ga');
      
      ga('create', '${trackingId}', 'auto');
      ga('send', 'pageview');
      
      // Track API endpoint interactions
      document.addEventListener('click', function(e) {
        if (e.target.closest('.operation-tag')) {
          ga('send', 'event', 'API Docs', 'Operation Click', e.target.textContent);
        }
      });
    `,
  }),

  // Add custom search functionality
  withCustomSearch: () => ({
    options: {
      disableSearch: false,
    },
    customJs: `
      // Enhanced search functionality
      document.addEventListener('DOMContentLoaded', function() {
        const searchInput = document.querySelector('input[placeholder*="Search"]');
        if (searchInput) {
          searchInput.addEventListener('input', function(e) {
            console.log('Search query:', e.target.value);
            // Add custom search analytics or functionality
          });
        }
      });
    `,
  }),
}

// Theme presets
export const REDOC_THEMES = {
  light: {
    colors: {
      primary: { main: '#1976d2' },
      text: { primary: '#333333', secondary: '#666666' },
      border: { dark: '#cccccc', light: '#eeeeee' },
    },
    sidebar: {
      backgroundColor: '#fafafa',
      textColor: '#333333',
    },
    rightPanel: {
      backgroundColor: '#263238',
      textColor: '#ffffff',
    },
  },

  dark: {
    colors: {
      primary: { main: '#bb86fc' },
      text: { primary: '#ffffff', secondary: '#aaaaaa' },
      border: { dark: '#444444', light: '#666666' },
    },
    sidebar: {
      backgroundColor: '#121212',
      textColor: '#ffffff',
    },
    rightPanel: {
      backgroundColor: '#1e1e1e',
      textColor: '#ffffff',
    },
  },

  blue: {
    colors: {
      primary: { main: '#2196f3' },
      success: { main: '#4caf50' },
      warning: { main: '#ff9800' },
      error: { main: '#f44336' },
    },
    sidebar: {
      backgroundColor: '#e3f2fd',
    },
    rightPanel: {
      backgroundColor: '#1565c0',
    },
  },

  green: {
    colors: {
      primary: { main: '#4caf50' },
      success: { main: '#8bc34a' },
      warning: { main: '#ff9800' },
      error: { main: '#f44336' },
    },
    sidebar: {
      backgroundColor: '#e8f5e8',
    },
    rightPanel: {
      backgroundColor: '#2e7d32',
    },
  },
}

// Usage examples
export const REDOC_EXAMPLES = {
  basic: `
import { createRedocRoute, REDOC_CONFIGS } from './redoc.template'

const app = new Hono()

// Serve ReDoc at /docs
app.get('/docs', createRedocRoute('/openapi.json', REDOC_CONFIGS.default))

// Serve OpenAPI spec
app.get('/openapi.json', (c) => {
  return c.json(openApiSpec)
})
`,

  customTheme: `
import { 
  createRedocWithSpec, 
  REDOC_CONFIGS,
  REDOC_THEMES,
  REDOC_HELPERS 
} from './redoc.template'

const customConfig = {
  ...REDOC_CONFIGS.default,
  title: 'My API Documentation',
  theme: {
    ...REDOC_THEMES.dark,
    ...REDOC_HELPERS.createBrandedTheme('#ff6b35', '/logo.png'),
  },
  ...REDOC_HELPERS.withCodeSamples(['javascript', 'python', 'curl']),
  ...REDOC_HELPERS.withAnalytics('GA_TRACKING_ID'),
}

const app = new Hono()
app.get('/docs', createRedocWithSpec(openApiSpec, customConfig))
`,

  enterprise: `
import { 
  createRedocRoute,
  REDOC_CONFIGS,
  REDOC_HELPERS 
} from './redoc.template'

const enterpriseConfig = {
  ...REDOC_CONFIGS.enterprise,
  title: 'Enterprise API Documentation v2.0',
  ...REDOC_HELPERS.withCodeSamples(['javascript', 'python', 'java', 'csharp', 'curl']),
  ...REDOC_HELPERS.withAnalytics('GA_TRACKING_ID'),
  customCss: \`
    .redoc-wrap {
      font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
    }
    
    .api-info-wrapper {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
    }
    
    .operation-tag {
      border-radius: 6px;
      font-weight: 500;
    }
  \`,
}

const app = new Hono()
app.get('/api-docs', createRedocRoute('/api/openapi.json', enterpriseConfig))
`,

  multipleVersions: `
import { createRedocRoute, REDOC_CONFIGS } from './redoc.template'

const app = new Hono()

// Version 1 documentation
app.get('/docs/v1', createRedocRoute('/api/v1/openapi.json', {
  ...REDOC_CONFIGS.default,
  title: 'API Documentation v1.0 (Legacy)',
  customCss: \`
    .api-info-wrapper::after {
      content: 'LEGACY VERSION';
      background: #ff9800;
      color: white;
      padding: 4px 8px;
      border-radius: 4px;
      font-size: 12px;
      font-weight: bold;
      margin-left: 10px;
    }
  \`,
}))

// Version 2 documentation (current)
app.get('/docs/v2', createRedocRoute('/api/v2/openapi.json', {
  ...REDOC_CONFIGS.default,
  title: 'API Documentation v2.0',
}))

// Latest version redirect
app.get('/docs', (c) => c.redirect('/docs/v2'))
`,

  mobileOptimized: `
import { 
  createRedocRoute,
  REDOC_CONFIGS,
  REDOC_HELPERS 
} from './redoc.template'

const mobileConfig = {
  ...REDOC_CONFIGS.default,
  title: 'Mobile API Documentation',
  ...REDOC_HELPERS.mobileOptimized(),
  theme: {
    ...REDOC_CONFIGS.default.theme,
    typography: {
      fontSize: '16px', // Larger font for mobile
      lineHeight: '1.6em',
    },
  },
  options: {
    ...REDOC_CONFIGS.default.options,
    scrollYOffset: 60, // Account for mobile navigation
    jsonSampleExpandLevel: 1, // Collapsed by default on mobile
  },
}

const app = new Hono()
app.get('/mobile-docs', createRedocRoute('/openapi.json', mobileConfig))
`,
}