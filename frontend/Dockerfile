# =============================================================================
# Stage 1: Build the React/Vite app
# =============================================================================
FROM node:20-alpine AS builder

WORKDIR /app

# Install dependencies first (layer-cached unless package.json changes)
COPY package*.json ./
RUN npm ci

# Copy source and build
# VITE_API_BASE_URL must be passed as a build arg because Vite bakes env vars
# into the static bundle at build time — it cannot be injected at runtime.
COPY . .
ARG VITE_API_BASE_URL
ENV VITE_API_BASE_URL=$VITE_API_BASE_URL
RUN npm run build

# =============================================================================
# Stage 2: Serve the built assets with Nginx
# =============================================================================
FROM nginx:1.27-alpine

# Remove the default Nginx config and replace with ours
RUN rm /etc/nginx/conf.d/default.conf
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copy the Vite build output
COPY --from=builder /app/dist /usr/share/nginx/html

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
