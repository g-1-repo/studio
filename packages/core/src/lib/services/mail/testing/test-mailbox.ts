export interface TestEmail {
  to: string
  subject: string
  html: string
  headers?: Record<string, string>
}

declare global {
  // eslint-disable-next-line ts/no-namespace
  namespace globalThis {
    // test-only global mailbox
    let __TEST_EMAIL_OUTBOX__: TestEmail[] | undefined
  }
}

function ensureBox() {
  const g = globalThis as any
  if (!g.__TEST_EMAIL_OUTBOX__)
    g.__TEST_EMAIL_OUTBOX__ = []
  return g.__TEST_EMAIL_OUTBOX__ as TestEmail[]
}

export function recordEmail(email: TestEmail) {
  const box = ensureBox()
  box.push(email)
}

export function getEmails(): TestEmail[] {
  const box = ensureBox()
  return [...box]
}

export function clearEmails() {
  const box = ensureBox()
  box.length = 0
}
