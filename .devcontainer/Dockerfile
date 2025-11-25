FROM node:24-bookworm

# Install additional tools
RUN apt-get update && export DEBIAN_FRONTEND=noninteractive \
    && apt-get -y install --no-install-recommends \
    git \
    postgresql-client \
    && apt-get clean -y && rm -rf /var/lib/apt/lists/*

# Set up workspace
WORKDIR /workspace

# Configure git to trust the workspace directory
RUN git config --system --add safe.directory /workspace
