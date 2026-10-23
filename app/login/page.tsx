import Link from "next/link";
import { loginAction } from "@/app/auth-actions";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;
  return (
    <main className="account-page">
      <div className="account-card">
        <Link className="account-brand" href="/">
          Sahani Kitchen
        </Link>
        <span className="eyebrow">KARIBU BACK</span>
        <h1>Sign in</h1>
        <p>Sign in to manage your Sahani Kitchen account.</p>
        {error && <p className="form-message form-error" role="alert">{error}</p>}
        <form action={loginAction} className="account-form">
          <label>
            Email address
            <input autoComplete="email" name="email" required type="email" />
          </label>
          <label>
            Password
            <input autoComplete="current-password" name="password" required type="password" />
          </label>
          <button className="button button-green" type="submit">Sign in</button>
        </form>
        <p className="account-switch">
          New to Sahani? <Link href="/register">Create a customer account</Link>
        </p>
        <Link className="account-back" href="/">Back to the restaurant website</Link>
      </div>
    </main>
  );
}
