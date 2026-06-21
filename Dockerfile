# ==========================
# Stage 1 - Build
# ==========================
FROM node:20.11.1-alpine AS build

WORKDIR /app

COPY package*.json ./

RUN npm install --force

COPY . .

RUN npm run build

# ==========================
# Stage 2 - Runtime
# ==========================
FROM nginx:1.25-alpine

COPY --from=build /app/dist/frontend_recumet /usr/share/nginx/html

COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
