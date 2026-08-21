# Stage 1: Build
FROM node:22.15-alpine AS builder

# TODO: tmp solution, we need to change this environment variable to a more secure way
ARG SUPABASE_URL
ENV NEXT_PUBLIC_SUPABASE_URL=${SUPABASE_URL}

ARG SUPABASE_PUBLISHABLE_OR_ANON_KEY
ENV NEXT_PUBLIC_SUPABASE_PUBLISHABLE_OR_ANON_KEY=${SUPABASE_PUBLISHABLE_OR_ANON_KEY}

WORKDIR /usr/src/app

# Install dependencies
COPY package*.json ./

# Install dependencies (including dev dependencies for build)
# The .npmrc committed to the repo references ${NPM_GITHUB_TOKEN} but that
# variable isn't set here; the actual token is supplied out-of-band via a
# BuildKit secret mount so it never lands in an image layer or build arg.
RUN --mount=type=secret,id=npmrc,target=/usr/src/app/.npmrc npm ci

# Copy the rest of the application code
COPY . .

# Build the application with production settings
RUN npm run build

# Stage 2: Production
FROM node:22.15-alpine

ENV HOSTNAME=0.0.0.0
ENV PORT 3000
ENV NODE_ENV production
ENV NEXT_TELEMETRY_DISABLED 1

WORKDIR /usr/src/app

# Don't run production as root
RUN addgroup --system --gid 1001 nodejs \
    && adduser --system --uid 1001 nextjs
USER nextjs

COPY --from=builder /usr/src/app/next.config.ts .
COPY --from=builder /usr/src/app/package.json .

# Automatically leverage output traces to reduce image size
# https://nextjs.org/docs/advanced-features/output-file-tracing
COPY --from=builder --chown=nextjs:nodejs /usr/src/app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /usr/src/app/.next/static ./.next/static
COPY --from=builder --chown=nextjs:nodejs /usr/src/app/public ./public

# Expose the application port
EXPOSE 3000

# Start the application
CMD ["node", "server.js"]