import { ContactPage, buildContactMetadata } from "@/app/contact/contact-page";

export const metadata = buildContactMetadata("fr");

export default function Page() {
  return <ContactPage locale="fr" />;
}
