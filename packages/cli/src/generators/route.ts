import path from 'node:path'
import type { GenerateOptions } from '../types/index.js'
import { ensureWritableDirectory } from '../utils/file-system.js'
import { createTemplateVariables, renderTemplateToFile } from '../utils/template.js'

export async function generateRoute(options: GenerateOptions): Promise<string[]> {
  const { name, directory = '.', force = false, includeTests = true, includeDocs = true } = options

  const generatedFiles: string[] = []
  const outputDir = path.resolve(directory)

  // Ensure output directory exists
  await ensureWritableDirectory(outputDir)

  // Create template variables
  const variables = createTemplateVariables({
    projectName: name,
    ...options,
  })

  // Route handler file
  const routeFile = path.join(outputDir, `${variables.kebabName}.routes.ts`)
  await renderTemplateToFile(getRouteTemplate(), routeFile, variables, { overwrite: force })
  generatedFiles.push(routeFile)

  // Route types file
  const typesFile = path.join(outputDir, `${variables.kebabName}.types.ts`)
  await renderTemplateToFile(getRouteTypesTemplate(), typesFile, variables, { overwrite: force })
  generatedFiles.push(typesFile)

  // Route validation file
  const validationFile = path.join(outputDir, `${variables.kebabName}.validation.ts`)
  await renderTemplateToFile(getRouteValidationTemplate(), validationFile, variables, {
    overwrite: force,
  })
  generatedFiles.push(validationFile)

  // Route service file
  const serviceFile = path.join(outputDir, `${variables.kebabName}.service.ts`)
  await renderTemplateToFile(getRouteServiceTemplate(), serviceFile, variables, {
    overwrite: force,
  })
  generatedFiles.push(serviceFile)

  // Test file
  if (includeTests) {
    const testFile = path.join(outputDir, `${variables.kebabName}.routes.test.ts`)
    await renderTemplateToFile(getRouteTestTemplate(), testFile, variables, { overwrite: force })
    generatedFiles.push(testFile)
  }

  // Documentation file
  if (includeDocs) {
    const docsFile = path.join(outputDir, `${variables.kebabName}-routes.md`)
    await renderTemplateToFile(getRouteDocsTemplate(), docsFile, variables, { overwrite: force })
    generatedFiles.push(docsFile)
  }

  return generatedFiles
}

function getRouteTemplate(): string {
  return `import { Router } from 'express'
import type { Request, Response, NextFunction } from 'express'
import { {{pascalName}}Service } from './{{kebabName}}.service.js'
import { 
  validate{{pascalName}}Create,
  validate{{pascalName}}Update,
  validate{{pascalName}}Query
} from './{{kebabName}}.validation.js'
import type {
  {{pascalName}}CreateRequest,
  {{pascalName}}UpdateRequest,
  {{pascalName}}QueryRequest,
  {{pascalName}}Response,
  {{pascalName}}ListResponse,
  {{pascalName}}ErrorResponse
} from './{{kebabName}}.types.js'

export class {{pascalName}}Routes {
  private router: Router
  private service: {{pascalName}}Service

  constructor() {
    this.router = Router()
    this.service = new {{pascalName}}Service()
    this.setupRoutes()
  }

  private setupRoutes(): void {
    // GET /{{kebabName}} - List all {{name}}s
    this.router.get('/', this.list.bind(this))

    // GET /{{kebabName}}/:id - Get {{name}} by ID
    this.router.get('/:id', this.getById.bind(this))

    // POST /{{kebabName}} - Create new {{name}}
    this.router.post('/', validate{{pascalName}}Create, this.create.bind(this))

    // PUT /{{kebabName}}/:id - Update {{name}}
    this.router.put('/:id', validate{{pascalName}}Update, this.update.bind(this))

    // PATCH /{{kebabName}}/:id - Partial update {{name}}
    this.router.patch('/:id', validate{{pascalName}}Update, this.partialUpdate.bind(this))

    // DELETE /{{kebabName}}/:id - Delete {{name}}
    this.router.delete('/:id', this.delete.bind(this))

    // GET /{{kebabName}}/search - Search {{name}}s
    this.router.get('/search', validate{{pascalName}}Query, this.search.bind(this))

    // POST /{{kebabName}}/bulk - Bulk operations
    this.router.post('/bulk', this.bulkOperations.bind(this))

    // GET /{{kebabName}}/stats - Get statistics
    this.router.get('/stats', this.getStats.bind(this))
  }

  /**
   * GET /{{kebabName}}
   * List all {{name}}s with optional filtering and pagination
   */
  private async list(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const query = req.query as {{pascalName}}QueryRequest
      
      const result = await this.service.list({
        page: parseInt(query.page as string) || 1,
        limit: parseInt(query.limit as string) || 10,
        sort: query.sort as string,
        filter: query.filter as Record<string, any>
      })

      const response: {{pascalName}}ListResponse = {
        success: true,
        data: result.items,
        pagination: {
          page: result.page,
          limit: result.limit,
          total: result.total,
          pages: Math.ceil(result.total / result.limit)
        }
      }

      res.json(response)
    } catch (error) {
      next(this.handleError(error, 'Failed to list {{name}}s'))
    }
  }

  /**
   * GET /{{kebabName}}/:id
   * Get {{name}} by ID
   */
  private async getById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params
      
      const item = await this.service.getById(id)
      
      if (!item) {
        const errorResponse: {{pascalName}}ErrorResponse = {
          success: false,
          error: {
            code: 'NOT_FOUND',
            message: '{{name}} not found',
            details: { id }
          }
        }
        res.status(404).json(errorResponse)
        return
      }

      const response: {{pascalName}}Response = {
        success: true,
        data: item
      }

      res.json(response)
    } catch (error) {
      next(this.handleError(error, 'Failed to get {{name}}'))
    }
  }

  /**
   * POST /{{kebabName}}
   * Create new {{name}}
   */
  private async create(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const data = req.body as {{pascalName}}CreateRequest
      
      const item = await this.service.create(data)

      const response: {{pascalName}}Response = {
        success: true,
        data: item
      }

      res.status(201).json(response)
    } catch (error) {
      next(this.handleError(error, 'Failed to create {{name}}'))
    }
  }

  /**
   * PUT /{{kebabName}}/:id
   * Update {{name}}
   */
  private async update(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params
      const data = req.body as {{pascalName}}UpdateRequest
      
      const item = await this.service.update(id, data)
      
      if (!item) {
        const errorResponse: {{pascalName}}ErrorResponse = {
          success: false,
          error: {
            code: 'NOT_FOUND',
            message: '{{name}} not found',
            details: { id }
          }
        }
        res.status(404).json(errorResponse)
        return
      }

      const response: {{pascalName}}Response = {
        success: true,
        data: item
      }

      res.json(response)
    } catch (error) {
      next(this.handleError(error, 'Failed to update {{name}}'))
    }
  }

  /**
   * PATCH /{{kebabName}}/:id
   * Partial update {{name}}
   */
  private async partialUpdate(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params
      const data = req.body as Partial<{{pascalName}}UpdateRequest>
      
      const item = await this.service.partialUpdate(id, data)
      
      if (!item) {
        const errorResponse: {{pascalName}}ErrorResponse = {
          success: false,
          error: {
            code: 'NOT_FOUND',
            message: '{{name}} not found',
            details: { id }
          }
        }
        res.status(404).json(errorResponse)
        return
      }

      const response: {{pascalName}}Response = {
        success: true,
        data: item
      }

      res.json(response)
    } catch (error) {
      next(this.handleError(error, 'Failed to update {{name}}'))
    }
  }

  /**
   * DELETE /{{kebabName}}/:id
   * Delete {{name}}
   */
  private async delete(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params
      
      const deleted = await this.service.delete(id)
      
      if (!deleted) {
        const errorResponse: {{pascalName}}ErrorResponse = {
          success: false,
          error: {
            code: 'NOT_FOUND',
            message: '{{name}} not found',
            details: { id }
          }
        }
        res.status(404).json(errorResponse)
        return
      }

      res.status(204).send()
    } catch (error) {
      next(this.handleError(error, 'Failed to delete {{name}}'))
    }
  }

  /**
   * GET /{{kebabName}}/search
   * Search {{name}}s
   */
  private async search(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const query = req.query as {{pascalName}}QueryRequest
      
      const result = await this.service.search({
        query: query.q as string,
        fields: query.fields as string[],
        page: parseInt(query.page as string) || 1,
        limit: parseInt(query.limit as string) || 10
      })

      const response: {{pascalName}}ListResponse = {
        success: true,
        data: result.items,
        pagination: {
          page: result.page,
          limit: result.limit,
          total: result.total,
          pages: Math.ceil(result.total / result.limit)
        }
      }

      res.json(response)
    } catch (error) {
      next(this.handleError(error, 'Failed to search {{name}}s'))
    }
  }

  /**
   * POST /{{kebabName}}/bulk
   * Bulk operations
   */
  private async bulkOperations(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { operation, items } = req.body
      
      let result
      
      switch (operation) {
        case 'create':
          result = await this.service.bulkCreate(items)
          break
        case 'update':
          result = await this.service.bulkUpdate(items)
          break
        case 'delete':
          result = await this.service.bulkDelete(items)
          break
        default:
          const errorResponse: {{pascalName}}ErrorResponse = {
            success: false,
            error: {
              code: 'INVALID_OPERATION',
              message: 'Invalid bulk operation',
              details: { operation }
            }
          }
          res.status(400).json(errorResponse)
          return
      }

      res.json({
        success: true,
        data: result
      })
    } catch (error) {
      next(this.handleError(error, 'Failed to perform bulk operation'))
    }
  }

  /**
   * GET /{{kebabName}}/stats
   * Get statistics
   */
  private async getStats(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const stats = await this.service.getStats()

      res.json({
        success: true,
        data: stats
      })
    } catch (error) {
      next(this.handleError(error, 'Failed to get statistics'))
    }
  }

  /**
   * Handle and format errors
   */
  private handleError(error: any, message: string): {{pascalName}}ErrorResponse {
    console.error(\`{{name}} Routes Error:\`, error)

    return {
      success: false,
      error: {
        code: error.code || 'INTERNAL_ERROR',
        message: error.message || message,
        details: error.details || {}
      }
    }
  }

  /**
   * Get the router instance
   */
  public getRouter(): Router {
    return this.router
  }
}

// Export router factory
export function create{{pascalName}}Routes(): Router {
  const routes = new {{pascalName}}Routes()
  return routes.getRouter()
}

export default {{pascalName}}Routes`
}

function getRouteTypesTemplate(): string {
  return `// {{name}} Route Types

// Base entity interface
export interface {{pascalName}} {
  id: string
  name: string
  description?: string
  status: '{{camelName}}_status_active' | '{{camelName}}_status_inactive'
  createdAt: string
  updatedAt: string
  metadata?: Record<string, any>
}

// Request types
export interface {{pascalName}}CreateRequest {
  name: string
  description?: string
  status?: '{{camelName}}_status_active' | '{{camelName}}_status_inactive'
  metadata?: Record<string, any>
}

export interface {{pascalName}}UpdateRequest {
  name?: string
  description?: string
  status?: '{{camelName}}_status_active' | '{{camelName}}_status_inactive'
  metadata?: Record<string, any>
}

export interface {{pascalName}}QueryRequest {
  page?: string | number
  limit?: string | number
  sort?: string
  filter?: Record<string, any>
  q?: string // Search query
  fields?: string[] // Fields to search in
}

// Response types
export interface {{pascalName}}Response {
  success: true
  data: {{pascalName}}
}

export interface {{pascalName}}ListResponse {
  success: true
  data: {{pascalName}}[]
  pagination: {
    page: number
    limit: number
    total: number
    pages: number
  }
}

export interface {{pascalName}}ErrorResponse {
  success: false
  error: {
    code: string
    message: string
    details?: any
  }
}

// Service types
export interface {{pascalName}}ListOptions {
  page: number
  limit: number
  sort?: string
  filter?: Record<string, any>
}

export interface {{pascalName}}ListResult {
  items: {{pascalName}}[]
  page: number
  limit: number
  total: number
}

export interface {{pascalName}}SearchOptions {
  query: string
  fields?: string[]
  page: number
  limit: number
}

export interface {{pascalName}}SearchResult {
  items: {{pascalName}}[]
  page: number
  limit: number
  total: number
  relevance?: Record<string, number>
}

// Bulk operation types
export interface {{pascalName}}BulkCreateRequest {
  items: {{pascalName}}CreateRequest[]
}

export interface {{pascalName}}BulkUpdateRequest {
  items: Array<{ id: string } & Partial<{{pascalName}}UpdateRequest>>
}

export interface {{pascalName}}BulkDeleteRequest {
  ids: string[]
}

export interface {{pascalName}}BulkResult {
  success: number
  failed: number
  errors: Array<{
    item: any
    error: string
  }>
}

// Statistics types
export interface {{pascalName}}Stats {
  total: number
  active: number
  inactive: number
  createdToday: number
  createdThisWeek: number
  createdThisMonth: number
  averageCreationRate: number
  statusDistribution: Record<string, number>
  metadataStats?: Record<string, any>
}

// Validation types
export interface {{pascalName}}ValidationError {
  field: string
  message: string
  value?: any
}

export interface {{pascalName}}ValidationResult {
  valid: boolean
  errors: {{pascalName}}ValidationError[]
}

// Filter types
export interface {{pascalName}}Filter {
  name?: string | RegExp
  status?: '{{camelName}}_status_active' | '{{camelName}}_status_inactive'
  createdAt?: {
    from?: string
    to?: string
  }
  updatedAt?: {
    from?: string
    to?: string
  }
  metadata?: Record<string, any>
}

// Sort types
export type {{pascalName}}SortField = 'name' | 'status' | 'createdAt' | 'updatedAt'
export type {{pascalName}}SortOrder = 'asc' | 'desc'

export interface {{pascalName}}Sort {
  field: {{pascalName}}SortField
  order: {{pascalName}}SortOrder
}

// Event types
export interface {{pascalName}}Events {
  'created': { item: {{pascalName}} }
  'updated': { item: {{pascalName}}; changes: Partial<{{pascalName}}> }
  'deleted': { id: string }
  'bulk_created': { items: {{pascalName}}[]; result: {{pascalName}}BulkResult }
  'bulk_updated': { items: Array<{ id: string } & Partial<{{pascalName}}>>; result: {{pascalName}}BulkResult }
  'bulk_deleted': { ids: string[]; result: {{pascalName}}BulkResult }
}

// Middleware types
export interface {{pascalName}}Request extends Request {
  {{camelName}}?: {
    validated: boolean
    sanitized: boolean
    metadata: Record<string, any>
  }
}

// Database types (if using a database)
export interface {{pascalName}}Repository {
  findAll(options: {{pascalName}}ListOptions): Promise<{{pascalName}}ListResult>
  findById(id: string): Promise<{{pascalName}} | null>
  create(data: {{pascalName}}CreateRequest): Promise<{{pascalName}}>
  update(id: string, data: {{pascalName}}UpdateRequest): Promise<{{pascalName}} | null>
  partialUpdate(id: string, data: Partial<{{pascalName}}UpdateRequest>): Promise<{{pascalName}} | null>
  delete(id: string): Promise<boolean>
  search(options: {{pascalName}}SearchOptions): Promise<{{pascalName}}SearchResult>
  bulkCreate(items: {{pascalName}}CreateRequest[]): Promise<{{pascalName}}BulkResult>
  bulkUpdate(items: Array<{ id: string } & Partial<{{pascalName}}UpdateRequest>>): Promise<{{pascalName}}BulkResult>
  bulkDelete(ids: string[]): Promise<{{pascalName}}BulkResult>
  getStats(): Promise<{{pascalName}}Stats>
}

// Cache types
export interface {{pascalName}}CacheOptions {
  ttl?: number // Time to live in seconds
  key?: string // Custom cache key
  tags?: string[] // Cache tags for invalidation
}

// Export utility types
export type Create{{pascalName}}Data = Omit<{{pascalName}}, 'id' | 'createdAt' | 'updatedAt'>
export type Update{{pascalName}}Data = Partial<Omit<{{pascalName}}, 'id' | 'createdAt' | 'updatedAt'>>
export type {{pascalName}}ID = {{pascalName}}['id']
export type {{pascalName}}Status = {{pascalName}}['status']`
}

function getRouteValidationTemplate(): string {
  return `import { Request, Response, NextFunction } from 'express'
import type { 
  {{pascalName}}CreateRequest, 
  {{pascalName}}UpdateRequest, 
  {{pascalName}}QueryRequest,
  {{pascalName}}ValidationError,
  {{pascalName}}ValidationResult
} from './{{kebabName}}.types.js'

/**
 * Validation middleware for creating {{name}}
 */
export function validate{{pascalName}}Create(req: Request, res: Response, next: NextFunction): void {
  const result = validateCreateData(req.body)
  
  if (!result.valid) {
    res.status(400).json({
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Invalid {{name}} data',
        details: result.errors
      }
    })
    return
  }
  
  next()
}

/**
 * Validation middleware for updating {{name}}
 */
export function validate{{pascalName}}Update(req: Request, res: Response, next: NextFunction): void {
  const result = validateUpdateData(req.body)
  
  if (!result.valid) {
    res.status(400).json({
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Invalid {{name}} update data',
        details: result.errors
      }
    })
    return
  }
  
  next()
}

/**
 * Validation middleware for query parameters
 */
export function validate{{pascalName}}Query(req: Request, res: Response, next: NextFunction): void {
  const result = validateQueryData(req.query)
  
  if (!result.valid) {
    res.status(400).json({
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Invalid query parameters',
        details: result.errors
      }
    })
    return
  }
  
  next()
}

/**
 * Validate create data
 */
function validateCreateData(data: any): {{pascalName}}ValidationResult {
  const errors: {{pascalName}}ValidationError[] = []
  
  // Required fields
  if (!data.name) {
    errors.push({
      field: 'name',
      message: 'Name is required',
      value: data.name
    })
  } else if (typeof data.name !== 'string') {
    errors.push({
      field: 'name',
      message: 'Name must be a string',
      value: data.name
    })
  } else if (data.name.trim().length === 0) {
    errors.push({
      field: 'name',
      message: 'Name cannot be empty',
      value: data.name
    })
  } else if (data.name.length > 255) {
    errors.push({
      field: 'name',
      message: 'Name cannot exceed 255 characters',
      value: data.name
    })
  }
  
  // Optional fields
  if (data.description !== undefined) {
    if (typeof data.description !== 'string') {
      errors.push({
        field: 'description',
        message: 'Description must be a string',
        value: data.description
      })
    } else if (data.description.length > 1000) {
      errors.push({
        field: 'description',
        message: 'Description cannot exceed 1000 characters',
        value: data.description
      })
    }
  }
  
  if (data.status !== undefined) {
    const validStatuses = ['{{camelName}}_status_active', '{{camelName}}_status_inactive']
    if (!validStatuses.includes(data.status)) {
      errors.push({
        field: 'status',
        message: \`Status must be one of: \${validStatuses.join(', ')}\`,
        value: data.status
      })
    }
  }
  
  if (data.metadata !== undefined) {
    if (typeof data.metadata !== 'object' || Array.isArray(data.metadata)) {
      errors.push({
        field: 'metadata',
        message: 'Metadata must be an object',
        value: data.metadata
      })
    }
  }
  
  return {
    valid: errors.length === 0,
    errors
  }
}

/**
 * Validate update data
 */
function validateUpdateData(data: any): {{pascalName}}ValidationResult {
  const errors: {{pascalName}}ValidationError[] = []
  
  // Check if at least one field is provided
  const updateFields = ['name', 'description', 'status', 'metadata']
  const hasUpdateField = updateFields.some(field => data[field] !== undefined)
  
  if (!hasUpdateField) {
    errors.push({
      field: 'general',
      message: 'At least one field must be provided for update',
      value: data
    })
  }
  
  // Validate provided fields
  if (data.name !== undefined) {
    if (typeof data.name !== 'string') {
      errors.push({
        field: 'name',
        message: 'Name must be a string',
        value: data.name
      })
    } else if (data.name.trim().length === 0) {
      errors.push({
        field: 'name',
        message: 'Name cannot be empty',
        value: data.name
      })
    } else if (data.name.length > 255) {
      errors.push({
        field: 'name',
        message: 'Name cannot exceed 255 characters',
        value: data.name
      })
    }
  }
  
  if (data.description !== undefined) {
    if (typeof data.description !== 'string') {
      errors.push({
        field: 'description',
        message: 'Description must be a string',
        value: data.description
      })
    } else if (data.description.length > 1000) {
      errors.push({
        field: 'description',
        message: 'Description cannot exceed 1000 characters',
        value: data.description
      })
    }
  }
  
  if (data.status !== undefined) {
    const validStatuses = ['{{camelName}}_status_active', '{{camelName}}_status_inactive']
    if (!validStatuses.includes(data.status)) {
      errors.push({
        field: 'status',
        message: \`Status must be one of: \${validStatuses.join(', ')}\`,
        value: data.status
      })
    }
  }
  
  if (data.metadata !== undefined) {
    if (typeof data.metadata !== 'object' || Array.isArray(data.metadata)) {
      errors.push({
        field: 'metadata',
        message: 'Metadata must be an object',
        value: data.metadata
      })
    }
  }
  
  return {
    valid: errors.length === 0,
    errors
  }
}

/**
 * Validate query parameters
 */
function validateQueryData(query: any): {{pascalName}}ValidationResult {
  const errors: {{pascalName}}ValidationError[] = []
  
  // Validate pagination
  if (query.page !== undefined) {
    const page = parseInt(query.page as string)
    if (isNaN(page) || page < 1) {
      errors.push({
        field: 'page',
        message: 'Page must be a positive integer',
        value: query.page
      })
    }
  }
  
  if (query.limit !== undefined) {
    const limit = parseInt(query.limit as string)
    if (isNaN(limit) || limit < 1 || limit > 100) {
      errors.push({
        field: 'limit',
        message: 'Limit must be between 1 and 100',
        value: query.limit
      })
    }
  }
  
  // Validate sort
  if (query.sort !== undefined) {
    const validSortFields = ['name', 'status', 'createdAt', 'updatedAt']
    const sortParts = (query.sort as string).split(':')
    const field = sortParts[0]
    const order = sortParts[1] || 'asc'
    
    if (!validSortFields.includes(field)) {
      errors.push({
        field: 'sort',
        message: \`Sort field must be one of: \${validSortFields.join(', ')}\`,
        value: query.sort
      })
    }
    
    if (!['asc', 'desc'].includes(order)) {
      errors.push({
        field: 'sort',
        message: 'Sort order must be "asc" or "desc"',
        value: query.sort
      })
    }
  }
  
  // Validate search query
  if (query.q !== undefined) {
    if (typeof query.q !== 'string') {
      errors.push({
        field: 'q',
        message: 'Search query must be a string',
        value: query.q
      })
    } else if (query.q.length > 255) {
      errors.push({
        field: 'q',
        message: 'Search query cannot exceed 255 characters',
        value: query.q
      })
    }
  }
  
  // Validate search fields
  if (query.fields !== undefined) {
    const validFields = ['name', 'description', 'metadata']
    const fields = Array.isArray(query.fields) ? query.fields : [query.fields]
    
    for (const field of fields) {
      if (!validFields.includes(field)) {
        errors.push({
          field: 'fields',
          message: \`Search field must be one of: \${validFields.join(', ')}\`,
          value: field
        })
      }
    }
  }
  
  return {
    valid: errors.length === 0,
    errors
  }
}

/**
 * Sanitize input data
 */
export function sanitize{{pascalName}}Data(data: any): any {
  const sanitized = { ...data }
  
  // Trim string fields
  if (sanitized.name && typeof sanitized.name === 'string') {
    sanitized.name = sanitized.name.trim()
  }
  
  if (sanitized.description && typeof sanitized.description === 'string') {
    sanitized.description = sanitized.description.trim()
  }
  
  // Remove undefined values
  Object.keys(sanitized).forEach(key => {
    if (sanitized[key] === undefined) {
      delete sanitized[key]
    }
  })
  
  return sanitized
}

/**
 * Validate ID parameter
 */
export function validateId(id: string): {{pascalName}}ValidationResult {
  const errors: {{pascalName}}ValidationError[] = []
  
  if (!id) {
    errors.push({
      field: 'id',
      message: 'ID is required',
      value: id
    })
  } else if (typeof id !== 'string') {
    errors.push({
      field: 'id',
      message: 'ID must be a string',
      value: id
    })
  } else if (id.length === 0) {
    errors.push({
      field: 'id',
      message: 'ID cannot be empty',
      value: id
    })
  }
  
  return {
    valid: errors.length === 0,
    errors
  }
}

/**
 * Custom validation rules
 */
export const validationRules = {
  name: {
    required: true,
    type: 'string',
    minLength: 1,
    maxLength: 255,
    pattern: /^[a-zA-Z0-9\\s\\-_]+$/ // Alphanumeric, spaces, hyphens, underscores
  },
  description: {
    required: false,
    type: 'string',
    maxLength: 1000
  },
  status: {
    required: false,
    type: 'string',
    enum: ['{{camelName}}_status_active', '{{camelName}}_status_inactive']
  },
  metadata: {
    required: false,
    type: 'object'
  }
}

export default {
  validate{{pascalName}}Create,
  validate{{pascalName}}Update,
  validate{{pascalName}}Query,
  sanitize{{pascalName}}Data,
  validateId,
  validationRules
}`
}

function getRouteServiceTemplate(): string {
  return `import type {
  {{pascalName}},
  {{pascalName}}CreateRequest,
  {{pascalName}}UpdateRequest,
  {{pascalName}}ListOptions,
  {{pascalName}}ListResult,
  {{pascalName}}SearchOptions,
  {{pascalName}}SearchResult,
  {{pascalName}}BulkResult,
  {{pascalName}}Stats
} from './{{kebabName}}.types.js'

/**
 * {{name}} Service
 * 
 * Business logic layer for {{name}} operations
 */
export class {{pascalName}}Service {
  private items: Map<string, {{pascalName}}> = new Map()
  private nextId = 1

  constructor() {
    // Initialize with some sample data
    this.seedData()
  }

  /**
   * List {{name}}s with pagination and filtering
   */
  async list(options: {{pascalName}}ListOptions): Promise<{{pascalName}}ListResult> {
    const { page, limit, sort, filter } = options
    
    let items = Array.from(this.items.values())
    
    // Apply filters
    if (filter) {
      items = this.applyFilters(items, filter)
    }
    
    // Apply sorting
    if (sort) {
      items = this.applySorting(items, sort)
    }
    
    // Calculate pagination
    const total = items.length
    const startIndex = (page - 1) * limit
    const endIndex = startIndex + limit
    const paginatedItems = items.slice(startIndex, endIndex)
    
    return {
      items: paginatedItems,
      page,
      limit,
      total
    }
  }

  /**
   * Get {{name}} by ID
   */
  async getById(id: string): Promise<{{pascalName}} | null> {
    return this.items.get(id) || null
  }

  /**
   * Create new {{name}}
   */
  async create(data: {{pascalName}}CreateRequest): Promise<{{pascalName}}> {
    const id = this.generateId()
    const now = new Date().toISOString()
    
    const item: {{pascalName}} = {
      id,
      name: data.name,
      description: data.description,
      status: data.status || '{{camelName}}_status_active',
      createdAt: now,
      updatedAt: now,
      metadata: data.metadata || {}
    }
    
    this.items.set(id, item)
    
    // Emit event (if event system is available)
    this.emitEvent('created', { item })
    
    return item
  }

  /**
   * Update {{name}}
   */
  async update(id: string, data: {{pascalName}}UpdateRequest): Promise<{{pascalName}} | null> {
    const existingItem = this.items.get(id)
    
    if (!existingItem) {
      return null
    }
    
    const updatedItem: {{pascalName}} = {
      ...existingItem,
      ...data,
      id, // Ensure ID doesn't change
      updatedAt: new Date().toISOString()
    }
    
    this.items.set(id, updatedItem)
    
    // Emit event
    this.emitEvent('updated', { item: updatedItem, changes: data })
    
    return updatedItem
  }

  /**
   * Partial update {{name}}
   */
  async partialUpdate(id: string, data: Partial<{{pascalName}}UpdateRequest>): Promise<{{pascalName}} | null> {
    const existingItem = this.items.get(id)
    
    if (!existingItem) {
      return null
    }
    
    const updatedItem: {{pascalName}} = {
      ...existingItem,
      ...data,
      id, // Ensure ID doesn't change
      updatedAt: new Date().toISOString()
    }
    
    this.items.set(id, updatedItem)
    
    // Emit event
    this.emitEvent('updated', { item: updatedItem, changes: data })
    
    return updatedItem
  }

  /**
   * Delete {{name}}
   */
  async delete(id: string): Promise<boolean> {
    const deleted = this.items.delete(id)
    
    if (deleted) {
      // Emit event
      this.emitEvent('deleted', { id })
    }
    
    return deleted
  }

  /**
   * Search {{name}}s
   */
  async search(options: {{pascalName}}SearchOptions): Promise<{{pascalName}}SearchResult> {
    const { query, fields = ['name', 'description'], page, limit } = options
    
    let items = Array.from(this.items.values())
    
    // Apply search filter
    if (query) {
      items = items.filter(item => {
        return fields.some(field => {
          const value = item[field as keyof {{pascalName}}]
          if (typeof value === 'string') {
            return value.toLowerCase().includes(query.toLowerCase())
          }
          return false
        })
      })
    }
    
    // Calculate pagination
    const total = items.length
    const startIndex = (page - 1) * limit
    const endIndex = startIndex + limit
    const paginatedItems = items.slice(startIndex, endIndex)
    
    return {
      items: paginatedItems,
      page,
      limit,
      total
    }
  }

  /**
   * Bulk create {{name}}s
   */
  async bulkCreate(items: {{pascalName}}CreateRequest[]): Promise<{{pascalName}}BulkResult> {
    const result: {{pascalName}}BulkResult = {
      success: 0,
      failed: 0,
      errors: []
    }
    
    const createdItems: {{pascalName}}[] = []
    
    for (const itemData of items) {
      try {
        const item = await this.create(itemData)
        createdItems.push(item)
        result.success++
      } catch (error) {
        result.failed++
        result.errors.push({
          item: itemData,
          error: error instanceof Error ? error.message : 'Unknown error'
        })
      }
    }
    
    // Emit event
    this.emitEvent('bulk_created', { items: createdItems, result })
    
    return result
  }

  /**
   * Bulk update {{name}}s
   */
  async bulkUpdate(items: Array<{ id: string } & Partial<{{pascalName}}UpdateRequest>>): Promise<{{pascalName}}BulkResult> {
    const result: {{pascalName}}BulkResult = {
      success: 0,
      failed: 0,
      errors: []
    }
    
    for (const itemData of items) {
      try {
        const { id, ...updateData } = itemData
        const updated = await this.partialUpdate(id, updateData)
        
        if (updated) {
          result.success++
        } else {
          result.failed++
          result.errors.push({
            item: itemData,
            error: 'Item not found'
          })
        }
      } catch (error) {
        result.failed++
        result.errors.push({
          item: itemData,
          error: error instanceof Error ? error.message : 'Unknown error'
        })
      }
    }
    
    // Emit event
    this.emitEvent('bulk_updated', { items, result })
    
    return result
  }

  /**
   * Bulk delete {{name}}s
   */
  async bulkDelete(ids: string[]): Promise<{{pascalName}}BulkResult> {
    const result: {{pascalName}}BulkResult = {
      success: 0,
      failed: 0,
      errors: []
    }
    
    for (const id of ids) {
      try {
        const deleted = await this.delete(id)
        
        if (deleted) {
          result.success++
        } else {
          result.failed++
          result.errors.push({
            item: { id },
            error: 'Item not found'
          })
        }
      } catch (error) {
        result.failed++
        result.errors.push({
          item: { id },
          error: error instanceof Error ? error.message : 'Unknown error'
        })
      }
    }
    
    // Emit event
    this.emitEvent('bulk_deleted', { ids, result })
    
    return result
  }

  /**
   * Get statistics
   */
  async getStats(): Promise<{{pascalName}}Stats> {
    const items = Array.from(this.items.values())
    const now = new Date()
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    const thisWeek = new Date(today.getTime() - (7 * 24 * 60 * 60 * 1000))
    const thisMonth = new Date(now.getFullYear(), now.getMonth(), 1)
    
    const stats: {{pascalName}}Stats = {
      total: items.length,
      active: items.filter(item => item.status === '{{camelName}}_status_active').length,
      inactive: items.filter(item => item.status === '{{camelName}}_status_inactive').length,
      createdToday: items.filter(item => new Date(item.createdAt) >= today).length,
      createdThisWeek: items.filter(item => new Date(item.createdAt) >= thisWeek).length,
      createdThisMonth: items.filter(item => new Date(item.createdAt) >= thisMonth).length,
      averageCreationRate: 0,
      statusDistribution: {}
    }
    
    // Calculate status distribution
    items.forEach(item => {
      stats.statusDistribution[item.status] = (stats.statusDistribution[item.status] || 0) + 1
    })
    
    // Calculate average creation rate (items per day)
    if (items.length > 0) {
      const oldestItem = items.reduce((oldest, item) => 
        new Date(item.createdAt) < new Date(oldest.createdAt) ? item : oldest
      )
      const daysSinceOldest = Math.max(1, Math.floor((now.getTime() - new Date(oldestItem.createdAt).getTime()) / (24 * 60 * 60 * 1000)))
      stats.averageCreationRate = items.length / daysSinceOldest
    }
    
    return stats
  }

  /**
   * Apply filters to items
   */
  private applyFilters(items: {{pascalName}}[], filter: Record<string, any>): {{pascalName}}[] {
    return items.filter(item => {
      for (const [key, value] of Object.entries(filter)) {
        if (key === 'name' && value) {
          if (!item.name.toLowerCase().includes(value.toLowerCase())) {
            return false
          }
        } else if (key === 'status' && value) {
          if (item.status !== value) {
            return false
          }
        } else if (key === 'createdAt' && value) {
          const createdAt = new Date(item.createdAt)
          if (value.from && createdAt < new Date(value.from)) {
            return false
          }
          if (value.to && createdAt > new Date(value.to)) {
            return false
          }
        }
      }
      return true
    })
  }

  /**
   * Apply sorting to items
   */
  private applySorting(items: {{pascalName}}[], sort: string): {{pascalName}}[] {
    const [field, order = 'asc'] = sort.split(':')
    
    return items.sort((a, b) => {
      let aValue = a[field as keyof {{pascalName}}]
      let bValue = b[field as keyof {{pascalName}}]
      
      // Handle string comparison
      if (typeof aValue === 'string' && typeof bValue === 'string') {
        aValue = aValue.toLowerCase()
        bValue = bValue.toLowerCase()
      }
      
      let comparison = 0
      if (aValue < bValue) {
        comparison = -1
      } else if (aValue > bValue) {
        comparison = 1
      }
      
      return order === 'desc' ? -comparison : comparison
    })
  }

  /**
   * Generate unique ID
   */
  private generateId(): string {
    return \`{{kebabName}}_\${this.nextId++}_\${Date.now()}\`
  }

  /**
   * Emit event (placeholder for event system)
   */
  private emitEvent(event: string, data: any): void {
    // This is a placeholder for an event system
    // In a real application, you might use EventEmitter or a message queue
    console.log(\`{{name}} Event: \${event}\`, data)
  }

  /**
   * Seed initial data
   */
  private seedData(): void {
    const sampleItems: {{pascalName}}CreateRequest[] = [
      {
        name: 'Sample {{name}} 1',
        description: 'This is a sample {{name}} for demonstration',
        status: '{{camelName}}_status_active'
      },
      {
        name: 'Sample {{name}} 2',
        description: 'Another sample {{name}}',
        status: '{{camelName}}_status_inactive'
      }
    ]
    
    sampleItems.forEach(async (item) => {
      await this.create(item)
    })
  }
}

export default {{pascalName}}Service`
}

function getRouteTestTemplate(): string {
  return `import request from 'supertest'
import express from 'express'
import { {{pascalName}}Routes } from './{{kebabName}}.routes.js'
import type { {{pascalName}}, {{pascalName}}CreateRequest, {{pascalName}}UpdateRequest } from './{{kebabName}}.types.js'

describe('{{pascalName}} Routes', () => {
  let app: express.Application
  let routes: {{pascalName}}Routes

  beforeEach(() => {
    app = express()
    app.use(express.json())
    
    routes = new {{pascalName}}Routes()
    app.use('/{{kebabName}}', routes.getRouter())
    
    // Error handling middleware
    app.use((err: any, req: any, res: any, next: any) => {
      res.status(500).json({ error: err.message })
    })
  })

  describe('GET /{{kebabName}}', () => {
    test('should return list of {{name}}s', async () => {
      const response = await request(app)
        .get('/{{kebabName}}')
        .expect(200)

      expect(response.body.success).toBe(true)
      expect(response.body.data).toBeInstanceOf(Array)
      expect(response.body.pagination).toBeDefined()
      expect(response.body.pagination.page).toBe(1)
      expect(response.body.pagination.limit).toBe(10)
    })

    test('should support pagination', async () => {
      const response = await request(app)
        .get('/{{kebabName}}?page=2&limit=5')
        .expect(200)

      expect(response.body.pagination.page).toBe(2)
      expect(response.body.pagination.limit).toBe(5)
    })

    test('should support sorting', async () => {
      const response = await request(app)
        .get('/{{kebabName}}?sort=name:desc')
        .expect(200)

      expect(response.body.success).toBe(true)
    })

    test('should support filtering', async () => {
      const response = await request(app)
        .get('/{{kebabName}}?filter[status]={{camelName}}_status_active')
        .expect(200)

      expect(response.body.success).toBe(true)
    })
  })

  describe('GET /{{kebabName}}/:id', () => {
    test('should return {{name}} by ID', async () => {
      // First create a {{name}}
      const createData: {{pascalName}}CreateRequest = {
        name: 'Test {{name}}',
        description: 'Test description'
      }

      const createResponse = await request(app)
        .post('/{{kebabName}}')
        .send(createData)
        .expect(201)

      const createdId = createResponse.body.data.id

      // Then get it by ID
      const response = await request(app)
        .get(\`/{{kebabName}}/\${createdId}\`)
        .expect(200)

      expect(response.body.success).toBe(true)
      expect(response.body.data.id).toBe(createdId)
      expect(response.body.data.name).toBe(createData.name)
    })

    test('should return 404 for non-existent {{name}}', async () => {
      const response = await request(app)
        .get('/{{kebabName}}/non-existent-id')
        .expect(404)

      expect(response.body.success).toBe(false)
      expect(response.body.error.code).toBe('NOT_FOUND')
    })
  })

  describe('POST /{{kebabName}}', () => {
    test('should create new {{name}}', async () => {
      const createData: {{pascalName}}CreateRequest = {
        name: 'New {{name}}',
        description: 'New description',
        status: '{{camelName}}_status_active'
      }

      const response = await request(app)
        .post('/{{kebabName}}')
        .send(createData)
        .expect(201)

      expect(response.body.success).toBe(true)
      expect(response.body.data.name).toBe(createData.name)
      expect(response.body.data.description).toBe(createData.description)
      expect(response.body.data.status).toBe(createData.status)
      expect(response.body.data.id).toBeDefined()
      expect(response.body.data.createdAt).toBeDefined()
      expect(response.body.data.updatedAt).toBeDefined()
    })

    test('should validate required fields', async () => {
      const invalidData = {
        description: 'Missing name'
      }

      const response = await request(app)
        .post('/{{kebabName}}')
        .send(invalidData)
        .expect(400)

      expect(response.body.success).toBe(false)
      expect(response.body.error.code).toBe('VALIDATION_ERROR')
    })

    test('should validate field types', async () => {
      const invalidData = {
        name: 123, // Should be string
        status: 'invalid_status'
      }

      const response = await request(app)
        .post('/{{kebabName}}')
        .send(invalidData)
        .expect(400)

      expect(response.body.success).toBe(false)
      expect(response.body.error.code).toBe('VALIDATION_ERROR')
    })
  })

  describe('PUT /{{kebabName}}/:id', () => {
    test('should update existing {{name}}', async () => {
      // First create a {{name}}
      const createData: {{pascalName}}CreateRequest = {
        name: 'Original {{name}}',
        description: 'Original description'
      }

      const createResponse = await request(app)
        .post('/{{kebabName}}')
        .send(createData)
        .expect(201)

      const createdId = createResponse.body.data.id

      // Then update it
      const updateData: {{pascalName}}UpdateRequest = {
        name: 'Updated {{name}}',
        description: 'Updated description',
        status: '{{camelName}}_status_inactive'
      }

      const response = await request(app)
        .put(\`/{{kebabName}}/\${createdId}\`)
        .send(updateData)
        .expect(200)

      expect(response.body.success).toBe(true)
      expect(response.body.data.name).toBe(updateData.name)
      expect(response.body.data.description).toBe(updateData.description)
      expect(response.body.data.status).toBe(updateData.status)
    })

    test('should return 404 for non-existent {{name}}', async () => {
      const updateData: {{pascalName}}UpdateRequest = {
        name: 'Updated {{name}}'
      }

      const response = await request(app)
        .put('/{{kebabName}}/non-existent-id')
        .send(updateData)
        .expect(404)

      expect(response.body.success).toBe(false)
      expect(response.body.error.code).toBe('NOT_FOUND')
    })
  })

  describe('PATCH /{{kebabName}}/:id', () => {
    test('should partially update existing {{name}}', async () => {
      // First create a {{name}}
      const createData: {{pascalName}}CreateRequest = {
        name: 'Original {{name}}',
        description: 'Original description'
      }

      const createResponse = await request(app)
        .post('/{{kebabName}}')
        .send(createData)
        .expect(201)

      const createdId = createResponse.body.data.id

      // Then partially update it
      const updateData = {
        name: 'Partially Updated {{name}}'
      }

      const response = await request(app)
        .patch(\`/{{kebabName}}/\${createdId}\`)
        .send(updateData)
        .expect(200)

      expect(response.body.success).toBe(true)
      expect(response.body.data.name).toBe(updateData.name)
      expect(response.body.data.description).toBe(createData.description) // Should remain unchanged
    })
  })

  describe('DELETE /{{kebabName}}/:id', () => {
    test('should delete existing {{name}}', async () => {
      // First create a {{name}}
      const createData: {{pascalName}}CreateRequest = {
        name: 'To Delete {{name}}',
        description: 'Will be deleted'
      }

      const createResponse = await request(app)
        .post('/{{kebabName}}')
        .send(createData)
        .expect(201)

      const createdId = createResponse.body.data.id

      // Then delete it
      await request(app)
        .delete(\`/{{kebabName}}/\${createdId}\`)
        .expect(204)

      // Verify it's deleted
      await request(app)
        .get(\`/{{kebabName}}/\${createdId}\`)
        .expect(404)
    })

    test('should return 404 for non-existent {{name}}', async () => {
      const response = await request(app)
        .delete('/{{kebabName}}/non-existent-id')
        .expect(404)

      expect(response.body.success).toBe(false)
      expect(response.body.error.code).toBe('NOT_FOUND')
    })
  })

  describe('GET /{{kebabName}}/search', () => {
    test('should search {{name}}s', async () => {
      const response = await request(app)
        .get('/{{kebabName}}/search?q=sample')
        .expect(200)

      expect(response.body.success).toBe(true)
      expect(response.body.data).toBeInstanceOf(Array)
      expect(response.body.pagination).toBeDefined()
    })

    test('should support field-specific search', async () => {
      const response = await request(app)
        .get('/{{kebabName}}/search?q=sample&fields=name,description')
        .expect(200)

      expect(response.body.success).toBe(true)
    })

    test('should validate search parameters', async () => {
      const response = await request(app)
        .get('/{{kebabName}}/search?fields=invalid_field')
        .expect(400)

      expect(response.body.success).toBe(false)
      expect(response.body.error.code).toBe('VALIDATION_ERROR')
    })
  })

  describe('POST /{{kebabName}}/bulk', () => {
    test('should perform bulk create', async () => {
      const bulkData = {
        operation: 'create',
        items: [
          { name: 'Bulk {{name}} 1', description: 'First bulk item' },
          { name: 'Bulk {{name}} 2', description: 'Second bulk item' }
        ]
      }

      const response = await request(app)
        .post('/{{kebabName}}/bulk')
        .send(bulkData)
        .expect(200)

      expect(response.body.success).toBe(true)
      expect(response.body.data.success).toBe(2)
      expect(response.body.data.failed).toBe(0)
    })

    test('should perform bulk update', async () => {
      // First create some items
      const item1 = await request(app)
        .post('/{{kebabName}}')
        .send({ name: 'Item 1' })

      const item2 = await request(app)
        .post('/{{kebabName}}')
        .send({ name: 'Item 2' })

      const bulkData = {
        operation: 'update',
        items: [
          { id: item1.body.data.id, name: 'Updated Item 1' },
          { id: item2.body.data.id, name: 'Updated Item 2' }
        ]
      }

      const response = await request(app)
        .post('/{{kebabName}}/bulk')
        .send(bulkData)
        .expect(200)

      expect(response.body.success).toBe(true)
      expect(response.body.data.success).toBe(2)
    })

    test('should perform bulk delete', async () => {
      // First create some items
      const item1 = await request(app)
        .post('/{{kebabName}}')
        .send({ name: 'Item 1' })

      const item2 = await request(app)
        .post('/{{kebabName}}')
        .send({ name: 'Item 2' })

      const bulkData = {
        operation: 'delete',
        items: [item1.body.data.id, item2.body.data.id]
      }

      const response = await request(app)
        .post('/{{kebabName}}/bulk')
        .send(bulkData)
        .expect(200)

      expect(response.body.success).toBe(true)
      expect(response.body.data.success).toBe(2)
    })

    test('should reject invalid bulk operation', async () => {
      const bulkData = {
        operation: 'invalid',
        items: []
      }

      const response = await request(app)
        .post('/{{kebabName}}/bulk')
        .send(bulkData)
        .expect(400)

      expect(response.body.success).toBe(false)
      expect(response.body.error.code).toBe('INVALID_OPERATION')
    })
  })

  describe('GET /{{kebabName}}/stats', () => {
    test('should return statistics', async () => {
      const response = await request(app)
        .get('/{{kebabName}}/stats')
        .expect(200)

      expect(response.body.success).toBe(true)
      expect(response.body.data).toHaveProperty('total')
      expect(response.body.data).toHaveProperty('active')
      expect(response.body.data).toHaveProperty('inactive')
      expect(response.body.data).toHaveProperty('statusDistribution')
    })
  })

  describe('Error Handling', () => {
    test('should handle service errors gracefully', async () => {
      // Mock service to throw error
      const originalService = routes['service']
      routes['service'] = {
        ...originalService,
        list: jest.fn().mockRejectedValue(new Error('Service error'))
      } as any

      const response = await request(app)
        .get('/{{kebabName}}')
        .expect(500)

      // Restore original service
      routes['service'] = originalService
    })
  })
})`
}

function getRouteDocsTemplate(): string {
  return `# {{name}} Routes

RESTful API routes for managing {{name}}s.

## Base URL

All {{name}} routes are prefixed with \`/{{kebabName}}\`.

## Endpoints

### List {{name}}s

\`\`\`
GET /{{kebabName}}
\`\`\`

Retrieve a paginated list of {{name}}s with optional filtering and sorting.

**Query Parameters:**
- \`page\` (number, optional): Page number (default: 1)
- \`limit\` (number, optional): Items per page (default: 10, max: 100)
- \`sort\` (string, optional): Sort field and order (e.g., "name:asc", "createdAt:desc")
- \`filter[field]\` (string, optional): Filter by field value

**Response:**
\`\`\`json
{
  "success": true,
  "data": [
    {
      "id": "string",
      "name": "string",
      "description": "string",
      "status": "{{camelName}}_status_active",
      "createdAt": "2023-01-01T00:00:00.000Z",
      "updatedAt": "2023-01-01T00:00:00.000Z",
      "metadata": {}
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 100,
    "pages": 10
  }
}
\`\`\`

### Get {{name}} by ID

\`\`\`
GET /{{kebabName}}/:id
\`\`\`

Retrieve a specific {{name}} by its ID.

**Parameters:**
- \`id\` (string): {{name}} ID

**Response:**
\`\`\`json
{
  "success": true,
  "data": {
    "id": "string",
    "name": "string",
    "description": "string",
    "status": "{{camelName}}_status_active",
    "createdAt": "2023-01-01T00:00:00.000Z",
    "updatedAt": "2023-01-01T00:00:00.000Z",
    "metadata": {}
  }
}
\`\`\`

### Create {{name}}

\`\`\`
POST /{{kebabName}}
\`\`\`

Create a new {{name}}.

**Request Body:**
\`\`\`json
{
  "name": "string",
  "description": "string",
  "status": "{{camelName}}_status_active",
  "metadata": {}
}
\`\`\`

**Response:**
\`\`\`json
{
  "success": true,
  "data": {
    "id": "string",
    "name": "string",
    "description": "string",
    "status": "{{camelName}}_status_active",
    "createdAt": "2023-01-01T00:00:00.000Z",
    "updatedAt": "2023-01-01T00:00:00.000Z",
    "metadata": {}
  }
}
\`\`\`

### Update {{name}}

\`\`\`
PUT /{{kebabName}}/:id
\`\`\`

Update an existing {{name}} (full update).

**Parameters:**
- \`id\` (string): {{name}} ID

**Request Body:**
\`\`\`json
{
  "name": "string",
  "description": "string",
  "status": "{{camelName}}_status_active",
  "metadata": {}
}
\`\`\`

### Partial Update {{name}}

\`\`\`
PATCH /{{kebabName}}/:id
\`\`\`

Partially update an existing {{name}}.

**Parameters:**
- \`id\` (string): {{name}} ID

**Request Body:**
\`\`\`json
{
  "name": "string"
}
\`\`\`

### Delete {{name}}

\`\`\`
DELETE /{{kebabName}}/:id
\`\`\`

Delete a {{name}} by ID.

**Parameters:**
- \`id\` (string): {{name}} ID

**Response:**
\`\`\`
204 No Content
\`\`\`

### Search {{name}}s

\`\`\`
GET /{{kebabName}}/search
\`\`\`

Search {{name}}s by query string.

**Query Parameters:**
- \`q\` (string): Search query
- \`fields\` (array, optional): Fields to search in (default: ["name", "description"])
- \`page\` (number, optional): Page number (default: 1)
- \`limit\` (number, optional): Items per page (default: 10)

### Bulk Operations

\`\`\`
POST /{{kebabName}}/bulk
\`\`\`

Perform bulk operations on {{name}}s.

**Request Body:**
\`\`\`json
{
  "operation": "create|update|delete",
  "items": []
}
\`\`\`

### Get Statistics

\`\`\`
GET /{{kebabName}}/stats
\`\`\`

Get {{name}} statistics.

**Response:**
\`\`\`json
{
  "success": true,
  "data": {
    "total": 100,
    "active": 80,
    "inactive": 20,
    "createdToday": 5,
    "createdThisWeek": 25,
    "createdThisMonth": 100,
    "averageCreationRate": 3.2,
    "statusDistribution": {
      "{{camelName}}_status_active": 80,
      "{{camelName}}_status_inactive": 20
    }
  }
}
\`\`\`

## Error Responses

All endpoints may return error responses in the following format:

\`\`\`json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "Human readable error message",
    "details": {}
  }
}
\`\`\`

### Common Error Codes

- \`VALIDATION_ERROR\`: Request validation failed
- \`NOT_FOUND\`: Resource not found
- \`INVALID_OPERATION\`: Invalid operation requested
- \`INTERNAL_ERROR\`: Internal server error

## Usage Examples

### Create a new {{name}}

\`\`\`bash
curl -X POST http://localhost:3000/{{kebabName}} \\
  -H "Content-Type: application/json" \\
  -d '{
    "name": "My {{name}}",
    "description": "A sample {{name}}",
    "status": "{{camelName}}_status_active"
  }'
\`\`\`

### List {{name}}s with filtering

\`\`\`bash
curl "http://localhost:3000/{{kebabName}}?page=1&limit=5&sort=name:asc&filter[status]={{camelName}}_status_active"
\`\`\`

### Search {{name}}s

\`\`\`bash
curl "http://localhost:3000/{{kebabName}}/search?q=sample&fields=name,description"
\`\`\`

### Bulk create {{name}}s

\`\`\`bash
curl -X POST http://localhost:3000/{{kebabName}}/bulk \\
  -H "Content-Type: application/json" \\
  -d '{
    "operation": "create",
    "items": [
      {"name": "{{name}} 1", "description": "First {{name}}"},
      {"name": "{{name}} 2", "description": "Second {{name}}"}
    ]
  }'
\`\`\`

## Integration

To integrate these routes into your Express application:

\`\`\`typescript
import express from 'express'
import { create{{pascalName}}Routes } from './{{kebabName}}.routes.js'

const app = express()
app.use(express.json())

// Register {{name}} routes
app.use('/{{kebabName}}', create{{pascalName}}Routes())

app.listen(3000, () => {
  console.log('Server running on port 3000')
})
\`\`\`

## Validation

All routes include comprehensive validation:

- **Required fields**: Validated for presence and type
- **Field lengths**: String fields have minimum and maximum length constraints
- **Enum values**: Status fields are validated against allowed values
- **Data types**: All fields are type-checked
- **Query parameters**: Pagination and search parameters are validated

## Testing

The routes include comprehensive test coverage. Run tests with:

\`\`\`bash
npm test
\`\`\`

## Security Considerations

- Input validation prevents injection attacks
- All user input is sanitized
- Error messages don't expose sensitive information
- Rate limiting should be implemented at the application level
- Authentication and authorization should be added as middleware

## Performance

- Pagination prevents large data transfers
- Filtering and sorting are optimized
- Bulk operations reduce API calls
- Caching can be implemented at the service layer

## Monitoring

Consider implementing:

- Request/response logging
- Performance metrics
- Error tracking
- Health checks
- API usage analytics
`
}
