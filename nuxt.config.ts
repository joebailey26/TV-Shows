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
        { rel: 'mask-icon', href: '/safari-pinned-tab.svg', color: '#333333' },
        { rel: 'stylesheet', href: '/global.css' }
      ]
    }
  },
  nitro: {
    preset: 'cloudflare_pages',
    dev: false
  },
  modules: [
    '@hebilicious/authjs-nuxt'
  ],
  runtimeConfig: {
    authJs: {
      secret: 'I0egCCYef4BTs/vhcYTi9QFiKFGhHFi/9/2DeHREvYY='
    },
    github: {
      clientId: '8550c7339a6f1e230b35',
      clientSecret: '93a79da88664172212adfa22db0e9b08bb003e29'
    },
    public: {
      authJs: {
        baseUrl: 'http://localhost:8788', // 'https://tv.joebailey.xyz', // The URL of your deployed app (used for origin Check in production)
        guestRedirectTo: '/login', // where to redirect if the user is not authenticated
        authenticatedRedirectTo: '/', // where to redirect if the user is authenticated
        verifyClientOnEveryRequest: true // whether to hit the /auth/session endpoint on every client request
      }
    }
  }
})
