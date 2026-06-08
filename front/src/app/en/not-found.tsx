import type { Metadata } from "next";
import { HttpErrorView } from "@/components/http-error-view";
import { appName } from "@/lib/app-name";

export const metadata: Metadata = {
  title: `${appName} - Page not found`,
  description: `${appName} - Page not found`,
};

export default function EnNotFound() {
  return <HttpErrorView status={404} locale="en" />;
}
