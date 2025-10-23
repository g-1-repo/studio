/**
 * Template variables for homepage rendering
 */
export interface HomepageVariables extends Record<string, string> {
  API_NAME: string
  API_DESCRIPTION: string
  BASE_URL: string
  COMPANY_NAME: string
  CURRENT_YEAR: string
  ENDPOINT_COUNT: string
}

/**
 * Inline homepage template for Cloudflare Workers compatibility
 */
const HOMEPAGE_TEMPLATE = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>{{API_NAME}} - API Documentation & Developer Portal</title>
    <meta name="description" content="RESTful API built with Cloudflare Workers">
    <link rel="icon" type="image/x-icon" href="/favicon.ico">
    <style>
        :root {
            --primary-color: #3b82f6;
            --primary-dark: #2563eb;
            --background: #ffffff;
            --surface: #f8fafc;
            --border: #e2e8f0;
            --text-primary: #1e293b;
            --text-secondary: #64748b;
            --shadow: 0 1px 3px 0 rgb(0 0 0 / 0.1);
        }
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, sans-serif;
            background: var(--background);
            color: var(--text-primary);
            line-height: 1.6;
        }
        .container { max-width: 1200px; margin: 0 auto; padding: 0 1rem; }
        .header {
            background: var(--surface);
            border-bottom: 1px solid var(--border);
            position: sticky;
            top: 0;
            z-index: 100;
        }
        .nav {
            display: flex;
            align-items: center;
            justify-content: space-between;
            padding: 1rem 0;
        }
        .logo {
            font-size: 1.5rem;
            font-weight: bold;
            text-decoration: none;
            color: var(--primary-color);
        }
        .nav-links {
            display: flex;
            align-items: center;
            gap: 2rem;
        }
        .nav-link {
            text-decoration: none;
            color: var(--text-secondary);
            transition: color 0.2s;
        }
        .nav-link:hover { color: var(--primary-color); }
        .status-badge {
            display: inline-flex;
            align-items: center;
            gap: 0.5rem;
            padding: 0.25rem 0.75rem;
            border-radius: 1rem;
            font-size: 0.875rem;
            font-weight: 500;
            background: #dcfce7;
            color: #166534;
        }
        .pulse {
            width: 8px;
            height: 8px;
            border-radius: 50%;
            background: #10b981;
            animation: pulse 2s infinite;
        }
        @keyframes pulse {
            0%, 100% { opacity: 1; }
            50% { opacity: 0.5; }
        }
        .hero {
            text-align: center;
            padding: 4rem 0;
            background: linear-gradient(135deg, var(--surface) 0%, var(--background) 100%);
        }
        .hero h1 {
            font-size: 3rem;
            font-weight: bold;
            margin-bottom: 1rem;
            background: linear-gradient(135deg, var(--primary-color), var(--primary-dark));
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
        }
        .hero p {
            font-size: 1.25rem;
            color: var(--text-secondary);
            margin-bottom: 2rem;
            max-width: 600px;
            margin-left: auto;
            margin-right: auto;
        }
        .cta-buttons {
            display: flex;
            gap: 1rem;
            justify-content: center;
            flex-wrap: wrap;
        }
        .btn {
            display: inline-flex;
            align-items: center;
            gap: 0.5rem;
            padding: 0.75rem 1.5rem;
            border-radius: 0.5rem;
            text-decoration: none;
            font-weight: 500;
            transition: all 0.2s;
            border: none;
            cursor: pointer;
        }
        .btn-primary {
            background: var(--primary-color);
            color: white;
        }
        .btn-primary:hover { background: var(--primary-dark); }
        .btn-secondary {
            background: var(--surface);
            color: var(--text-primary);
            border: 1px solid var(--border);
        }
        .btn-secondary:hover { background: var(--border); }
        .features {
            padding: 4rem 0;
            background: var(--surface);
        }
        .features-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
            gap: 2rem;
        }
        .feature-card {
            background: var(--background);
            padding: 2rem;
            border-radius: 0.75rem;
            box-shadow: var(--shadow);
            border: 1px solid var(--border);
        }
        .feature-icon {
            width: 3rem;
            height: 3rem;
            background: var(--primary-color);
            border-radius: 0.75rem;
            display: flex;
            align-items: center;
            justify-content: center;
            margin-bottom: 1rem;
            font-size: 1.5rem;
            color: white;
        }
        .quick-start {
            padding: 4rem 0;
        }
        .code-block {
            background: #1e293b;
            color: #f1f5f9;
            padding: 1.5rem;
            border-radius: 0.5rem;
            overflow-x: auto;
            margin: 1rem 0;
            font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
        }
        .footer {
            background: var(--surface);
            border-top: 1px solid var(--border);
            padding: 2rem 0;
            text-align: center;
        }
        .footer-links {
            display: flex;
            justify-content: center;
            gap: 2rem;
            margin-bottom: 1rem;
        }
        @media (max-width: 768px) {
            .hero h1 { font-size: 2rem; }
            .nav-links { gap: 1rem; }
            .cta-buttons { flex-direction: column; align-items: center; }
        }
    </style>
</head>
<body>
    <header class="header">
        <nav class="container">
            <div class="nav">
                <a href="/" class="logo">{{API_NAME}}</a>
                <div class="nav-links">
                    <a href="/doc" class="nav-link">API Docs</a>
                    <a href="/reference" class="nav-link">Reference</a>
                    <a href="/health" class="nav-link">Status</a>
                    <a href="/dashboard" class="nav-link">Dashboard</a>
                    <span id="api-status" class="status-badge">
                        <div class="pulse"></div>
                        <span>Operational</span>
                    </span>
                </div>
            </div>
        </nav>
    </header>
    <main>
        <section class="hero">
            <div class="container">
                <h1>{{API_NAME}}</h1>
                <p>RESTful API built with Cloudflare Workers</p>
                <div class="cta-buttons">
                    <a href="/reference" class="btn btn-primary">📚 Explore API</a>
                    <a href="/doc" class="btn btn-secondary">📖 Documentation</a>
                    <a href="/dashboard" class="btn btn-secondary">🔐 Test Auth</a>
                </div>
            </div>
        </section>
        <section class="features">
            <div class="container">
                <h2 style="text-align: center; margin-bottom: 3rem; font-size: 2.5rem;">Features</h2>
                <div class="features-grid">
                    <div class="feature-card">
                        <div class="feature-icon">🚀</div>
                        <h3>Fast & Reliable</h3>
                        <p>Built on Cloudflare Workers for global edge performance with sub-100ms response times worldwide.</p>
                    </div>
                    <div class="feature-card">
                        <div class="feature-icon">🔒</div>
                        <h3>Secure Authentication</h3>
                        <p>Enterprise-grade security with JWT tokens, rate limiting, and comprehensive auth flows.</p>
                    </div>
                    <div class="feature-card">
                        <div class="feature-icon">📊</div>
                        <h3>RESTful Design</h3>
                        <p>Clean, intuitive API design following REST principles with comprehensive OpenAPI documentation.</p>
                    </div>
                    <div class="feature-card">
                        <div class="feature-icon">🔧</div>
                        <h3>Developer Friendly</h3>
                        <p>Detailed documentation, code examples, and SDKs to get you up and running quickly.</p>
                    </div>
                </div>
            </div>
        </section>
        <section class="quick-start">
            <div class="container" style="background: var(--surface); padding: 4rem 0;">
                <h2 style="text-align: center; margin-bottom: 3rem; font-size: 2.5rem;">Quick Start</h2>
                <div style="max-width: 800px; margin: 0 auto;">
                    <h3>1. Try Anonymous Authentication</h3>
                    <div class="code-block">curl -X POST {{BASE_URL}}/api/auth/sign-in/anonymous \\
  -H "Content-Type: application/json" \\
  -d '{}'</div>
                    <h3>2. Explore Available Endpoints</h3>
                    <div class="code-block">curl -X GET {{BASE_URL}}/api/early-access-requests \\
  -H "Authorization: Bearer YOUR_TOKEN"</div>
                    <h3>3. Interactive Testing</h3>
                    <p style="margin-top: 1rem;">Visit our <a href="/reference" style="color: var(--primary-color);">interactive API reference</a> to explore all available endpoints and try them directly in your browser.</p>
                </div>
            </div>
        </section>
    </main>
    <footer class="footer">
        <div class="container">
            <div class="footer-links">
                <a href="/doc" class="nav-link">Documentation</a>
                <a href="/reference" class="nav-link">API Reference</a>
                <a href="/health" class="nav-link">System Status</a>
                <a href="/dashboard" class="nav-link">Dashboard</a>
            </div>
            <p style="color: var(--text-secondary);">© {{CURRENT_YEAR}} {{COMPANY_NAME}}. Built with ❤️ for developers.</p>
        </div>
    </footer>
    <script>
        async function checkAPIStatus() {
            try {
                const response = await window['fetch']('/health');
                const statusElement = document.getElementById('api-status');
                if (response.ok) {
                    statusElement.innerHTML = '<div class="pulse"></div><span>Operational</span>';
                } else {
                    statusElement.innerHTML = '<div style="background: #dc2626; width: 8px; height: 8px; border-radius: 50%; margin-right: 8px;"></div><span>Issues</span>';
                }
            } catch (error) {
                console.error('Health check failed:', error);
            }
        }
        document.addEventListener('DOMContentLoaded', () => {
            checkAPIStatus();
            window['setInterval'](checkAPIStatus, 30000);
        });
    </script>
</body>
</html>`

/**
 * Simple template renderer with variable substitution
 * Replaces {{VARIABLE_NAME}} placeholders with actual values
 */
export class TemplateRenderer {
  private static templateCache: Map<string, string> = new Map()

  /**
   * Render template with variables
   */
  static render(templateName: string, variables: Record<string, string>): string {
    const template = this.getTemplate(templateName)

    return template.replace(/\{\{([^}]+)\}\}/g, (match, variableName) => {
      const trimmedName = variableName.trim()
      return variables[trimmedName] ?? match // Return original if variable not found
    })
  }

  /**
   * Get template content with caching
   */
  private static getTemplate(templateName: string): string {
    if (this.templateCache.has(templateName)) {
      return this.templateCache.get(templateName)!
    }

    let template: string

    // Use inline templates for Cloudflare Workers compatibility
    switch (templateName) {
      case 'homepage':
        template = HOMEPAGE_TEMPLATE
        break
      case 'fallback':
      default:
        template = this.getFallbackTemplate()
        break
    }

    this.templateCache.set(templateName, template)
    return template
  }

  /**
   * Fallback template when main template fails to load
   */
  private static getFallbackTemplate(): string {
    return `
      <!DOCTYPE html>
      <html lang="en">
      <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>{{API_NAME}} - API Documentation</title>
          <style>
              body { font-family: system-ui, sans-serif; max-width: 800px; margin: 0 auto; padding: 2rem; }
              .header { text-align: center; margin-bottom: 3rem; }
              .api-links { display: flex; gap: 1rem; justify-content: center; }
              .api-link { 
                  padding: 0.75rem 1.5rem; 
                  background: #3b82f6; 
                  color: white; 
                  text-decoration: none; 
                  border-radius: 0.5rem; 
              }
              .api-link:hover { background: #2563eb; }
          </style>
      </head>
      <body>
          <div class="header">
              <h1>{{API_NAME}}</h1>
              <p>RESTful API built with Cloudflare Workers</p>
          </div>
          
          <div class="api-links">
              <a href="/doc" class="api-link">📖 Documentation</a>
              <a href="/reference" class="api-link">📚 API Reference</a>
              <a href="/health" class="api-link">⚡ Health Check</a>
          </div>
      </body>
      </html>
    `
  }

  /**
   * Clear template cache (useful for development/testing)
   */
  static clearCache(): void {
    this.templateCache.clear()
  }
}

/**
 * Get default homepage variables
 */
export function getHomepageVariables(): HomepageVariables {
  return {
    API_NAME: 'G1 Core API',
    API_DESCRIPTION: 'A modern, scalable API built with TypeScript, Hono, and Cloudflare Workers. Fast, secure, and developer-friendly.',
    BASE_URL: 'http://localhost:8787',
    COMPANY_NAME: 'G1',
    CURRENT_YEAR: new Date().getFullYear().toString(),
    ENDPOINT_COUNT: '15',
  }
}
