# Build stage
FROM node:20-alpine AS builder
WORKDIR /app

# Keep the package manager aligned with the pnpm v10 lockfile and workspace settings.
RUN npm install -g pnpm@10.28.0

# Copy pnpm workspace build approvals before installing dependencies.
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
RUN pnpm install --frozen-lockfile

# Copy source
COPY . .

# Build the app
RUN pnpm run build

# ----------------------------------------------------------
# Production stage
# ----------------------------------------------------------
FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production

# Copy build output and dependencies
COPY --from=builder /app/build ./build
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json

# Create uploads directory for dev (R2 used in production)
RUN mkdir -p ./build/static/uploads/prescriptions

EXPOSE 3000

CMD ["node", "build"]
