FROM node:20-slim AS frontend-build

WORKDIR /app/frontend
COPY frontend/package*.json ./
RUN npm ci
COPY frontend/ ./
RUN npm run build

FROM python:3.11-slim

WORKDIR /app

# Install Python dependencies
COPY backend/requirements.txt ./
RUN pip install --no-cache-dir -r requirements.txt

# Install Node.js for Next.js production server
RUN apt-get update && apt-get install -y curl && \
    curl -fsSL https://deb.nodesource.com/setup_20.x | bash - && \
    apt-get install -y nodejs && \
    apt-get clean && rm -rf /var/lib/apt/lists/*

# Copy backend
COPY backend/ ./backend/

# Copy built frontend
COPY --from=frontend-build /app/frontend/.next ./frontend/.next
COPY --from=frontend-build /app/frontend/public ./frontend/public
COPY --from=frontend-build /app/frontend/package*.json ./frontend/
COPY --from=frontend-build /app/frontend/next.config.ts ./frontend/
COPY --from=frontend-build /app/frontend/node_modules ./frontend/node_modules

# Create data and upload dirs
RUN mkdir -p data backend/uploads

# Copy startup script
COPY scripts/start-prod.sh ./start.sh
RUN chmod +x start.sh

EXPOSE 3000

CMD ["./start.sh"]
