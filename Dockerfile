
# ---- Build stage ----
FROM node:20-alpine AS build

WORKDIR /app

# Copy package.json and package-lock.json to install dependencies
COPY package.json package-lock.json ./

# Install dependencies
RUN npm ci

# Copy the rest of your application code
COPY . .

# Build the static Vite bundle
RUN npm run build

# ---- Serve stage ----
FROM nginx:mainline-alpine

COPY --from=build /app/dist /usr/share/nginx/html/health
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Expose the port that the app runs on
EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
