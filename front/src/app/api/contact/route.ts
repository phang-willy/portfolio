import {
  handleContactGetRequest,
  handleContactPostRequest,
} from "@/lib/server/contact-route-handlers";

export const dynamic = "force-dynamic";

export const GET = handleContactGetRequest;
export const POST = handleContactPostRequest;
