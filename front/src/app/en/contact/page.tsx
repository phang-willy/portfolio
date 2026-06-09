import { ContactPage, buildContactMetadata } from "@/app/contact/contact-page";

export const metadata = buildContactMetadata("en");

export default function Page() {
  return <ContactPage locale="en" />;
}
