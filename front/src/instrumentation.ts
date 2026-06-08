import { registerGithubInstrumentation } from "@/features/github/server/register-github-instrumentation";

export async function register() {
  await registerGithubInstrumentation();
}
