import LoginForm from "@/components/LoginForm";
import RoleIntroduction from "@/components/RoleIntroduction";

export default function Login({ hasWelcomeVideo }: { hasWelcomeVideo: boolean }) {
  return (
    <main id="main">
      <section className="role-login">
        <div>
          <p className="eyebrow">Choose your interview view</p>
          <h1>Welcome to the conversation.</h1>
          <RoleIntroduction hasVideo={hasWelcomeVideo} />
        </div>
        <div className="panel role-login-form">
          <p className="eyebrow">Secure access</p>
          <h2>Who are you joining as?</h2>
          <p>Sign in with your Firebase account. Your assigned role controls access; selecting a view does not grant permissions. Sessions expire after four hours.</p>
          <LoginForm />
        </div>
      </section>
    </main>
  );
}
