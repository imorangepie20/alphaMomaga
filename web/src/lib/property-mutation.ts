import type { PropertyStatus } from "./properties";

export type PropertyMutationInput = {
  name: string;
  location: string;
  type: string;
  occupancy: number;
  status: PropertyStatus;
};

export class PropertyMutationError extends Error {
  constructor(readonly status: number) {
    super(`Property mutation failed with status ${status}`);
  }
}

export async function saveProperty(input: PropertyMutationInput, id?: string): Promise<void> {
  const response = await fetch(id ? `/api/proxy/properties/${encodeURIComponent(id)}` : "/api/proxy/properties", {
    method: id ? "PUT" : "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(input),
  });

  if (!response.ok) {
    throw new PropertyMutationError(response.status);
  }
}
