import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("./auth0", () => ({
  auth0: { getAccessToken: vi.fn() },
}));

vi.mock("./api-url", () => ({
  getApiUrl: vi.fn(),
}));

import { auth0 } from "./auth0";
import { getApiUrl } from "./api-url";
import { forwardProtectedMutation, isProtectedResource } from "./protected-api";

const mockGetAccessToken = vi.mocked(auth0.getAccessToken);
const mockGetApiUrl = vi.mocked(getApiUrl);
const mockFetch = vi.fn();

describe("forwardProtectedMutation", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    vi.stubGlobal("fetch", mockFetch);
    mockGetApiUrl.mockReturnValue("https://api.approid.team");
  });

  it("forwards a server-side Bearer token and content type", async () => {
    mockGetAccessToken.mockResolvedValue({ token: "access-token", expiresAt: 0 });
    mockFetch.mockResolvedValue(
      new Response(JSON.stringify({ id: "property-1" }), {
        status: 201,
        headers: { "content-type": "application/json" },
      }),
    );

    const response = await forwardProtectedMutation(
      "properties",
      new Request("https://web.test/api/proxy/properties", {
        method: "POST",
        body: JSON.stringify({ name: "New Property" }),
        headers: { "content-type": "application/json", authorization: "Bearer untrusted" },
      }),
    );

    const [url, options] = mockFetch.mock.calls[0] as [URL, RequestInit];
    const headers = new Headers(options.headers);
    expect(url.toString()).toBe("https://api.approid.team/properties");
    expect(headers.get("authorization")).toBe("Bearer access-token");
    expect(headers.get("content-type")).toBe("application/json");
    expect(response.status).toBe(201);
    await expect(response.json()).resolves.toEqual({ id: "property-1" });
  });

  it("returns 401 when the server session has no access token", async () => {
    mockGetAccessToken.mockRejectedValue(new Error("no session"));

    await expect(
      forwardProtectedMutation("properties", new Request("https://web.test", { method: "POST" })),
    ).resolves.toMatchObject({ status: 401 });
    expect(mockFetch).not.toHaveBeenCalled();
  });

  it("rejects methods outside the mutation allowlist", async () => {
    const response = await forwardProtectedMutation(
      "properties",
      new Request("https://web.test", { method: "PATCH" }),
    );

    expect(response.status).toBe(405);
    expect(response.headers.get("allow")).toBe("POST, PUT, DELETE");
  });

  it("returns 503 when no API origin is configured", async () => {
    mockGetApiUrl.mockReturnValue(undefined);

    await expect(
      forwardProtectedMutation("properties", new Request("https://web.test", { method: "POST" })),
    ).resolves.toMatchObject({ status: 503 });
  });

  it("only recognizes explicitly allowlisted resources", () => {
    expect(isProtectedResource("properties")).toBe(true);
    expect(isProtectedResource("admin")).toBe(false);
  });

  it("forwards an item mutation to the API item endpoint", async () => {
    mockGetAccessToken.mockResolvedValue({ token: "access-token", expiresAt: 0 });
    mockFetch.mockResolvedValue(new Response(null, { status: 204 }));

    const response = await forwardProtectedMutation(
      "properties",
      new Request("https://web.test/api/proxy/properties/property-1", { method: "DELETE" }),
      "property-1",
    );

    const [url] = mockFetch.mock.calls[0] as [URL];
    expect(url.toString()).toBe("https://api.approid.team/properties/property-1");
    expect(response.status).toBe(204);
  });
});
