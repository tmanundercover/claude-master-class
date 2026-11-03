export interface InterviewResponse {
  id: string;
  question: string;
  summary: string;
  topic: string;
  technologies: string[];
  experience: {
    role: string;
    organization: string;
    period: string;
    description: string;
    bullets: string[];
    skills?: string[];
    employmentType?: string;
  };
  duration: string;
  videoSrc: string;
  transcript: string;
}

export const interviewResponses: InterviewResponse[] = [
  {
    id: "manual-workflow",
    question: "Tell me about a manual workflow you automated.",
    summary: "A booking flow for student art interviews that connected payment gating with shared scheduling.",
    topic: "Automation",
    technologies: ["Wix", "Office 365", "Calendar automation"],
    experience: {
      role: "Automation Engineer",
      organization: "MTC Art Studios",
      period: "May 2025 - Present",
      description: "Implemented and maintains a Wix booking flow for student art interviews, including payment gating and Office 365 calendar sharing.",
      bullets: [
        "Implemented the Wix booking experience used for student art interviews.",
        "Connected payment gating to scheduling so payment happens before an interview can be booked.",
        "Set up Office 365 calendar sharing and continues to maintain the workflow as new requests arrive.",
      ],
    },
    duration: "2:18",
    videoSrc: "/interview/manual-workflow.mp4",
    transcript: "MTC Art Studios needed a more reliable way for students to move from payment into an interview booking. I was responsible for implementing a flow that protected the scheduling step and worked with the team's existing tools. I built the experience in Wix, connected payment gating to booking, and set up Office 365 calendar sharing so the right people could coordinate interviews. I continue to maintain the workflow and respond to feature requests. The studio now has one connected path for payment, booking, and shared scheduling rather than a set of disconnected steps.",
  },
  {
    id: "complex-integrations",
    question: "Describe a project with several third-party integrations.",
    summary: "Fintech web and mobile work spanning identity, bank data, card issuing, and authentication services.",
    topic: "Systems integration",
    technologies: ["React", "Kotlin", "Node.js", "Flutter", "AWS", "Auth0", "Plaid", "Marqeta", "Prove"],
    experience: {
      role: "Fullstack Software Engineer",
      organization: "Assembled Financial",
      period: "Jun 2021 - Sep 2022",
      description: "Built cryptocurrency banking web and mobile applications with React, Kotlin, Node.js, Flutter, Dart, and AWS; integrated Auth0, Prove, Plaid, and Marqeta services.",
      bullets: [
        "Built React web experiences and Flutter/Dart mobile applications backed by Kotlin and Node.js endpoints on AWS.",
        "Integrated Auth0 authentication, Prove identity verification, Plaid account data, and Marqeta banking operations.",
        "Worked across PostgreSQL-backed services, a Solana-based token, Segment analytics, and GitLab version control.",
      ],
    },
    duration: "3:07",
    videoSrc: "/interview/complex-integrations.mp4",
    transcript: "At Assembled Financial, the product crossed web, mobile, and service boundaries in a regulated fintech context. My work involved shipping customer-facing features while integrating several specialized platforms. I contributed across React, Flutter and Dart, Kotlin, and Node.js services on AWS, working with Auth0, Prove, Plaid, and Marqeta integrations. I treated each integration as a contract with distinct identity, data, and failure considerations instead of hiding them behind one generic abstraction. The team could deliver connected cryptocurrency banking experiences across web and mobile while keeping the integration boundaries understandable.",
  },
  {
    id: "modernize-frontend",
    question: "How have you modernized an existing application?",
    summary: "An Angular upgrade paired with state-management work and continued support for a distributed Java API.",
    topic: "Modernization",
    technologies: ["Angular", "ngRx", "Java", "Spring"],
    experience: {
      role: "Software Engineer",
      organization: "Northrop Grumman",
      period: "Jan 2018 - Dec 2019",
      description: "Upgraded an Angular application, developed ngRx features and data-heavy interfaces, and contributed to the distributed Java and Spring API it consumed.",
      bullets: [
        "Helped upgrade the application from Angular 4 to Angular 6 while continuing feature delivery.",
        "Developed ngRx features from JIRA tasking and UI/UX mockups supplied by an external design team.",
        "Built table-intensive views with complex filtering, sorting, and conditional interface behavior.",
        "Contributed to the distributed Java and Spring API consumed by the frontend.",
      ],
    },
    duration: "2:42",
    videoSrc: "/interview/modernize-frontend.mp4",
    transcript: "A data-heavy Angular application needed to evolve without losing the behavior people already depended on. I contributed to the framework upgrade, new stateful features, and the API that supported the interface. I developed Angular and ngRx features, worked carefully through the existing data flows, and contributed to the distributed Java and Spring API. The important part was treating modernization as an incremental product and systems change, not only a dependency update. The application gained a more current frontend foundation while continuing to support its established workflows and backend contracts.",
  },
  {
    id: "evaluate-ai",
    question: "How do you evaluate the quality of AI output?",
    summary: "Evaluation protocols, targeted prompts, test scenarios, and technical reports make quality review repeatable.",
    topic: "AI quality",
    technologies: ["LLMs", "Prompt engineering", "Evaluation", "Test design"],
    experience: {
      role: "AI Model Evaluation Specialist",
      organization: "Outlier.ai & DataAnnotations",
      period: "Dec 2022 - Present",
      description: "Designs evaluation protocols, prompts, and test scenarios for language models; authors technical reports and contributes detailed response evaluations to dataset creation.",
      bullets: [
        "Developed structured test cases to assess language-model capabilities and limitations.",
        "Engineered prompts and natural-language scenarios to analyze model behavior in realistic use cases.",
        "Performed detailed quality assurance, including audio-based interaction testing and response analysis.",
        "Documented technical findings and contributed evaluated responses to AI training datasets.",
      ],
    },
    duration: "2:35",
    videoSrc: "/interview/evaluate-ai.mp4",
    transcript: "Language-model responses can sound confident even when they miss the actual requirement. My evaluation work is to make those differences observable and explainable. I design evaluation protocols, prompts, and test scenarios, then document the behavior in technical reports and detailed response evaluations. I look at whether an answer follows the instruction, uses evidence, handles ambiguity, and fails safely rather than relying on fluency alone. The review becomes a repeatable contribution to dataset creation and model improvement instead of an unstructured preference call.",
  },
  {
    id: "evolving-ai-product",
    question: "Tell me about a product whose architecture evolved over time.",
    summary: "A white-label application generator that grew from workflow automation into a React and TypeScript system.",
    topic: "Product architecture",
    technologies: ["React", "TypeScript", "n8n", "GCP", "Firebase"],
    experience: {
      role: "AI Product Builder",
      organization: "White-label application generator",
      period: "Dec 2024 - Present",
      description: "Built workflow orchestration that generates and deploys websites and web applications, evolving an initial n8n workflow into a React and TypeScript system on GCP and Firebase with multimodal automation.",
      bullets: [
        "Started with an n8n workflow that proved the end-to-end application-generation concept.",
        "Evolved the workflow into white-label React and TypeScript product experiences.",
        "Implemented event-based execution using GCP and Firebase services.",
        "Connected text, image, and video generation inside a larger deployment workflow.",
      ],
    },
    duration: "3:16",
    videoSrc: "/interview/evolving-ai-product.mp4",
    transcript: "The application generator began as an n8n workflow that could prove the end-to-end idea. I needed to evolve that proof into a more flexible white-label product without losing the working automation. I moved the experience toward React and TypeScript, used event-based execution on GCP and Firebase, and supported text, image, and video generation as parts of the larger workflow. The system developed from one automation into a product architecture that can generate and deploy different websites and web applications.",
  },
  {
    id: "frontend-architecture",
    question: "Give an example of frontend architecture leadership.",
    summary: "A React form and alerting application designed alongside Spring, Java, and MySQL services.",
    topic: "Technical leadership",
    technologies: ["React", "Spring", "Java", "MySQL", "Angular", "Bootstrap"],
    experience: {
      role: "Principal / Frontend Software Engineer",
      organization: "Cybercore Technologies",
      period: "Dec 2015 - Dec 2017",
      description: "Architected a React form and alerting application backed by Spring, Java, and MySQL, and reengineered an Ext JS interface with Angular and Bootstrap.",
      bullets: [
        "Architected a React form that changed future fields from prior input, stored submissions in MySQL, and generated administrator alerts.",
        "Integrated the React application with an existing Spring and Java API in an Agile principal-engineering team.",
        "Reengineered an Ext JS interface with Angular and Bootstrap across Scala, Java, Hibernate, and MongoDB services.",
        "Built faceted-search prototypes with jQuery Mobile and SOLR and supported Tomcat deployment through Jenkins.",
      ],
    },
    duration: "2:51",
    videoSrc: "/interview/frontend-architecture.mp4",
    transcript: "Cybercore needed both a new form and alerting application and a path forward for an older Ext JS interface. As a principal frontend engineer, I was responsible for shaping the client architecture while working across the service boundary. I architected the React application backed by Spring, Java, and MySQL, and also reengineered the older interface with Angular and Bootstrap. I kept the frontend decisions connected to the data and service contracts rather than treating the browser as an isolated layer. The work established modern interface foundations for both the new application and the legacy modernization effort.",
  },
];
