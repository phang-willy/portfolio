export async function registerGithubInstrumentation(): Promise<void> {
  if (process.env.NEXT_RUNTIME !== "nodejs") return;

  const { logGithubEnvStatus } = await import("@/lib/github-stats");
  await logGithubEnvStatus();
}
