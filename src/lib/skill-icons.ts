import type { IconDefinition } from "@fortawesome/fontawesome-common-types";
import { faAws, faOpenai, faWindows, faMicrosoft, faCss3Alt } from "@fortawesome/free-brands-svg-icons";
import {
  siApachegroovy, siNpm, siCodesandbox,
  siRuby, siWebpack, siCircleci, siGitlab, siGooglechrome, siJenkins, siSencha, siSpringboot, siJquery,
  siFigma, siJetbrains, siMacos, siLinux, siApachemaven, siApacheant, siApachesolr, siScala, siXml, siApache, siApachetomcat, siNginx, siCreatereactapp, siLess, siSass, siJasmine, siAtlassian, siSubversion, siHtml5, siBootstrap, siSpring, siPrimeng, siTerraform, siGrunt, siGithub,
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

interface BrandIcon {
  title: string;
  path?: string;
  image?: "parcel" | "docusign" | "vscode" | "gwt" | "jqueryMobile";
  viewBox: string;
}

function simpleIcon(icon: SimpleIcon): BrandIcon {
  return { title: icon.title, path: icon.path, viewBox: "0 0 24 24" };
}

function fontAwesomeIcon(icon: IconDefinition): BrandIcon {
  const [width, height, , , path] = icon.icon;
  return {
    title: icon.iconName,
    path: Array.isArray(path) ? path.join(" ") : path,
    viewBox: `0 0 ${width} ${height}`,
  };
}

const AWS_ICON = fontAwesomeIcon(faAws);
const FIREBASE_ICON = simpleIcon(siFirebase);

const BRAND_ICONS: Record<string, BrandIcon> = {
  Ruby: simpleIcon(siRuby),
  CodeSandbox: simpleIcon(siCodesandbox),
  Groovy: { ...simpleIcon(siApachegroovy), viewBox: '0 6 24 12' },
  webpack: simpleIcon(siWebpack),
  CircleCI: simpleIcon(siCircleci),
  GitLab: simpleIcon(siGitlab),
  "GitHub Actions": simpleIcon(siGithubactions),
  "Chrome DevTools": simpleIcon(siGooglechrome),
  CSS3: fontAwesomeIcon(faCss3Alt),
  HTML5: simpleIcon(siHtml5),
  Jenkins: simpleIcon(siJenkins),
  "Ext JS": simpleIcon(siSencha),
  "Spring Boot": simpleIcon(siSpringboot),
  jQuery: simpleIcon(siJquery),
  "Office 365": fontAwesomeIcon(faMicrosoft),
  'jQuery Mobile': { title: 'jQuery Mobile', image: 'jqueryMobile', viewBox: '0 0 24 24' },
  GWT: { title: 'Google Web Toolkit', image: 'gwt', viewBox: '0 0 24 24' },
  Parcel: { title: 'Parcel', image: 'parcel', viewBox: '0 0 24 24' },
  DocuSign: { title: 'DocuSign', image: 'docusign', viewBox: '0 0 24 24' },
  "Visual Studio Code": { title: 'Visual Studio Code', image: 'vscode', viewBox: '0 0 24 24' },
  Figma: simpleIcon(siFigma),
  "JetBrains IDEs": simpleIcon(siJetbrains),
  macOS: simpleIcon(siMacos),
  Windows: fontAwesomeIcon(faWindows),
  Linux: simpleIcon(siLinux),
  Maven: simpleIcon(siApachemaven),
  Ant: simpleIcon(siApacheant),
  "Apache Solr": simpleIcon(siApachesolr),
  Scala: simpleIcon(siScala),
  XML: simpleIcon(siXml),
  Apache: simpleIcon(siApache),
  Tomcat: simpleIcon(siApachetomcat),
  nginx: simpleIcon(siNginx),
  "Create React App": simpleIcon(siCreatereactapp),
  LESS: simpleIcon(siLess),
  Sass: simpleIcon(siSass),
  Jasmine: simpleIcon(siJasmine),
  Atlassian: simpleIcon(siAtlassian),
  SVN: simpleIcon(siSubversion),
  HTML: simpleIcon(siHtml5),
  Bootstrap: simpleIcon(siBootstrap),
  Spring: simpleIcon(siSpring),
  PrimeNG: simpleIcon(siPrimeng),
  Terraform: simpleIcon(siTerraform),
  Grunt: simpleIcon(siGrunt),
  npm: simpleIcon(siNpm),
  GitHub: simpleIcon(siGithub),
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

const normalize = (value: string) => value.toLowerCase().replace(/[^a-z0-9]+/g, '');
const technologyIcons = new Map(Object.entries(BRAND_ICONS).map(([label, icon]) => [normalize(label), { ...icon, id: normalize(label) }]));
const aliases: Record<string, string> = {
  'SOLR': 'Apache Solr', 'Solr': 'Apache Solr', 'Google Web Toolkit': 'GWT', 'React.js': 'React', 'Angular.js': 'Angular', 'Ext.js': 'Ext JS',
  'Google Forms': 'Google Forms Integrations', 'Google Sheets': 'Google Sheets integrations',
  'CSS': 'CSS3', 'HTML': 'HTML5', 'HTML 5.0': 'HTML5', 'Material-ui': 'Material UI',
  'Storybook Component Library': 'Storybook', 'Shopify API': 'Shopify', 'Shopify Plugin Development': 'Shopify SDK',
  'Google Cloud Platform(GCP)': 'GCP', 'Spring & Spring MVC': 'Spring', 'Java Server Pages(JSP)': 'Java',
  'IntelliJ IDEA & Webstorm': 'JetBrains IDEs', 'Create React App(CRA)': 'Create React App', 'SASS/SCSS': 'Sass',
  'Atlassian Suite: JIRA, Confluence, Crucible, BitBucket, Bamboo': 'Atlassian',
  'Firebase: Firestore, Real-time Database': 'Firebase',
  'Firebase: Hosting, Functions, Authentication, Push Notifications, Analytics': 'Firebase',
};
for (const [alias, label] of Object.entries(aliases)) technologyIcons.set(normalize(alias), technologyIcons.get(normalize(label))!);

/** Only technologies with explicit brand artwork get icon tiles. Everything else is contextual metadata. */
export function getTechnologyIcon(skill: string) { return technologyIcons.get(normalize(skill)); }
export function splitTechnologyMetadata(skills: readonly string[], tags: readonly string[] = []) {
  return {
    skills: [...new Set(skills.filter(skill => !!getTechnologyIcon(skill)))],
    tags: [...new Set([...tags, ...skills.filter(skill => !getTechnologyIcon(skill))])],
  };
}
