FROM node:20-slim
WORKDIR /usr/src/app
COPY package*.json ./
# Copy .npmrc to configure npm registry
COPY .npmrc ./
RUN npm install
COPY . .
# Build the Next.js application without GEMINI_API_KEY since it's not needed for build
RUN npm run build
EXPOSE 3000
# Set the GEMINI_API_KEY from runtime environment
CMD ["sh", "-c", "GEMINI_API_KEY=$GEMINI_API_KEY npm start"]