# Stage 1: Build stage
FROM node:21-alpine as builder

# Create destination directory
RUN mkdir -p /usr/src/nuxt-app
WORKDIR /usr/src/nuxt-app

# Copy the app, note .dockerignore
COPY . /usr/src/nuxt-app/

# Enable Corepack (if necessary, based on your project requirements)
RUN corepack enable

# Install dependencies and build the app
RUN yarn install && yarn build

# Stage 2: Run stage
FROM node:21-alpine as runner

# Set the working directory
WORKDIR /usr/src/nuxt-app

# Copy the built app from the builder stage
COPY --from=builder /usr/src/nuxt-app/.output ./.output

# Expose the necessary ports (this is more for documentation)
EXPOSE 3000

# Set environment variables
ENV NUXT_PORT=3000

# Command to run the application
CMD ["node", ".output/server/index.mjs"]
