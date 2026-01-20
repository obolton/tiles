# Tiles

## Packages

- `api`
- `web`
- `image-upload-worker`

## Development

### Creating a local SSL certificate

1. Install [mkcert](https://github.com/FiloSottile/mkcert):

   ```sh
   brew install mkcert
   ```

2. Create a local certificate authority and install it in the system root store:

   ```sh
   mkcert -install
   ```

3. Create a certificate and private key for `localhost` in the project root directory:

   ```sh
   mkcert localhost
   ```

   This will create `localhost.pem` and `localhost-key.pem` files.

### Scripts

- `pnpm dev`: Start the development servers.
- `pnpm db:push`: Create the database schema.

### Dev containers

If using Git worktrees with dev containers, you must enable relative paths:

```sh
git config worktree.useRelativePaths true
```

This ensures worktree references work correctly inside the container.
