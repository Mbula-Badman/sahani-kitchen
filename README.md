# Sahani Kitchen

## Local setup

1. Install the project dependencies with `npm install`.
2. Create a Supabase PostgreSQL project. Copy its pooled connection string to
   `DATABASE_URL` and its direct connection string to `DIRECT_URL`. Keep both
   values private.
3. Copy `.env.example` to `.env` and set both database URLs, a random
   `SESSION_SECRET` of at least 32 characters, and a unique owner name, email,
   and password (at least 12 characters) for the first admin account.
4. Generate/apply the PostgreSQL migration and load the initial menu and admin:

   ```sh
   npm run db:generate
   npm run db:migrate
   npm run db:seed
   ```

5. Start the site with `npm run dev`. Visit `/login` to sign in as the owner.

The seed command creates the admin only if that email does not already exist.
It never resets an existing admin password. Customer accounts are self-service.
An admin can create employee accounts, promote existing customers to employees,
and promote employees to admins from the dashboard. Promotions are one-way in
the dashboard; role demotion is not available. Employees cannot grant roles or
edit dish names and prices. Ratings stay private until an admin approves them.
Orders are enquiries for restaurant confirmation; this site does not charge
customers or process M-Pesa payments.

For deployment, set the same environment variables in the hosting provider,
run the Drizzle migration during deployment, and run the seed command once to
create the first admin and sample menu. Do not commit `.env` or database
credentials.
