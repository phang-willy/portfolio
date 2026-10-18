import { HomePage, buildHomeMetadata } from "@/app/(main)/home-page";

export const metadata = buildHomeMetadata("en");

export const dynamic = "force-dynamic";

export default async function Page() {
  return <HomePage locale="en" />;
}
