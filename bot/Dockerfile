# Use an official Node.js runtime as a parent image
FROM node:20-slim

# Set the working directory
WORKDIR /usr/src/app

# Copy package.json and package-lock.json
COPY package*.json ./

# Copy .npmrc to configure npm registry
COPY .npmrc ./

# Install dependencies
RUN npm install

# Copy the rest of the application's source code
COPY . .

# Bundle app source
EXPOSE 3000

# Command to run the app
CMD [ "tsx", "watch", "src/index.ts" ]
