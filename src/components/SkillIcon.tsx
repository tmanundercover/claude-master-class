import type { IconDefinition } from "@fortawesome/fontawesome-common-types";
import { faAws, faOpenai } from "@fortawesome/free-brands-svg-icons";
import {
  siAngular,
  siAuth0,
  siCplusplus,
  siDart,
  siDocker,
  siFirebase,
  siFlutter,
  siGithubactions,
  siGimp,
  siGooglecloud,
  siGooglegemini,
  siGoogleforms,
  siGooglesheets,
  siJavascript,
  siJest,
  siKotlin,
  siMongodb,
  siMui,
  siMysql,
  siN8n,
  siNodedotjs,
  siOpenjdk,
  siPhp,
  siPostgresql,
  siPython,
  siReact,
  siResend,
  siSanity,
  siShopify,
  siStorybook,
  siTypescript,
  siVite,
  siWix,
  siWordpress,
  siZapier,
  type SimpleIcon,
} from "simple-icons";

type SkillIconKind =
  | "api"
  | "automation"
  | "cloud"
  | "code"
  | "commerce"
  | "component"
  | "container"
  | "database"
  | "document"
  | "layers"
  | "mobile"
  | "network"
  | "observability"
  | "palette"
  | "pipeline"
  | "queue"
  | "security"
  | "spark"
  | "testing"
  | "window";

const SKILL_ICON_KIND: Record<string, SkillIconKind> = {
  React: "component",
  Angular: "component",
  Vite: "automation",
  Storybook: "layers",
  "Material UI": "layers",
  Dart: "mobile",
  Flutter: "mobile",
  "API design": "api",
  "API integrations": "api",
  "Distributed systems": "network",
  "Custom authentication": "security",
  Authentication: "security",
  LLMs: "spark",
  "UX design": "palette",
  "Office 365": "document",
  SEO: "observability",
  "Multi-tenant architecture": "network",
  AWS: "cloud",
  GCP: "cloud",
  Firebase: "cloud",
  "AWS Lambda": "automation",
  "Firebase Functions": "automation",
  SQS: "queue",
  RDS: "database",
  Firestore: "database",
  PostgreSQL: "database",
  MySQL: "database",
  MongoDB: "database",
  DynamoDB: "database",
  "Prompt engineering": "spark",
  "LLM evaluation": "spark",
  "Agent runtimes": "network",
  OpenSpec: "document",
  "Runtime observability": "observability",
  TDD: "testing",
  Jest: "testing",
  "Automated testing": "testing",
  Docker: "container",
  "CI/CD": "pipeline",
  "Sanity.io": "window",
  "Custom CMS architecture": "window",
  Shopify: "commerce",
  "Shopify SDK": "commerce",
  WordPress: "window",
  Wix: "window",
  "Wix Automations": "automation",
  "Google Forms Integrations": "document",
  "Google Sheets integrations": "layers",
  n8n: "automation",
  Zapier: "automation",
  DocuSign: "document",
  GIMP: "palette",
};

interface BrandIcon {
  title: string;
  path: string;
  viewBox: string;
}

function simpleIcon(icon: SimpleIcon): BrandIcon {
  return { title: icon.title, path: icon.path, viewBox: "0 0 24 24" };
}

function fontAwesomeIcon(icon: IconDefinition): BrandIcon {
  const [width, height, , , path] = icon.icon;
  return {
    title: icon.iconName === "aws" ? "Amazon Web Services" : "OpenAI",
    path: Array.isArray(path) ? path.join(" ") : path,
    viewBox: `0 0 ${width} ${height}`,
  };
}

const AWS_ICON = fontAwesomeIcon(faAws);
const FIREBASE_ICON = simpleIcon(siFirebase);

const BRAND_ICONS: Record<string, BrandIcon> = {
  JavaScript: simpleIcon(siJavascript),
  TypeScript: simpleIcon(siTypescript),
  React: simpleIcon(siReact),
  Angular: simpleIcon(siAngular),
  Vite: simpleIcon(siVite),
  Storybook: simpleIcon(siStorybook),
  "Material UI": simpleIcon(siMui),
  "Node.js": simpleIcon(siNodedotjs),
  Kotlin: simpleIcon(siKotlin),
  Java: simpleIcon(siOpenjdk),
  "C/C++": simpleIcon(siCplusplus),
  Python: simpleIcon(siPython),
  PHP: simpleIcon(siPhp),
  Dart: simpleIcon(siDart),
  Flutter: simpleIcon(siFlutter),
  AWS: AWS_ICON,
  "AWS Lambda": AWS_ICON,
  SQS: AWS_ICON,
  RDS: AWS_ICON,
  DynamoDB: AWS_ICON,
  GCP: simpleIcon(siGooglecloud),
  Firebase: FIREBASE_ICON,
  "Firebase Hosting": FIREBASE_ICON,
  "Firebase Authentication": FIREBASE_ICON,
  Auth0: simpleIcon(siAuth0),
  "Firebase Functions": FIREBASE_ICON,
  Firestore: FIREBASE_ICON,
  PostgreSQL: simpleIcon(siPostgresql),
  MySQL: simpleIcon(siMysql),
  MongoDB: simpleIcon(siMongodb),
  "OpenAI Codex": fontAwesomeIcon(faOpenai),
  "Google Gemini": simpleIcon(siGooglegemini),
  Jest: simpleIcon(siJest),
  Docker: simpleIcon(siDocker),
  "CI/CD": simpleIcon(siGithubactions),
  "Sanity.io": simpleIcon(siSanity),
  "Resend API": simpleIcon(siResend),
  Shopify: simpleIcon(siShopify),
  "Shopify SDK": simpleIcon(siShopify),
  WordPress: simpleIcon(siWordpress),
  Wix: simpleIcon(siWix),
  "Wix Automations": simpleIcon(siWix),
  "Google Forms Integrations": simpleIcon(siGoogleforms),
  "Google Forms": simpleIcon(siGoogleforms),
  "Google Sheets integrations": simpleIcon(siGooglesheets),
  "Google Sheets": simpleIcon(siGooglesheets),
  n8n: simpleIcon(siN8n),
  Zapier: simpleIcon(siZapier),
  GIMP: simpleIcon(siGimp),
};

function IconPaths({ kind }: { kind: SkillIconKind }) {
  switch (kind) {
    case "api":
      return <><circle cx="6" cy="12" r="2" /><circle cx="18" cy="7" r="2" /><circle cx="18" cy="17" r="2" /><path d="m8 11 8-3M8 13l8 3" /></>;
    case "automation":
      return <path d="m13.5 2-8 11h6l-1 9 8-12h-6l1-8Z" />;
    case "cloud":
      return <path d="M7 18h10a4 4 0 0 0 .7-7.94A6 6 0 0 0 6.2 8.5 4.75 4.75 0 0 0 7 18Z" />;
    case "commerce":
      return <><path d="M5 8h14l-1 13H6L5 8Z" /><path d="M9 9V6a3 3 0 0 1 6 0v3" /></>;
    case "component":
      return <><rect x="3" y="3" width="7" height="7" rx="1.5" /><rect x="14" y="3" width="7" height="7" rx="1.5" /><rect x="3" y="14" width="7" height="7" rx="1.5" /><path d="M14 17.5h7M17.5 14v7" /></>;
    case "container":
      return <><path d="m12 2 8 4.5v11L12 22l-8-4.5v-11L12 2Z" /><path d="m4.5 6.75 7.5 4.5 7.5-4.5M12 11.25V22" /></>;
    case "database":
      return <><ellipse cx="12" cy="5" rx="7" ry="3" /><path d="M5 5v6c0 1.65 3.13 3 7 3s7-1.35 7-3V5M5 11v6c0 1.65 3.13 3 7 3s7-1.35 7-3v-6" /></>;
    case "document":
      return <><path d="M6 2h8l4 4v16H6V2Z" /><path d="M14 2v5h5M9 12h6M9 16h6" /></>;
    case "layers":
      return <><path d="m12 3 9 5-9 5-9-5 9-5Z" /><path d="m3 12 9 5 9-5M3 16l9 5 9-5" /></>;
    case "mobile":
      return <><rect x="7" y="2" width="10" height="20" rx="2" /><path d="M10 5h4M11 19h2" /></>;
    case "network":
      return <><circle cx="12" cy="5" r="2.5" /><circle cx="5" cy="18" r="2.5" /><circle cx="19" cy="18" r="2.5" /><path d="m10.8 7.2-4.6 8.6M13.2 7.2l4.6 8.6M7.5 18h9" /></>;
    case "observability":
      return <><path d="M3 12h4l2-6 4 12 2-6h6" /><circle cx="12" cy="12" r="10" /></>;
    case "palette":
      return <><path d="M12 3a9 9 0 1 0 0 18h1.5a2 2 0 0 0 0-4H12a2 2 0 0 1 0-4h3a6 6 0 0 0 0-12h-3Z" /><circle cx="7.5" cy="9" r="1" /><circle cx="10.5" cy="6.5" r="1" /><circle cx="15" cy="7" r="1" /></>;
    case "pipeline":
      return <><rect x="2" y="4" width="6" height="5" rx="1" /><rect x="16" y="15" width="6" height="5" rx="1" /><path d="M8 6.5h5a3 3 0 0 1 3 3v5.5M13 12l3 3 3-3" /></>;
    case "queue":
      return <><path d="M4 6h12M4 12h9M4 18h12" /><path d="m16 3 4 3-4 3M13 9l4 3-4 3M16 15l4 3-4 3" /></>;
    case "security":
      return <><path d="M12 2 20 5v6c0 5.2-3.4 9-8 11-4.6-2-8-5.8-8-11V5l8-3Z" /><path d="m8.5 12 2.2 2.2 4.8-5" /></>;
    case "spark":
      return <><path d="m12 2 1.6 5.2L19 9l-5.4 1.8L12 16l-1.6-5.2L5 9l5.4-1.8L12 2Z" /><path d="m19 15 .8 2.2L22 18l-2.2.8L19 21l-.8-2.2L16 18l2.2-.8L19 15Z" /></>;
    case "testing":
      return <><path d="M8 3h8M9 3v5l-5 10a2 2 0 0 0 1.8 3h12.4a2 2 0 0 0 1.8-3L15 8V3" /><path d="m8 16 2 2 5-5" /></>;
    case "window":
      return <><rect x="2" y="3" width="20" height="18" rx="2" /><path d="M2 8h20M7 8v13M5 5.5h.01M8 5.5h.01" /></>;
    case "code":
    default:
      return <><path d="m8.5 7-5 5 5 5M15.5 7l5 5-5 5M14 4l-4 16" /></>;
  }
}

export default function SkillIcon({ skill }: { skill: string }) {
  const brand = BRAND_ICONS[skill];
  if (brand) {
    return (
      <svg className="skill-icon skill-icon--brand" viewBox={brand.viewBox} aria-hidden="true" focusable="false">
        <path d={brand.path} />
      </svg>
    );
  }
  const kind = SKILL_ICON_KIND[skill] ?? "code";
  return (
    <svg className="skill-icon" data-kind={kind} viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <IconPaths kind={kind} />
    </svg>
  );
}

