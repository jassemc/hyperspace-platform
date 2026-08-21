import { defineConfig } from '@hscowork/service-generator'

const user = process.env.HS_SWAGGER_USER
const pass = process.env.HS_SWAGGER_PASSWORD
const headers = user && pass ? { Authorization: `Basic ${Buffer.from(`${user}:${pass}`).toString('base64')}` } : undefined

export default defineConfig({
  input: { url: process.env.HS_SWAGGER_URL ?? 'http://localhost:3000/_docs/json', headers },
  saveSpecTo: './swagger.json',
  output: './lib/service',
  serviceName: 'HsService',
})
