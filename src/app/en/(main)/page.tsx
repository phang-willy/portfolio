import { HomePage, buildHomeMetadata } from "@/app/(main)/home-page";

export const metadata = buildHomeMetadata("en");

export default async function Page() {
  return <HomePage locale="en" />;
}
