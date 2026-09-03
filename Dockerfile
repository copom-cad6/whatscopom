# Dockerfile para implantação em VPS
FROM node:20-alpine AS builder

WORKDIR /app

# Copia manifestos de dependências
COPY package*.json ./

# Instala todas as dependências
RUN npm install

# Copia código fonte
COPY . .

# Compila aplicação (Vite + esbuild server.ts)
RUN npm run build

# Imagem de produção otimizada
FROM node:20-alpine AS runner

WORKDIR /app
ENV NODE_ENV=production
ENV PORT=3000

COPY package*.json ./
RUN npm install --only=production

COPY --from=builder /app/dist ./dist

EXPOSE 3000

CMD ["npm", "start"]
