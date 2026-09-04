import type { ContractStatus } from "./contracts";

export type CreateContractMutationInput = {
  propertyId: string;
  tenantId: string;
  unit: string;
  monthlyRent: number;
  startDate: string;
  endDate: string;
  status: ContractStatus;
};

export type UpdateContractMutationInput = {
  status: ContractStatus;
  terminatedAt?: string;
};

export type RenewContractMutationInput = {
  startDate: string;
  endDate: string;
  monthlyRent: number;
};

async function request(path: string, method: "POST" | "PUT", body: object) {
  const response = await fetch(path, {
    method,
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    throw new Error(String(response.status));
  }
}

export async function createContract(
  input: CreateContractMutationInput,
): Promise<void> {
  await request("/api/proxy/contracts", "POST", {
    ...input,
    monthlyRent: `₩${input.monthlyRent.toLocaleString("en-US")}`,
  });
}

export async function updateContract(
  id: string,
  input: UpdateContractMutationInput,
): Promise<void> {
  await request(`/api/proxy/contracts/${encodeURIComponent(id)}`, "PUT", input);
}

export async function renewContract(
  id: string,
  input: RenewContractMutationInput,
): Promise<void> {
  await request(
    `/api/proxy/contracts/${encodeURIComponent(id)}/renew`,
    "POST",
    {
      ...input,
      monthlyRent: `₩${input.monthlyRent.toLocaleString("en-US")}`,
    },
  );
}
