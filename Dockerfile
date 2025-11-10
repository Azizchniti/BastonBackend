# Use Node 18
FROM node:18-alpine

# Set working directory
WORKDIR /app

# Copy package files first and install dependencies
COPY package*.json ./
RUN npm install --production

# Copy the rest of the project
COPY . .

# Ensure the source folder is included
# Node will look for src/server.js as in package.json

# Expose the app port
EXPOSE 5000

# Start the server
CMD ["npm", "start"]
