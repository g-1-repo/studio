import { BaseService } from '@g-1/core'
import type { Environment } from '../../../../env'
import type { MailService } from '../../../../services/mail'
import { createMailService, TEMPLATE_NAMES } from '../../../../services/mail'

import { EarlyAccessRequestsRepository } from '../early-access-requests.repository'

export class EarlyAccessRequestsService extends BaseService {
  constructor(
    private mailService: MailService | undefined = undefined,
    private earlyAccessRequestsRepository = new EarlyAccessRequestsRepository()
  ) {
    super(earlyAccessRequestsRepository)
  }

  async requestEarlyAccess(
    email: string,
    env: Environment
  ): Promise<{ success: boolean; message: string }> {
    // Validate and normalize email using BaseService methods
    const validation = this.validateAndNormalizeEmail({ email })
    if (!validation.success) {
      this.handleValidationError(validation)
    }

    if (!validation.data) {
      throw new Error('Validation data is missing')
    }

    const normalizedEmail = validation.data.email

    // Check if email already exists
    const existingEmail = await this.earlyAccessRequestsRepository.findOneByEmail(
      normalizedEmail,
      env
    )
    this.ensureNotExists(
      existingEmail,
      `An early access request has already been made with ${email}`,
      { email: normalizedEmail }
    )

    // Create the early access request
    const insertedEarlyAccessRequest = await this.earlyAccessRequestsRepository.create(
      { email: normalizedEmail },
      env
    )

    // Send welcome email
    await this.sendEarlyAccessEmail(insertedEarlyAccessRequest.email, env)

    return insertedEarlyAccessRequest
  }

  /**
   * Send early access welcome email with proper error handling
   */
  private async sendEarlyAccessEmail(email: string, env: Environment): Promise<void> {
    try {
      // In tests, use mock service
      const isTestMode = env.NODE_ENV === 'test' || env.TEST_MODE === 'true'

      let mailService: MailService

      if (isTestMode) {
        mailService = createMailService({ provider: { type: 'mock' } })
      } else if (env.RESEND_API_KEY) {
        mailService =
          this.mailService ||
          createMailService({
            provider: { type: 'resend', apiKey: env.RESEND_API_KEY },
          })
        // Cache the service instance
        if (!this.mailService) {
          this.mailService = mailService
        }
      } else {
        // No email service configured - log warning but don't fail
        console.warn('No email service configured for early access request')
        return
      }

      await mailService.send({
        to: email,
        template: TEMPLATE_NAMES.EARLY_ACCESS,
      })
    } catch (error) {
      // Don't fail the entire request if email fails
      console.error('Failed to send early access email:', error)
      // In production, you might want to queue this for retry
      // throw new ExternalServiceError('email', 'Failed to send welcome email', { email })
    }
  }
}
