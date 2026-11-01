import { useState, type FormEvent } from "react";

export default function ContactForm() {
  const [notice, setNotice] = useState("");

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setNotice("This form is ready for a delivery service, but your message was not sent yet.");
  }

  return (
    <form className="contact-form" onSubmit={submit} onInput={() => setNotice("")}>
      <div className="contact-form-heading">
        <h3>Send a message</h3>
        <span>Delivery coming soon</span>
      </div>
      <div className="contact-form-row">
        <label>
          Name
          <input name="name" autoComplete="name" required />
        </label>
        <label>
          Email
          <input name="email" type="email" autoComplete="email" required />
        </label>
      </div>
      <label>
        What would you like to discuss?
        <textarea name="message" rows={5} required />
      </label>
      <div className="contact-form-footer">
        <button type="submit">Send message</button>
        <p className="muted">Preview only — submissions are not delivered yet.</p>
      </div>
      <p className="contact-form-notice" role="status" aria-live="polite">{notice}</p>
    </form>
  );
}
