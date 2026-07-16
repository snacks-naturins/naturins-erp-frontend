# ==========================
# Etapa 1 - Build
# ==========================
FROM node:20-alpine AS build

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build -- --configuration docker

# ==========================
# Etapa 2 - Runtime con Nginx
# ==========================
FROM nginx:alpine

# Eliminar configuración por defecto
RUN rm /etc/nginx/conf.d/default.conf

# Copiar configuración de Nginx
COPY nginx.conf /etc/nginx/conf.d/

# Copiar archivos build
COPY --from=build /app/dist/naturins-erp-frontend/browser /usr/share/nginx/html

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
