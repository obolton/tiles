FROM node:24-bookworm

# Enable Corepack to install pnpm
ENV COREPACK_ENABLE_DOWNLOAD_PROMPT=0
RUN corepack enable

# Install additional tools
RUN apt-get update && export DEBIAN_FRONTEND=noninteractive \
    && apt-get -y install --no-install-recommends \
    git \
    postgresql-client \
    ca-certificates \
    && apt-get clean -y && rm -rf /var/lib/apt/lists/*

# Add CA certificate
RUN --mount=type=secret,id=ca_cert \
    cp /run/secrets/ca_cert /usr/local/share/ca-certificates/root-ca.crt && \
    chmod 644 /usr/local/share/ca-certificates/root-ca.crt && \
    update-ca-certificates

# Set up workspace
WORKDIR /workspace

# Configure git to trust the workspace directory
RUN git config --system --add safe.directory /workspace

# Pre-create node_modules directories with correct ownership
RUN mkdir -p /workspace/node_modules \
    /workspace/packages/api/node_modules \
    /workspace/packages/web/node_modules \
    /workspace/packages/image-upload-worker/node_modules \
    && chown -R node:node /workspace
