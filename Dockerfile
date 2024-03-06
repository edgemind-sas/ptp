# Use the official Python 3.9 image as a parent image
FROM python:3.9-slim

# Set environment variables
ENV PYTHONDONTWRITEBYTECODE 1
ENV PYTHONUNBUFFERED 1

# Set the working directory inside the container
WORKDIR /app

# Install git
RUN apt-get update && apt-get install -y git && rm -rf /var/lib/apt/lists/*

# Clone the specific repository
RUN git clone https://github.com/edgemind-sas/ptp.git

# Change directory to the cloned repository
WORKDIR /app/ptp

# Install the necessary Python packages from requirements file
RUN pip install --no-cache-dir -r python_requirements.txt

# Expose port 8000 to be accessible from the host
EXPOSE 8000

# Command to run the server
CMD ["cod3s-project", "--state-less", "-v", "-d"]
