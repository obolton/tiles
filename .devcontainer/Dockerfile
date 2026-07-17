FROM node:24-trixie

ENV LANG=C.UTF-8

# Install pnpm
ENV COREPACK_ENABLE_DOWNLOAD_PROMPT=0
ENV PNPM_HOME=/pnpm
ENV PATH=$PNPM_HOME/bin:$PATH
ENV npm_config_store_dir=/pnpm/store
RUN corepack enable

# Install additional tools
RUN apt-get update && export DEBIAN_FRONTEND=noninteractive \
    && apt-get -y install --no-install-recommends \
    chromium \
    fonts-liberation \
    libnss3-tools \
    postgresql-client \
    socat \
    zsh \
    && apt-get clean -y && rm -rf /var/lib/apt/lists/*

# Tools for agents
RUN pnpm add -g \
    typescript-language-server@5.3.0 \
    chrome-devtools-mcp@1.6.0

# Set Zsh as the default shell
RUN chsh -s /bin/zsh node \
    && touch /home/node/.zshrc \
    && chown node:node /home/node/.zshrc

WORKDIR /projects

COPY entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh
ENTRYPOINT ["/entrypoint.sh"]
