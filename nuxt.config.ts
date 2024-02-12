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
    preset: 'cloudflare_pages',
    experimental: {
      wasm: true
    }
  },
  modules: [
    '@nuxtjs/eslint-module',
    '@nuxtjs/stylelint-module',
    '@hebilicious/authjs-nuxt'
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
  },
  hooks: {
    'nitro:init': {
      async (nitro) {
        const wasmPaths = [
          '@jsquash/jpeg/codec/dec/mozjpeg_dec.wasm',
          '@jsquash/webp/codec/enc/webp_enc_simd.wasm',
          '@jsquash/resize/lib/resize/squoosh_resize_bg.wasm'
        ]
        nitro.hooks.hook('compiled', async (_nitro) => {
          const target = resolveNitroPreset(_nitro.options)
          const compatibility = getNitroPresetCompatibility(target)
          if (compatibility.wasm?.esmImport !== true) { return }
          const configuredEntry = nitro.options.rollupConfig?.output.entryFileNames
          let serverEntry = resolve(_nitro.options.output.serverDir, typeof configuredEntry === 'string'
            ? configuredEntry
            : 'index.mjs')
          if (target === 'cloudflare-pages')
          // this is especially hacky
          { serverEntry = resolve(dirname(serverEntry), './chunks/wasm.mjs') }
          const contents = (await readFile(serverEntry, 'utf-8'))
          wasmPaths.forEach(async (wasmPath) => {
            const hash = sha1(await readFile(await resolvePath(wasmPath)))
            const postfix = target === 'vercel-edge' ? '?module' : ''
            const path = target === 'cloudflare-pages' ? '../wasm/' : './wasm/'
            await writeFile(serverEntry, contents
              .replaceAll(`"${wasmPath}"`, `"${path}-${hash}.wasm${postfix}"`), { encoding: 'utf-8' })
          })
        })
      }
    }
  }
})
