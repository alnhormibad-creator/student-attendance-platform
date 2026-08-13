FROM node:20-alpine

# Install OpenSSL (required by Prisma on Alpine)
RUN apk add --no-cache openssl

WORKDIR /app

COPY package*.json ./
COPY tsconfig.json ./

# Copy backend code and prisma schema
COPY backend ./backend
COPY prisma ./prisma

# Install all dependencies (including devDependencies for ts-node)
RUN npm ci --include=dev

# Expose port
EXPOSE 8080

# Start production server with ts-node
CMD ["npm", "run", "start:prod"]
