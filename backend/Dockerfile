# ============================================
# Stage 1: Build
# ============================================
FROM node:20-alpine AS build

WORKDIR /app

# Copy package files first (tận dụng Docker cache)
COPY package*.json ./

# Cài tất cả dependencies (bao gồm devDependencies để build)
RUN npm ci

# Copy toàn bộ source code
COPY . .

# Build TypeScript -> JavaScript
RUN npm run build

# ============================================
# Stage 2: Production
# ============================================
FROM node:20-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./

# Chỉ cài production dependencies
RUN npm ci --omit=dev

# Copy code đã build từ stage 1
COPY --from=build /app/dist ./dist

# Port mà NestJS lắng nghe
EXPOSE 3001

# Khởi chạy app
CMD ["node", "dist/main"]
