
# Secure Communication and Data Protection

## Security Improvements

- HTTPS using Caddy as a reverse proxy.
- Juice Shop HTTP server restricted to `127.0.0.1:3000`.
- RSA private key removed from source code and stored externally.
- JWT signing uses a 3072-bit RSA key.
- HMAC secret removed from source code and stored externally.

## Setup (Ubuntu)

### 1. Generate RSA keys

```bash
mkdir -p ~/.config/juice-shop/keys
chmod 700 ~/.config/juice-shop/keys

openssl genpkey -algorithm RSA -pkeyopt rsa_keygen_bits:3072 \
  -out ~/.config/juice-shop/keys/jwt-private.pem

openssl pkey -in ~/.config/juice-shop/keys/jwt-private.pem \
  -pubout -out ~/.config/juice-shop/keys/jwt-public.pem

chmod 600 ~/.config/juice-shop/keys/jwt-private.pem
```

### 2. Generate HMAC secret

```bash
mkdir -p ~/.config/juice-shop/secrets
chmod 700 ~/.config/juice-shop/secrets

openssl rand -hex 32 > ~/.config/juice-shop/secrets/hmac.key
chmod 600 ~/.config/juice-shop/secrets/hmac.key
```

### 3. Configure HTTPS

Install Caddy on Ubuntu:

```bash
sudo apt install caddy
```

Copy the provided configuration:

```bash
sudo cp security/caddy/Caddyfile /etc/caddy/Caddyfile
sudo systemctl restart caddy
```

Caddy provides HTTPS at:

`https://localhost:3443`

The internal Juice Shop server listens on:

`127.0.0.1:3000`

Caddy uses an internal certificate authority for local development. Your browser may need to trust the Caddy root certificate.

### 4. Start Juice Shop

```bash
npm run build:server
npm start
```

### 5. Test

Run the security unit tests:

```bash
node --import ./test/server/helpers/test-env.mjs --import tsx \
  --test --test-force-exit test/server/insecurity.unit.test.ts
```

Expected result: all security unit tests pass.

## Important Security Notes

- Never commit RSA private keys or HMAC secret files.
- Each teammate should generate their own keys and secret.
- Keep secret directories outside the Git repository.
- Changing the HMAC secret invalidates previously stored security-question answers.
- Changing the RSA key invalidates existing JWTs.
- This localhost Caddy configuration is intended for development on a single machine, not production deployment.
