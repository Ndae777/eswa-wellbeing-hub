// Sends JSON to one of our own /api routes and never throws.
// Network failures come back as { networkError: true } so pages can show a
// friendly "check your connection" message.

export type ApiReply = {
  ok: boolean;
  status: number;
  networkError: boolean;
  data: { [key: string]: unknown };
};

export async function postJson(url: string, body: unknown): Promise<ApiReply> {
  try {
    const response = await fetch(url, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(body),
    });
    let data: { [key: string]: unknown } = {};
    try {
      data = (await response.json()) as { [key: string]: unknown };
    } catch {
      data = {};
    }
    return {
      ok: response.ok && data["ok"] !== false,
      status: response.status,
      networkError: false,
      data,
    };
  } catch {
    return { ok: false, status: 0, networkError: true, data: {} };
  }
}

export const NETWORK_ERROR_MESSAGE =
  "We couldn't reach the server. Please check your internet connection and try again.";
