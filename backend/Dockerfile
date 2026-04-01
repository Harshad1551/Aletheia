# Use Python base image
FROM python:3.11-slim

# Install Node.js (v20)
RUN apt-get update && apt-get install -y curl && \
    curl -fsSL https://deb.nodesource.com/setup_20.x | bash - && \
    apt-get install -y nodejs && \
    apt-get clean

# Set working directory
WORKDIR /app

# -----------------------------
# Install Node dependencies
# -----------------------------
COPY package.json package-lock.json* ./
RUN npm install

# -----------------------------
# Install Python dependencies
# -----------------------------
COPY note-taking/requirements.txt ./note-taking/
RUN pip install --no-cache-dir -r note-taking/requirements.txt

# -----------------------------
# Copy all backend code
# -----------------------------
COPY . .

# -----------------------------
# Expose Render port
# -----------------------------
EXPOSE 3000

# -----------------------------
# Start BOTH services
# Node = main (Render)
# Flask = background
# -----------------------------
CMD ["sh", "-c", "python3 note-taking/flask_app.py & node server.js"]