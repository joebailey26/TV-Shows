export default defineEventHandler((event) => {
  if (!event.context.cloudflare) {
    throw createError({
      statusCode: 500,
      statusMessage: 'Cloudflare not available in this environment.'
    })
  }
})
