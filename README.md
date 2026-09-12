# opensplit

Open source bill splitter. Fork it, connect your own Supabase, and host it free on GitHub Pages.

A privacy-friendly alternative to Splitwise for roommates, friend groups, and trips. No accounts required — just share a link.

## Self-Hosting

### 1. Fork this repo

### 2. Create a Supabase project

Sign up at [supabase.com](https://supabase.com) and create a new project.

### 3. Run migrations

The database schema lives in [opensplit-core](https://github.com/rasmussvala/opensplit-core).
Follow the Database section of its README to apply the migrations to your project.

### 4. Add GitHub secrets

In your fork, go to **Settings > Secrets and variables > Actions** and add:

| Secret                                  | Where to find it                                                                       |
|-----------------------------------------|----------------------------------------------------------------------------------------|
| `VITE_SUPABASE_URL`                     | Supabase dashboard > Project Settings > API > Project URL                              |
| `VITE_SUPABASE_PUBLISHABLE_DEFAULT_KEY` | Supabase dashboard > Project Settings > API > Publishable key                          |
| `VITE_ADMIN_PIN`                        | Any short PIN you choose — required to create new groups                               |

### 5. Push to main

GitHub Actions will automatically deploy the frontend to GitHub Pages.

## Local Development

```bash
cp .env.example .env # fill in your credentials
npm install
npm run dev
```

## License

MIT
