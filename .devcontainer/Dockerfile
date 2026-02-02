FROM node:24-trixie

# Install pnpm via Corepack
ENV COREPACK_ENABLE_DOWNLOAD_PROMPT=0
ENV npm_config_store_dir=/pnpm/store
RUN corepack enable

# Install additional tools
RUN apt-get update && export DEBIAN_FRONTEND=noninteractive \
    && apt-get -y install --no-install-recommends \
    postgresql-client \
    && apt-get clean -y && rm -rf /var/lib/apt/lists/*

WORKDIR /projects

COPY entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh
ENTRYPOINT ["/entrypoint.sh"]
