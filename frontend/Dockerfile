# Use an official Node.js runtime as a parent image
FROM node:18-alpine

# Set the working directory in the container
WORKDIR /app

# Copy package.json and package-lock.json to the working directory
COPY package*.json ./

# Install project dependencies
RUN npm install

# Copy the rest of the application's source code to the working directory
COPY . .

# Next.js builds the app for production
RUN npm run build

# Expose the port the app runs on
EXPOSE 3000

# Command to run the application in production mode
CMD ["npm", "start"] 
