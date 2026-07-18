FROM node:24-trixie

ENV LANG=C.UTF-8

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

# Install pnpm
ENV PNPM_HOME=/pnpm
ENV PATH=$PNPM_HOME/bin:$PATH
ENV pnpm_config_store_dir=/pnpm/store
ENV pnpm_config_enable_global_virtual_store=false
RUN npm install -g pnpm@11.14.0

# Tools for agents
RUN pnpm add -g \
    typescript-language-server@5.3.0 \
    chrome-devtools-mcp@1.6.0

# Set Zsh as the default shell
RUN chsh -s /bin/zsh node \
    && touch /home/node/.zshrc \
    && chown node:node /home/node/.zshrc

# Trust all Git repositories under /projects
RUN git config --system safe.directory '/projects/*'

WORKDIR /projects

COPY --chmod=755 entrypoint.sh /entrypoint.sh
ENTRYPOINT ["/entrypoint.sh"]
