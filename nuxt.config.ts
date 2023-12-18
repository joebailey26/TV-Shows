export default defineNuxtConfig({
  app: {
    head: {
      htmlAttrs: {
        lang: 'en-GB'
      },
      title: 'TV Shows',
      meta: [
        { charset: 'utf-8' },
        { name: 'viewport', content: 'width=device-width, initial-scale=1' },
        { name: 'msapplication-TileColor', content: '#333333' },
        { name: 'theme-color', content: '#ffffff' }
      ],
      link: [
        { rel: 'apple-touch-icon', sizes: '180x180', href: '/apple-touch-icon.png' },
        { rel: 'icon', type: 'image/png', sizes: '32x32', href: '/favicon-32x32.png' },
        { rel: 'icon', type: 'image/png', sizes: '16x16', href: '/favicon-16x16.png' },
        { rel: 'manifest', href: '/site.webmanifest' },
        { rel: 'mask-icon', href: '/safari-pinned-tab.svg', color: '#333333' }
      ]
    }
  },
  css: [
    '~/assets/scss/global.scss'
  ],
  nitro: {
    preset: 'cloudflare_pages'
    // dev: false // We need this so the worker builds properly when running locally
  },
  modules: [
    '@hebilicious/authjs-nuxt',
    '@pinia/nuxt'
  ],
  runtimeConfig: {
    authJs: {
      secret: process.env.NUXT_NEXTAUTH_SECRET // You can generate one with `openssl rand -base64 32`
    },
    google: {
      clientId: process.env.NUXT_GOOGLE_CLIENT_ID,
      clientSecret: process.env.NUXT_GOOGLE_CLIENT_SECRET
    },
    github: {
      clientId: process.env.NUXT_GITHUB_CLIENT_ID,
      clientSecret: process.env.NUXT_GITHUB_CLIENT_SECRET
    },
    mailgun: {
      endpoint: process.env.NUXT_MAILGUN_ENDPOINT,
      sendingKey: process.env.NUXT_MAILGUN_SENDING_KEY
    },
    public: {
      authJs: {
        baseUrl: process.env.NUXT_NEXTAUTH_URL, // The URL of your deployed app (used for origin Check in production)
        guestRedirectTo: '/', // where to redirect if the user is not authenticated
        authenticatedRedirectTo: '/my-shows', // where to redirect if the user is authenticated
        verifyClientOnEveryRequest: false // whether to hit the /auth/session endpoint on every client request
      }
    }
  }
})
