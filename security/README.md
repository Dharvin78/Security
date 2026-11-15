# Secure Communication and Data Protection

## Security Improvements

- HTTPS using Caddy as a reverse proxy.
- Juice Shop HTTP server restricted to `127.0.0.1:3000`.
- CSP and Referrer-Policy security headers added through Caddy.
- RSA private key removed from source code and stored externally.
- JWT signing uses a 3072-bit RSA key.
- HMAC secret removed from source code and stored externally.
- Password-change request changed from GET to POST.
- Password-change API returns only a success message instead of the full user object.
- AES-256-GCM encryption implemented for three sensitive address fields: full name, mobile number, and street address.

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

### 3. Generate data encryption key

Generate a 256-bit encryption key for AES-256-GCM:

```bash
mkdir -p ~/.config/juice-shop/keys
chmod 700 ~/.config/juice-shop/keys

openssl rand -hex 32 > ~/.config/juice-shop/keys/data-encryption.key
chmod 600 ~/.config/juice-shop/keys/data-encryption.key
```

The encryption key is stored outside the project directory.

The application uses this key to encrypt and decrypt three address fields:

- `fullName`
- `mobileNum`
- `streetAddress`

Encryption and decryption are implemented in `lib/dataEncryption.ts` and integrated into `models/address.ts`.

### 4. Configure HTTPS

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

### 5. Start Juice Shop

```bash
npm run build:server
npm start
```

### 6. Test

Run the security unit tests:

```bash
node --import ./test/server/helpers/test-env.mjs --import tsx \
  --test --test-force-exit test/server/insecurity.unit.test.ts
```

Expected result: all security unit tests pass.

To verify encryption-at-rest, create a test address in Juice Shop and inspect the SQLite database at `data/juiceshop.sqlite`.

The three protected address fields should contain encrypted values beginning with `enc:v1:` instead of plaintext.

The application should still display the original address information correctly after decryption.

## Important Notes

- Never commit RSA private keys, HMAC secrets, or data encryption keys.
- Keep secret directories outside the Git repository.
- Changing the HMAC secret invalidates previously stored security-question answers.
- Changing the RSA key invalidates existing JWTs.
- Changing the data encryption key prevents previously encrypted address information from being decrypted. Keep the original key when retaining an existing database.
