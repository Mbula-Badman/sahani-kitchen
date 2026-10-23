import Link from "next/link";
import { registerAction } from "@/app/auth-actions";

export default async function RegisterPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;
  return (
    <main className="account-page">
      <div className="account-card">
        <Link className="account-brand" href="/">Sahani Kitchen</Link>
        <span className="eyebrow">JOIN US AT THE TABLE</span>
        <h1>Create your account</h1>
        <p>Customer accounts let you place orders and leave ratings.</p>
        {error && <p className="form-message form-error" role="alert">{error}</p>}
        <form action={registerAction} className="account-form">
          <label>
            Your name
            <input autoComplete="name" maxLength={80} name="name" required />
          </label>
          <label>
            Email address
            <input autoComplete="email" name="email" required type="email" />
          </label>
          <label>
            Phone number <span>(optional)</span>
            <input autoComplete="tel" maxLength={30} name="phone" type="tel" />
          </label>
          <label>
            Password
            <input
              autoComplete="new-password"
              minLength={12}
              name="password"
              required
              type="password"
            />
            <small>Use at least 12 characters.</small>
          </label>
          <button className="button button-green" type="submit">Create account</button>
        </form>
        <p className="account-switch">
          Already have an account? <Link href="/login">Sign in</Link>
        </p>
        <Link className="account-back" href="/">Back to the restaurant website</Link>
      </div>
    </main>
  );
}
