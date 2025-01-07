# Use an official Node.js runtime as a parent image
FROM node:14

# Set the working directory
WORKDIR /usr/src/app

# Copy the package.json and install dependencies
COPY package*.json ./
RUN npm install

# Copy the rest of the application code
COPY . .

# Expose the port the app runs on
EXPOSE 8080

# Start the application
CMD [ "npm", "start" ]


ENV DB_USER=root
ENV DB_PASSWORD=taskme103
# Active Database
# ENV DB_NAME=MainDatabase
# Development Database
ENV DB_NAME=TestDatabase
ENV JWT_SECRET=SECRETXPASS
ENV BUCKETURL=https://storage.googleapis.com
ENV BUCKETNAME=mitto
ENV INSTANCE_CONNECTION_NAME=core-incentive-445913-q5:australia-southeast2:mitto