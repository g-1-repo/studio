import type { CliPlugin, PluginContext, PluginConfigValue } from '../types.js'

/**
 * OpenAPI Documentation Plugin
 * Adds OpenAPI specification with Scalar documentation UI
 */
export const openApiPlugin: CliPlugin = {
  id: 'openapi',
  category: 'feature',
  description: 'Adds OpenAPI specification with Scalar documentation UI',
  
  config: {
    theme: {
      type: 'select',
      description: 'Scalar theme for documentation UI',
      options: [
        { name: 'Kepler (Default)', value: 'kepler' },
        { name: 'Saturn', value: 'saturn' },
        { name: 'Mars', value: 'mars' },
        { name: 'Moon', value: 'moon' },
        { name: 'Alternate', value: 'alternate' },
        { name: 'Purple', value: 'purple' },
        { name: 'Solarized', value: 'solarized' },
        { name: 'Blue Planet', value: 'bluePlanet' },
        { name: 'Deep Space', value: 'deepSpace' },
        { name: 'Laserwave', value: 'laserwave' },
        { name: 'None', value: 'none' }
      ],
      default: 'kepler'
    },
    layout: {
      type: 'select',
      description: 'Layout style for the API reference',
      options: [
        { name: 'Modern', value: 'modern' },
        { name: 'Classic', value: 'classic' }
      ],
      default: 'modern'
    },
    title: {
      type: 'string',
      description: 'API documentation title',
      default: '{{projectName}} API'
    },
    description: {
      type: 'string',
      description: 'API description',
      default: 'API documentation for {{projectName}}'
    },
    specEndpoint: {
      type: 'string',
      description: 'OpenAPI specification endpoint',
      default: '/doc'
    },
    docsEndpoint: {
      type: 'string',
      description: 'Documentation UI endpoint',
      default: '/reference'
    },
    version: {
      type: 'string',
      description: 'API version',
      default: '1.0.0'
    },
    customCss: {
      type: 'string',
      description: 'Custom CSS to inject into the documentation',
      default: ''
    },
    withDefaultFonts: {
      type: 'boolean',
      description: 'Whether to use Scalar\'s default fonts',
      default: true
    },
    favicon: {
      type: 'string',
      description: 'Custom favicon URL for the documentation page',
      default: ''
    },
    pageTitle: {
      type: 'string',
      description: 'Custom page title for the documentation',
      default: ''
    },
    showSidebar: {
      type: 'boolean',
      description: 'Whether to show the sidebar',
      default: true
    },
    hideModels: {
      type: 'boolean',
      description: 'Whether to hide the models section',
      default: false
    },
    hideDownloadButton: {
      type: 'boolean',
      description: 'Whether to hide the download button',
      default: false
    },
    isEditable: {
      type: 'boolean',
      description: 'Whether the documentation is editable',
      default: false
    },
    darkMode: {
      type: 'boolean',
      description: 'Force dark mode on/off',
      default: false
    },
    proxy: {
      type: 'string',
      description: 'Proxy configuration for API calls',
      default: ''
    }
  },

  prepare(ctx: PluginContext, config: Record<string, PluginConfigValue>) {
    // Add required dependencies
    ctx.addDependency('@scalar/hono-api-reference')
  },

  async apply(ctx: PluginContext, config: Record<string, PluginConfigValue>): Promise<void> {
    const theme = config.theme || 'kepler'
    const layout = config.layout || 'modern'
    const title = config.title || `${ctx.config.projectName} API`
    const description = config.description || `API documentation for ${ctx.config.projectName}`
    const specEndpoint = config.specEndpoint || '/doc'
    const docsEndpoint = config.docsEndpoint || '/reference'
    const version = config.version || '1.0.0'
    const customCss = config.customCss || ''
    const withDefaultFonts = config.withDefaultFonts !== false
    const favicon = config.favicon || ''
    const pageTitle = config.pageTitle || title
    const showSidebar = config.showSidebar !== false
    const hideModels = config.hideModels || false
    const hideDownloadButton = config.hideDownloadButton || false
    const isEditable = config.isEditable || false
    const darkMode = config.darkMode || false
    const proxy = config.proxy || ''

    // Generate the OpenAPI configuration file
    const configContent = `import { apiReference } from '@scalar/hono-api-reference'
import packageJSON from '../../package.json' with { type: 'json' }
import type { AppOpenAPI } from './types'

export default function configureOpenAPI(app: AppOpenAPI) {
  app.doc('${specEndpoint}', {
    openapi: '3.1.1',
    info: {
      version: packageJSON.version || '${version}',
      title: '${title}',
      description: '${description}',
    },
  })

  const scalarConfig = {
    theme: '${theme}',
    layout: '${layout}',
    customCss: \`${customCss}\`,
    withDefaultFonts: ${withDefaultFonts},
    favicon: '${favicon}',
    pageTitle: '${pageTitle}',
    showSidebar: ${showSidebar},
    hideModels: ${hideModels},
    hideDownloadButton: ${hideDownloadButton},
    isEditable: ${isEditable},
    darkMode: ${darkMode},
    proxy: '${proxy}',
    defaultHttpClient: {
      targetKey: 'js',
      clientKey: 'fetch',
    },
  }

  app.get(
    '${docsEndpoint}',
    apiReference(scalarConfig)
  )
}
`

    await ctx.addFile('src/lib/configure-open-api.ts', configContent)

    // Check if main app file exists and modify it to include OpenAPI
    if (await ctx.fileExists('src/index.ts')) {
      await ctx.modifyFile('src/index.ts', (content: string) => {
        // Add import if not already present
        if (!content.includes('configureOpenAPI')) {
          const importLine = "import configureOpenAPI from './lib/configure-open-api.js'"
          
          // Find the last import statement
          const lines = content.split('\\n')
          let lastImportIndex = -1
          
          for (let i = 0; i < lines.length; i++) {
            if (lines[i].trim().startsWith('import ')) {
              lastImportIndex = i
            }
          }
          
          if (lastImportIndex >= 0) {
            lines.splice(lastImportIndex + 1, 0, importLine)
          } else {
            lines.unshift(importLine)
          }
          
          content = lines.join('\\n')
        }

        // Add OpenAPI configuration call if not already present
        if (!content.includes('configureOpenAPI(app)')) {
          // Find where to insert the configuration call
          // Look for app creation or export
          if (content.includes('const app = ') || content.includes('export const app = ')) {
            const lines = content.split('\\n')
            let insertIndex = -1
            
            for (let i = 0; i < lines.length; i++) {
              if (lines[i].includes('const app = ') || lines[i].includes('export const app = ')) {
                insertIndex = i + 1
                break
              }
            }
            
            if (insertIndex >= 0) {
              lines.splice(insertIndex, 0, '', '// Configure OpenAPI documentation', 'configureOpenAPI(app)')
              content = lines.join('\\n')
            }
          }
        }

        return content
      })
    }

    // Add types if they don't exist
    if (!(await ctx.fileExists('src/lib/types.ts'))) {
      const typesContent = `import type { OpenAPIHono } from '@hono/zod-openapi'

export type AppOpenAPI = OpenAPIHono
`
      await ctx.addFile('src/lib/types.ts', typesContent)
    } else {
      // Ensure AppOpenAPI type is available
      await ctx.modifyFile('src/lib/types.ts', (content: string) => {
        if (!content.includes('AppOpenAPI')) {
          const typeDefinition = "\\nexport type AppOpenAPI = OpenAPIHono\\n"
          
          if (!content.includes("import type { OpenAPIHono } from '@hono/zod-openapi'")) {
            content = "import type { OpenAPIHono } from '@hono/zod-openapi'\\n" + content
          }
          
          content += typeDefinition
        }
        return content
      })
    }
  }
}