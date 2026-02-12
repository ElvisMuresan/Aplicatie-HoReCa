# Stage 1: Build
FROM node:20-alpine AS build

WORKDIR /app

# Copiază package.json și package-lock.json
COPY package*.json ./

# Instalează dependențele
RUN npm ci

# Copiază restul fișierelor
COPY . .

COPY .env .env

# Build pentru producție
RUN npm run build

# Stage 2: Serve cu nginx
FROM nginx:alpine

# Copiază configurația nginx
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copiază fișierele din build
COPY --from=build /app/dist /usr/share/nginx/html

# Expune portul 80
EXPOSE 80

# Pornește nginx
CMD ["nginx", "-g", "daemon off;"]
