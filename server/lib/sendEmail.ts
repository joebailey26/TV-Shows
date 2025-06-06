export async function sendEmail(to: string, subject: string, textBody: string, htmlBody: string): Promise<void> {
  const formData = new FormData()
  formData.append('to', to)
  formData.append('from', 'noreply@tv.joebailey.xyz')
  formData.append('subject', subject)
  formData.append('text', textBody)
  formData.append('html', htmlBody)

  const response = await fetch(`${globalThis.__env__.NUXT_MAILGUN_ENDPOINT}/messages`, {
    method: 'POST',
    body: formData,
    headers: {
      Authorization: `Basic ${Buffer.from(`api:${globalThis.__env__.NUXT_MAILGUN_SENDING_KEY}`).toString('base64')}`
    }
  })

  if (!response.ok) {
    throw new Error(`Mailgun error: ${response.statusText}`)
  }
}
