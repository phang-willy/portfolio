import { HomePage, buildHomeMetadata } from "@/app/(main)/home-page";

export const metadata = buildHomeMetadata("fr");

export default async function Page() {
  return <HomePage locale="fr" />;
}
