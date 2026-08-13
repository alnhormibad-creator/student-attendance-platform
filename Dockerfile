FROM node:20-alpine

# Install OpenSSL (required by Prisma on Alpine)
RUN apk add --no-cache openssl

WORKDIR /app

COPY package*.json ./
COPY tsconfig.json ./

# Copy backend code and prisma schema
COPY backend ./backend
COPY prisma ./prisma

# Install all dependencies
RUN npm ci

# Generate Prisma client and compile TypeScript
RUN npm run prisma:generate && npm run build

# Expose port
EXPOSE 4000

# Start production server
CMD ["npm", "run", "start"]
