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

# Si se proporciona BASE_URL, actualizar solo la URL base y conservar el resto del entorno
RUN if [ -n "$BASE_URL" ]; then \
      BASE_URL="$BASE_URL" node -e "const fs = require('fs'); const file = 'src/environments/environment.ts'; const source = fs.readFileSync(file, 'utf8'); fs.writeFileSync(file, source.replace(/base_url: '[^']*'/, 'base_url: ' + JSON.stringify(process.env.BASE_URL)));"; \
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
