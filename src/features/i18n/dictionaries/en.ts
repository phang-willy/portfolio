import type { Dictionary } from "@/features/i18n/dictionaries/fr";

export const en: Dictionary = {
  meta: {
    homeTitle: "Portfolio - Full Stack Developer",
    homeDescription: "Portfolio - Full Stack Developer",
    projectsTitle: "Projects",
    projectsDescription:
      "Explore my projects: context, tech stack, and outcomes.",
    contactTitle: "Contact",
    contactDescription:
      "Reach out for a mission, a collaboration, or a conversation.",
    legalsTitle: "Legal notice",
    legalsDescription:
      "Legal information about this site: publisher, hosting, and terms of use.",
    projectFallbackTitle: "Project",
    stacksMarqueeAria: "Technologies and tools — scrolling skills strip",
  },
  nav: {
    homeSr: "Home",
    projects: "Projects",
    contact: "Contact",
    openMenu: "Open menu",
    menuSr: "Open menu",
    closeMenu: "Close menu",
    closeMenuSr: "Close menu",
  },
  footer: {
    legals: "Legal notice",
    contact: "Contact",
  },
  language: {
    menuLabel: "Language",
    french: "Français",
    english: "English",
    triggerAria: "Choose language",
    srCurrentFr: "Current language: French",
    srCurrentEn: "Current language: English",
    srSwitchToFrench: "Switch to French",
    srSwitchToEnglish: "Switch to English",
  },
  theme: {
    triggerAria: "Choose display theme",
    light: "Light",
    dark: "Dark",
    system: "System",
    srCurrentLight: "Current theme: light",
    srCurrentDark: "Current theme: dark",
    srCurrentSystem: "Current theme: system",
    srSelectLight: "Use light theme",
    srSelectDark: "Use dark theme",
    srSelectSystem: "Use system theme",
  },
  presentation: {
    titleLine1: "Full Stack",
    titleLine2: "Developer",
    greeting1: "Hello, I'm Willy PHANG",
    greeting2: "Passionate about web development!",
    profileImageAlt: "PHANG Willy",
  },
  about: {
    badge: "About",
    line1: "Development is not just a job",
    line2: "It's my passion.",
    mapAvailability:
      "Available in Paris and the greater area, in France, and in all European Union member states.",
  },
  githubStats: {
    contributions: "GitHub contributions",
    repositories: "Repositories (created & collaboration)",
    currentStreak: "Current streak",
    longestStreak: "Longest streak",
  },
  services: {
    badge: "Services",
    titleLine1: "Services designed",
    titleLine2: "for your goals",
    intro:
      "As a Full Stack developer, I support your projects from design to production with reliable, performant solutions tailored to your business.",
    contactCta: "Contact me",
    learnMoreForService: "Contact me about {service}",
  },
  experiences: {
    badge: "Experience",
    title: "A snapshot of my journey",
    description: "Key milestones in my path as a developer.",
  },
  projects: {
    badge: "Projects",
    title: "Explore my projects",
    description:
      "Discover my projects with their context and the technologies used",
    hoverHint: "Hover a project on desktop to learn more.",
    seeAll: "View all projects",
  },
  message: {
    quote1a: "If you've made it this far, thank you for your time.",
    quote1b:
      "I enjoy building useful, performant, polished products—with the same standards whether it's a marketing site, a business app, or an e-commerce platform.",
    quote2:
      "My goal is simple: help you turn an idea into a concrete, durable, pleasant-to-use solution.",
    quote3:
      "If my approach resonates with you, I'd be glad to discuss your project.",
    name: "Willy PHANG",
    role: "Full Stack Developer",
    profileAlt: "PHANG Willy - Full Stack Developer",
    sectionAriaLabel: "Message",
  },
  projectsPage: {
    title: "Explore my projects",
    intro:
      "Discover my projects with their context, the technologies used, and the results achieved.",
    hoverHintDesktop: "Hover a project on desktop to learn more.",
  },
  projectDetail: {
    backToProjects: "Back to projects",
    heroPreview: "Preview",
    stacks: "Stacks / Tags",
    links: "Links",
    siteDemo: "Live site / demo",
    sourceCode: "Source code",
    information: "Details",
    created: "Created:",
    updated: "Last updated:",
  },
  contactPage: {
    title: "Contact",
    intro:
      "You can reach out for a mission, a collaboration, or simply to chat about a web project. Use the form below—I reply as soon as I can.",
    legalLeadIn:
      "By submitting this form, you agree to the processing of the data described in the",
    legalLink: "legal notice",
    legalSuffix: ".",
  },
  contactForm: {
    optional: "(optional)",
    captchaLabel: "Copy the code below",
    newCode: "New code",
    newCodeAria: "Generate a new code",
    captchaPlaceholder: "Copy the code (spaces you type are ignored)",
    captchaGenerating: "Generating code…",
    retry: "Retry",
    submitSending: "Sending…",
    submitUnavailable: "Unavailable",
    submit: "Send",
    submitHintBlocked:
      "Fill all required fields and copy the code to enable sending.",
    submitHintFooter:
      "Complete all required fields and the code—the send button will enable automatically.",
    submitHintRequired: "Fields marked with an asterisk are required.",
    success: "Your message was sent successfully. Thank you!",
    errors: {
      rateLimitCaptcha: "Too many code requests. Wait a moment and try again.",
      captchaLoad:
        "Could not load the verification code. Try again or refresh the page.",
      captchaMissing:
        "Verification code unavailable. Use “New code” or refresh the page.",
      rateLimitHealthcheck:
        "Too many service checks. Wait and reload the page.",
      invalidServerResponse: "Invalid server response. Try again later.",
      genericSubmit: "Something went wrong. Try again later.",
      network: "Could not reach the server. Check your connection.",
      unavailableGeneric:
        "The contact form is temporarily unavailable.\nWe apologize for the inconvenience.\nFor any request, please use the contact details in the legal notice.",
    },
    fields: {
      firstName: "First name",
      lastName: "Last name",
      email: "Email address",
      phone: "Phone",
      company: "Company",
      title: "Job title",
      message: "Message",
    },
  },
  legals: {
    title: "Legal notice",
    publicationDirector: "Publication director",
    hosting: "Hosting",
    contact: "Contact",
    emailLabel: "Email:",
    phoneLabel: "Phone:",
    linkedInLabel: "LinkedIn:",
    contactLinkPrefix: "Contact:",
    contactPageLink: "Contact page",
    cookies: "Cookies",
    cookiesBody:
      "This site sets a technical cookie named “locale”, used solely to remember your language preference (French or English) and keep the site working as intended (including the home page and language switching). It is not used for advertising, analytics, or behavioural tracking.",
    personalData: "Personal data",
    pData1:
      "Information sent via the contact form (first name, last name, email, phone, company, title, message) is used only to respond to contact requests.",
    pData2Lead:
      "This data is not stored on the site. It is transmitted securely through",
    pData2Brevo: "Brevo (formerly Sendinblue)",
    pData2Trail:
      ", used to send emails, then received in the site publisher's mailbox.",
    pData3:
      "Personal data is not used for marketing nor shared with third parties.",
    pData4: "Data is kept only as long as needed to handle the request.",
    pData5Lead: "Under the",
    gdpr: "General Data Protection Regulation (GDPR)",
    pData5Trail:
      ", you have the right to access, rectify, and delete your data. You can exercise these rights by contacting:",
  },
};
