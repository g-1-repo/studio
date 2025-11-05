#!/usr/bin/env bun
import fs from 'node:fs'
import path from 'node:path'

import {
  PostmanGenerator,
  POSTMAN_CONFIGS,
  createPostmanFromOpenAPI,
} from '../packages/templates/src/docs/postman.template'

type Args = {
  openapi?: string
  out?: string
  name?: string
  env?: boolean
  sample?: boolean
}

function parseArgs(argv: string[]): Args {
  const args: Args = {}
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i]
    if (a === '--openapi' && argv[i + 1]) args.openapi = argv[++i]
    else if (a === '--out' && argv[i + 1]) args.out = argv[++i]
    else if (a === '--name' && argv[i + 1]) args.name = argv[++i]
    else if (a === '--env') args.env = true
    else if (a === '--sample') args.sample = true
  }
  return args
}

function ensureDir(dir: string) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true })
  }
}

async function main() {
  const args = parseArgs(process.argv.slice(2))
  const outDir = path.resolve(args.out || '.')
  ensureDir(outDir)

  let generator: PostmanGenerator

  try {
    if (args.openapi) {
      const specPath = path.resolve(args.openapi)
      const content = fs.readFileSync(specPath, 'utf8')
      let spec: unknown
      try {
        spec = JSON.parse(content)
      } catch {
        // If JSON parse fails, try very basic YAML support (line-based key parsing is out of scope)
        throw new Error('OpenAPI file must be valid JSON')
      }

      generator = createPostmanFromOpenAPI(spec, {
        ...POSTMAN_CONFIGS.development,
        name: args.name || POSTMAN_CONFIGS.development.name,
      })
    } else {
      generator = new PostmanGenerator({
        ...POSTMAN_CONFIGS.development,
        name: args.name || POSTMAN_CONFIGS.development.name,
      })

      if (args.sample) {
        generator
          .addFolder('Users', 'User endpoints')
          .addRequest('Get Users', 'GET', '/users', {
            description: 'Retrieve all users',
            folder: 'Users',
          })
          .addRequest('Create User', 'POST', '/users', {
            description: 'Create a new user',
            folder: 'Users',
            body: { name: 'John Doe', email: 'john@example.com' },
            examples: [
              {
                name: '201 Created',
                status: 201,
                body: { id: 1, name: 'John Doe' },
                headers: { 'Content-Type': 'application/json' },
              },
            ],
          })
      }
    }

    const collectionJson = generator.exportCollection()
    const collectionPath = path.join(outDir, 'postman_collection.json')
    fs.writeFileSync(collectionPath, collectionJson)

    if (args.env || POSTMAN_CONFIGS.development.generateEnvironment) {
      const envJson = generator.exportEnvironment()
      const envPath = path.join(outDir, 'postman_environment.json')
      fs.writeFileSync(envPath, envJson)
    }

    console.log('Postman files generated:')
    console.log(`- ${collectionPath}`)
    if (args.env || POSTMAN_CONFIGS.development.generateEnvironment) {
      console.log(`- ${path.join(outDir, 'postman_environment.json')}`)
    }
  } catch (err) {
    console.error('Failed to generate Postman collection:', err instanceof Error ? err.message : err)
    process.exitCode = 1
  }
}

main()

