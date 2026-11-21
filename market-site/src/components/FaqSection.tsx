import { Link } from "react-router-dom";

export const FAQ_ITEMS = [
  {
    question: "Is Job Search Assistant free?",
    answer: "The source code is available under the MIT license. The desktop app does not charge a subscription, but optional external AI providers may require a paid plan or usage credits. Review your provider's terms and costs before running workflows.",
  },
  {
    question: "Will the app automatically submit applications?",
    answer: "No. The application helps you find opportunities, evaluate fit, draft materials and track progress. You review and submit applications yourself. It does not silently send applications or emails.",
  },
  {
    question: "Can it guarantee that my resume passes an ATS?",
    answer: "No honest tool can guarantee acceptance by every employer's applicant tracking system. The current app includes PDF and extracted-text checks when the required local tools are available. A more comprehensive, benchmarked ATS Intelligence Lab is in development; no universal pass rate is claimed.",
  },
  {
    question: "Does ATS Intelligence already work in the downloadable app?",
    answer: "Not as a complete product module. Resume parsing benchmarks, requirement-to-evidence mapping and recruiter-outcome measurement are planned engineering work. The current Application Studio supports provider-assisted drafting and document review, subject to the provider and local dependencies you configure.",
  },
  {
    question: "Which AI providers can I use?",
    answer: "Claude Code and OpenAI Codex are the primary documented agentic workflow paths. OpenAI API, Gemini and Ollama adapters are under ongoing capability verification; not every provider can perform every workflow. Check the in-app provider status and documentation for supported operations.",
  },
  {
    question: "Can I use the app without an AI account?",
    answer: "You can browse the app and inspect existing local workspace records, but several current discovery, ranking and drafting workflows require a configured provider. Native profile editing and a more complete offline job-tracking journey are being developed; they are not yet promised as shipped.",
  },
  {
    question: "Where does my resume and job-search data go?",
    answer: "Your workspace files are stored locally. If you use a cloud AI provider, selected resume, profile or job-description content may be sent to that provider under its terms. The project does not claim that cloud-assisted workflows are entirely offline.",
  },
  {
    question: "Does it work on macOS, Windows and Linux?",
    answer: "macOS Apple Silicon is the only platform with a published desktop package. It is ad-hoc signed and not notarized. Updates are assisted: Settings can check GitHub Releases and download a verified zip; you quit and replace the app yourself (no silent install). First launch may need right-click → Open. Do not disable Gatekeeper. Intel Mac and Windows are build-from-source. Linux is not a desktop release target.",
  },
  {
    question: "Do I need programming knowledge to get started?",
    answer: "The desktop interface makes the workflows easier to inspect, but current setup may still require an AI provider CLI, Python and PDF build tools. The product team is improving candidate-first onboarding to reduce this friction. Follow the installation guide for exact prerequisites.",
  },
  {
    question: "How do I report a problem or suggest a feature?",
    answer: "Open an issue or join a discussion in the public GitHub repository. Please remove personal resumes, tokens, recruiter messages and application records before sharing logs or screenshots.",
  },
] as const;

export function FaqSection({ compact = false }: { compact?: boolean }) {
  const items = compact ? FAQ_ITEMS.slice(0, 5) : FAQ_ITEMS;

  return (
    <section className="band faq-band" id="faq" aria-labelledby="faq-title">
      <div className="section-head reveal">
        <p className="kicker">Questions, answered</p>
        <h2 id="faq-title">Know exactly <em>what you're getting.</em></h2>
        <p className="lede">
          Straight answers about costs, application controls, ATS claims, AI requirements, and your data.
        </p>
      </div>
      <div className="faq-list">
        {items.map(({ question, answer }) => (
          <details className="faq-item reveal" key={question}>
            <summary>
              <span>{question}</span>
              <span className="faq-indicator" aria-hidden="true">+</span>
            </summary>
            <p>{answer}</p>
          </details>
        ))}
      </div>
      {compact ? (
        <div className="marketing-center reveal">
          <Link className="btn btn-soft btn-lg" to="/faq">Read all FAQs</Link>
        </div>
      ) : null}
    </section>
  );
}
