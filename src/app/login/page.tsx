import { existsSync } from "node:fs";
import { join } from "node:path";
import LoginForm from "@/components/LoginForm";
import RoleIntroduction from "@/components/RoleIntroduction";

export default function Login() {
  const hasWelcomeVideo = existsSync(join(process.cwd(), "public", "interview", "welcome.mp4"));
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
          <p>Recruiter and Interviewer use the shared interview-room password. Terrell uses the private owner password. Sessions expire after four hours.</p>
          <LoginForm />
        </div>
      </section>
    </main>
  );
}
