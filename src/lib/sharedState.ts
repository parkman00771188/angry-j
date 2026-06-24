import { AngerEpisodeRecord, AppSettings, CauseOption } from "../types";

export type SharedState = {
  records: AngerEpisodeRecord[];
  causes: CauseOption[];
  settings: AppSettings;
  initialized?: boolean;
  updatedAt?: string;
};

export type SharedBackup = {
  id: string;
  createdAt: string;
  stateUpdatedAt: string;
  recordCount: number;
  causeCount: number;
};

export const CLOUD_SECRET_KEY = "anger-j-cloud-secret";

function getRequestHeaders() {
  const headers: Record<string, string> = {};

  if (typeof window !== "undefined") {
    const secret = window.localStorage.getItem(CLOUD_SECRET_KEY);
    if (secret) {
      headers["X-AngryJ-Secret"] = secret;
    }
  }

  return headers;
}

export async function fetchSharedState(signal?: AbortSignal) {
  const response = await fetch("/api/state", {
    cache: "no-store",
    headers: getRequestHeaders(),
    signal,
  });

  if (!response.ok || !response.headers.get("content-type")?.includes("application/json")) {
    return null;
  }

  return (await response.json()) as SharedState;
}

export async function saveSharedState(state: Omit<SharedState, "initialized" | "updatedAt">) {
  const response = await fetch("/api/state", {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      ...getRequestHeaders(),
    },
    body: JSON.stringify(state),
  });

  if (!response.ok || !response.headers.get("content-type")?.includes("application/json")) {
    return null;
  }

  return (await response.json()) as SharedState;
}

export async function fetchSharedBackups(signal?: AbortSignal) {
  const response = await fetch("/api/backups", {
    cache: "no-store",
    headers: getRequestHeaders(),
    signal,
  });

  if (!response.ok || !response.headers.get("content-type")?.includes("application/json")) {
    return null;
  }

  return (await response.json()) as { backups: SharedBackup[] };
}

export async function createSharedBackup(state: Omit<SharedState, "initialized" | "updatedAt">) {
  const response = await fetch("/api/backups", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...getRequestHeaders(),
    },
    body: JSON.stringify(state),
  });

  if (!response.ok || !response.headers.get("content-type")?.includes("application/json")) {
    return null;
  }

  return (await response.json()) as { backup: SharedBackup; backups: SharedBackup[] };
}

export async function restoreSharedBackup(id: string) {
  const response = await fetch("/api/backups", {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      ...getRequestHeaders(),
    },
    body: JSON.stringify({ id }),
  });

  if (!response.ok || !response.headers.get("content-type")?.includes("application/json")) {
    return null;
  }

  return (await response.json()) as { state: SharedState; backups: SharedBackup[] };
}

export async function deleteSharedBackup(id: string) {
  const response = await fetch("/api/backups", {
    method: "DELETE",
    headers: {
      "Content-Type": "application/json",
      ...getRequestHeaders(),
    },
    body: JSON.stringify({ id }),
  });

  if (!response.ok || !response.headers.get("content-type")?.includes("application/json")) {
    return null;
  }

  return (await response.json()) as { backups: SharedBackup[] };
}
