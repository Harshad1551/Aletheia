# Use Python base image, as it's easier to add Node.js to a Python image than vice versa
FROM python:3.11-slim

# Install Node.js (v20)
RUN apt-get update && apt-get install -y curl && \
    curl -fsSL https://deb.nodesource.com/setup_20.x | bash - && \
    apt-get install -y nodejs && \
    apt-get clean

# Set working directory inside the container
WORKDIR /app

# 1. Install Node.js Dependencies First (Helps with Docker Caching)
COPY package.json package-lock.json* ./
RUN npm install

# 2. Install Python Dependencies
COPY note-taking/requirements.txt ./note-taking/
RUN pip install --no-cache-dir -r note-taking/requirements.txt

# 3. Copy the rest of the application code
COPY . .

# 4. Expose the port your Node.js app runs on
EXPOSE 3000

# 5. Start the Node.js application
CMD ["node", "server.js"]
