const DEFAULT_API_PORT = 3100;

export function getApiPort(port: string | undefined): number {
  return port ? Number(port) : DEFAULT_API_PORT;
}
