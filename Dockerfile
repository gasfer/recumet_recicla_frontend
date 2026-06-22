# ==========================
# Stage 1 - Build
# ==========================
FROM node:20.11.1-alpine AS build

WORKDIR /app

COPY package*.json ./

RUN npm install --force

COPY . .

# Argumento para definir la URL base de la API durante la compilación
ARG BASE_URL

# Si se proporciona BASE_URL, sobreescribir environment.ts con el nuevo valor antes de compilar
RUN if [ -n "$BASE_URL" ]; then \
      echo "export const environment = { base_url: '$BASE_URL' };" > src/environments/environment.ts; \
    fi

RUN npm run build

# ==========================
# Stage 2 - Runtime
# ==========================
FROM nginx:1.25-alpine

COPY --from=build /app/dist/frontend_recumet /usr/share/nginx/html

COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
