FROM mcr.microsoft.com/devcontainers/typescript-node:24-bookworm

# Install Playwright dependencies
RUN npx playwright install-deps

# Install additional tools
RUN apt-get update && export DEBIAN_FRONTEND=noninteractive \
    && apt-get -y install --no-install-recommends \
    git \
    curl \
    wget \
    && apt-get autoremove -y && apt-get clean -y

# Set up workspace
WORKDIR /workspaces/web-viewer

# Install Playwright browsers (will be done after npm install via postCreateCommand)
# This ensures browsers are available for E2E testing
