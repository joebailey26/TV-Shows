import type { RuntimeConfig } from 'nuxt/schema'
// eslint-disable-next-line
import { NuxtAuthHandler } from '#auth'
import { useAuthOptions } from '../../lib/auth'

export default NuxtAuthHandler(useAuthOptions, useRuntimeConfig() as RuntimeConfig)
