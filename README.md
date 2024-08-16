# Tiles

## Packages

- `api`
- `web`

## Development

### Requirements

- Node.js 21+
- PostgreSQL 16

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

- `npm run dev`: Start the development servers.
- `npm run db:push`: Create the database schema.
- `npm run db:seed`: Seed the database.
