# Use Node 18 as a lightweight base
FROM node:18-alpine

# Create app directory
WORKDIR /app

# Copy package files and install dependencies
COPY package*.json ./
RUN npm install --production

# Copy the rest of the app
COPY . .

# Expose the app port
EXPOSE 5000

# Start the app
CMD ["npm", "start"]
