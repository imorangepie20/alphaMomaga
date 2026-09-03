export function getApiUrl(): string | undefined {
  return process.env.API_URL ?? process.env.NEXT_PUBLIC_API_URL;
}
