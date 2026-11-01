import { useEffect, useMemo, useRef, useState, type FormEvent } from "react";
import ExpandableExperience from "@/components/ExpandableExperience";
import type { InterviewResponse } from "@/lib/interview-responses";

function PreviewVideo({ response, available }: { response: InterviewResponse; available: boolean }) {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const video = videoRef.current;
    if (!video || !available) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting && entry.intersectionRatio >= 0.55) {
        void video.play().catch(() => undefined);
      } else {
        video.pause();
      }
    }, { threshold: [0, 0.55, 1] });
    observer.observe(video);
    return () => observer.disconnect();
  }, [available]);

  if (!available) {
    return (
      <div className="interview-video-placeholder" aria-label={`Video placeholder for ${response.question}`}>
        <span className="play-mark" aria-hidden="true">▶</span>
        <span>Video coming soon</span>
      </div>
    );
  }

  return (
    <video
      ref={videoRef}
      className="interview-preview-video"
      src={response.videoSrc}
      aria-label={`Muted preview: ${response.question}`}
      loop
      muted
      playsInline
      preload="metadata"
    />
  );
}

function ListenButton({ response }: { response: InterviewResponse }) {
  const [speaking, setSpeaking] = useState(false);

  useEffect(() => () => window.speechSynthesis?.cancel(), []);

  function toggle() {
    if (!("speechSynthesis" in window)) return;
    if (speaking) {
      window.speechSynthesis.cancel();
      setSpeaking(false);
      return;
    }
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(response.transcript);
    utterance.onend = () => setSpeaking(false);
    utterance.onerror = () => setSpeaking(false);
    setSpeaking(true);
    window.speechSynthesis.speak(utterance);
  }

  return <button className="secondary compact-button" type="button" onClick={toggle}>{speaking ? "Stop listening" : "Listen to transcript"}</button>;
}

function QuestionModal({ onClose }: { onClose: () => void }) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [sent, setSent] = useState(false);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (dialog && !dialog.open) dialog.showModal();
    return () => {
      if (dialog?.open) dialog.close();
    };
  }, []);

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const name = String(form.get("name") ?? "").trim();
    const question = String(form.get("question") ?? "").trim();
    const subject = encodeURIComponent(`Interview follow-up from ${name || "a portfolio visitor"}`);
    const body = encodeURIComponent(`${question}\n\nFrom: ${name || "Not provided"}`);
    window.location.href = `mailto:terrell.singleton@gmail.com?subject=${subject}&body=${body}`;
    setSent(true);
  }

  return (
    <dialog ref={dialogRef} className="question-dialog" aria-labelledby="question-title" onCancel={(event) => { event.preventDefault(); onClose(); }}>
      <div className="dialog-heading">
        <div><p className="eyebrow">Follow up</p><h2 id="question-title">I have another question</h2></div>
        <button className="icon-button secondary" type="button" onClick={onClose} aria-label="Close question form">×</button>
      </div>
      <p>Share what you would like Terrell to address. Submitting opens a prepared message in your email app so you stay in control of sending it.</p>
      <form onSubmit={submit}>
        <label htmlFor="question-name">Your name
          <input id="question-name" name="name" autoComplete="name" />
        </label>
        <label htmlFor="question-text">Question
          <textarea id="question-text" name="question" rows={6} required maxLength={1200} />
        </label>
        <div className="dialog-actions">
          <button type="submit">Open email draft</button>
          <button className="secondary" type="button" onClick={onClose}>Cancel</button>
        </div>
        {sent && <p className="success" role="status">Your email app should be open. Review the message there, then send it.</p>}
      </form>
    </dialog>
  );
}

function ResponseModal({ response, available, onClose }: { response: InterviewResponse; available: boolean; onClose: () => void }) {
  const dialogRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (dialog && !dialog.open) dialog.showModal();
    return () => {
      if (dialog?.open) dialog.close();
    };
  }, []);

  return (
    <dialog ref={dialogRef} className="response-dialog" aria-labelledby="response-title" onCancel={(event) => { event.preventDefault(); onClose(); }}>
      <div className="dialog-heading">
        <div><p className="eyebrow">Full response</p><h2 id="response-title">{response.question}</h2></div>
        <button className="icon-button secondary" type="button" onClick={onClose} aria-label="Close full response">×</button>
      </div>
      <div className="expanded-video">
        {available
          ? <video src={response.videoSrc} controls playsInline preload="metadata" />
          : <div className="interview-video-placeholder"><span className="play-mark" aria-hidden="true">▶</span><span>Recorded response coming soon</span></div>}
      </div>
      <div className="expanded-response-grid">
        <div>
          <h3>Response summary</h3>
          <p>{response.summary}</p>
          <ExpandableExperience
            className="experience-card"
            ariaLabel={`${response.experience.role} experience details`}
            bullets={response.experience.bullets}
          >
            <span>Story source</span>
            <strong>{response.experience.role}</strong>
            <span>{response.experience.organization} · {response.experience.period}</span>
            <p>{response.experience.description}</p>
          </ExpandableExperience>
          <div className="tags">{response.technologies.map((item) => <span className="badge" key={item}>{item}</span>)}</div>
          {!available && <ListenButton response={response} />}
        </div>
        <div>
          <h3>Transcript</h3>
          <div className="transcript" tabIndex={0}>{response.transcript}</div>
        </div>
      </div>
    </dialog>
  );
}

export default function InterviewLibrary({
  responses,
  availableVideoIds,
}: {
  responses: InterviewResponse[];
  availableVideoIds: string[];
}) {
  const [query, setQuery] = useState("");
  const [topic, setTopic] = useState("all");
  const [technology, setTechnology] = useState("all");
  const [experience, setExperience] = useState("all");
  const [selected, setSelected] = useState<InterviewResponse | null>(null);
  const [asking, setAsking] = useState(false);
  const available = useMemo(() => new Set(availableVideoIds), [availableVideoIds]);

  const options = useMemo(() => ({
    topics: [...new Set(responses.map((response) => response.topic))].sort(),
    technologies: [...new Set(responses.flatMap((response) => response.technologies))].sort(),
    experiences: [...new Set(responses.map((response) => response.experience.organization))].sort(),
  }), [responses]);

  const filtered = responses.filter((response) => {
    const searchable = [response.question, response.summary, response.transcript, response.topic, response.experience.role, response.experience.organization, ...response.technologies].join(" ").toLowerCase();
    return searchable.includes(query.trim().toLowerCase())
      && (topic === "all" || response.topic === topic)
      && (technology === "all" || response.technologies.includes(technology))
      && (experience === "all" || response.experience.organization === experience);
  });

  return (
    <>
      <section className="interview-controls" aria-label="Filter interview responses">
        <label className="interview-search" htmlFor="response-search">Search questions and answers
          <input id="response-search" type="search" placeholder="Try “React”, “leadership”, or “AI quality”" value={query} onChange={(event) => setQuery(event.target.value)} />
        </label>
        <label htmlFor="topic-filter">Topic
          <select id="topic-filter" value={topic} onChange={(event) => setTopic(event.target.value)}>
            <option value="all">All topics</option>
            {options.topics.map((option) => <option key={option}>{option}</option>)}
          </select>
        </label>
        <label htmlFor="tech-filter">Technology
          <select id="tech-filter" value={technology} onChange={(event) => setTechnology(event.target.value)}>
            <option value="all">All technology</option>
            {options.technologies.map((option) => <option key={option}>{option}</option>)}
          </select>
        </label>
        <label htmlFor="experience-filter">Experience
          <select id="experience-filter" value={experience} onChange={(event) => setExperience(event.target.value)}>
            <option value="all">All experience</option>
            {options.experiences.map((option) => <option key={option}>{option}</option>)}
          </select>
        </label>
      </section>

      <div className="results-heading">
        <p><strong>{filtered.length}</strong> {filtered.length === 1 ? "response" : "responses"}</p>
        <button type="button" onClick={() => setAsking(true)}>I have another question</button>
      </div>

      <section className="interview-list" aria-label="Interview responses">
        {filtered.map((response) => (
          <article className="interview-row" key={response.id}>
            <div className="interview-thumbnail">
              <PreviewVideo response={response} available={available.has(response.id)} />
              <span className="duration-badge">{response.duration}</span>
              <div className="thumbnail-meta"><span>{response.topic}</span><span>Muted preview</span></div>
              <div className="thumbnail-transcript" tabIndex={0} aria-label={`Transcript excerpt for ${response.question}`}>
                <strong>Transcript</strong>
                <p>{response.transcript}</p>
              </div>
            </div>
            <div className="interview-copy">
              <p className="eyebrow">Interview question</p>
              <h2>{response.question}</h2>
              <p className="response-summary">{response.summary}</p>
              <div className="experience-card">
                <span>Experience</span>
                <strong>{response.experience.role}</strong>
                <span>{response.experience.organization} · {response.experience.period}</span>
              </div>
              <div className="tags">{response.technologies.map((item) => <span className="badge" key={item}>{item}</span>)}</div>
              <div className="row-actions">
                <button type="button" onClick={() => setSelected(response)}>Open full response</button>
                {!available.has(response.id) && <ListenButton response={response} />}
              </div>
            </div>
          </article>
        ))}
        {filtered.length === 0 && <div className="panel empty-state"><h2>No responses match.</h2><p>Clear a filter or try a broader search term.</p></div>}
      </section>

      {selected && <ResponseModal response={selected} available={available.has(selected.id)} onClose={() => setSelected(null)} />}
      {asking && <QuestionModal onClose={() => setAsking(false)} />}
    </>
  );
}
