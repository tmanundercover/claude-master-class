import LoginForm from "@/components/LoginForm";
import RoleIntroduction from "@/components/RoleIntroduction";

export default function Login({ hasWelcomeVideo }: { hasWelcomeVideo: boolean }) {
  return (
    <main id="main">
      <section className="role-login">
        <div>
          <p className="eyebrow">Interview questions and answers</p>
          <h1>Welcome to the conversation.</h1>
          <RoleIntroduction hasVideo={hasWelcomeVideo} />
        </div>
        <div className="panel role-login-form">
          <p className="eyebrow">Secure access</p>
          <h2>Log in to watch my interview answers</h2>
          <p>Sign in to explore my responses and ask follow-up questions. Your session lasts four hours.</p>
          <LoginForm />
        </div>
      </section>
    </main>
  );
}
