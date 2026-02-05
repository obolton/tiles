FROM node:24-trixie

# Install pnpm via Corepack
ENV COREPACK_ENABLE_DOWNLOAD_PROMPT=0
ENV npm_config_store_dir=/pnpm/store
RUN corepack enable

# Install additional tools
RUN apt-get update && export DEBIAN_FRONTEND=noninteractive \
    && apt-get -y install --no-install-recommends \
    postgresql-client \
    zsh \
    && apt-get clean -y && rm -rf /var/lib/apt/lists/*

# Set Zsh as the default shell
RUN chsh -s /bin/zsh node \
    && touch /home/node/.zshrc \
    && chown node:node /home/node/.zshrc

WORKDIR /projects

COPY entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh
ENTRYPOINT ["/entrypoint.sh"]
