# Stage 0, "build-stage", based on Node.js, to build and compile the frontend
FROM node:20 AS build-stage

WORKDIR /app

COPY package*.json /app/

RUN npm install

COPY ./ /app/

ARG VITE_API_URL=${VITE_API_URL} # Ensure this is set during build if required by Vite

RUN npm run build

# Stage 1, based on Nginx, to have only the compiled app, ready for production with Nginx
FROM nginx:1

RUN apt-get update && DEBIAN_FRONTEND=noninteractive apt-get install -y gettext && rm -rf /var/lib/apt/lists/*

COPY --from=build-stage /app/dist/ /usr/share/nginx/html

COPY ./nginx.conf.template /etc/nginx/conf.d/default.conf.template
COPY ./nginx-backend-not-found.conf /etc/nginx/extra-conf.d/backend-not-found.conf

CMD ["/bin/bash", "-c", "envsubst < /etc/nginx/conf.d/default.conf.template > /etc/nginx/conf.d/default.conf && nginx -g 'daemon off;'"]