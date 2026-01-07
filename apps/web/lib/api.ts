import type {
  AuthResponse,
  AvailableActionsResponse,
  AvailableTriggersResponse,
  ZapResponse,
  ZapsResponse,
} from "./types";

// QStash version: API is now at /api/* on the API app
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api";

class ApiClient {
  private getToken(): string | null {
    if (typeof window === "undefined") return null;
    return localStorage.getItem("token");
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const token = this.getToken();

    const headers: HeadersInit = {
      "Content-Type": "application/json",
      ...options.headers,
    };

    if (token) {
      (headers as Record<string, string>)["Authorization"] = `Bearer ${token}`;
    }

    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers,
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: "Request failed" }));
      throw new Error(error.error || "Request failed");
    }

    return response.json();
  }

  // Auth endpoints (now at /api/auth/*)
  async signup(name: string, email: string, password: string): Promise<AuthResponse> {
    return this.request<AuthResponse>("/auth/signup", {
      method: "POST",
      body: JSON.stringify({ name, email, password }),
    });
  }

  async signin(email: string, password: string): Promise<AuthResponse> {
    return this.request<AuthResponse>("/auth/signin", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    });
  }

  // Social login
  async getGoogleLoginUrl(): Promise<{ success: boolean; authUrl: string }> {
    return this.request("/auth/google");
  }

  async loginWithGoogle(code: string): Promise<AuthResponse> {
    return this.request<AuthResponse>("/auth/google", {
      method: "POST",
      body: JSON.stringify({ code }),
    });
  }

  async getGitHubLoginUrl(): Promise<{ success: boolean; authUrl: string }> {
    return this.request("/auth/github");
  }

  async loginWithGitHub(code: string): Promise<AuthResponse> {
    return this.request<AuthResponse>("/auth/github", {
      method: "POST",
      body: JSON.stringify({ code }),
    });
  }

  // Password reset
  async forgotPassword(email: string): Promise<{ success: boolean; message: string }> {
    return this.request("/auth/forgot-password", {
      method: "POST",
      body: JSON.stringify({ email }),
    });
  }

  async resetPassword(token: string, password: string): Promise<{ success: boolean; message: string }> {
    return this.request("/auth/reset-password", {
      method: "POST",
      body: JSON.stringify({ token, password }),
    });
  }

  // Trigger endpoints
  async getAvailableTriggers(): Promise<AvailableTriggersResponse> {
    return this.request<AvailableTriggersResponse>("/trigger/available");
  }

  // Action endpoints
  async getAvailableActions(): Promise<AvailableActionsResponse> {
    return this.request<AvailableActionsResponse>("/action/available");
  }

  // Zap endpoints
  async getZaps(): Promise<ZapsResponse> {
    return this.request<ZapsResponse>("/zap");
  }

  async getZap(id: string): Promise<ZapResponse> {
    return this.request<ZapResponse>(`/zap/${id}`);
  }

  async createZap(data: {
    triggerId: string;
    triggerMetadata: Record<string, unknown>;
    actions: Array<{
      availableActionId: string;
      actionMetadata: Record<string, unknown>;
    }>;
    maxRuns?: number; // -1 = forever, 1+ = limit
  }): Promise<{ zap: { id: string } }> {
    return this.request("/zap", {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  async deleteZap(id: string): Promise<{ success: boolean; message: string }> {
    return this.request(`/zap/${id}`, {
      method: "DELETE",
    });
  }

  async toggleZap(id: string, isActive: boolean): Promise<{ success: boolean; zap: { id: string; isActive: boolean } }> {
    return this.request(`/zap/${id}`, {
      method: "PATCH",
      body: JSON.stringify({ isActive }),
    });
  }

  // Run history
  async getRuns(userId: number, limit = 50): Promise<{
    success: boolean;
    runs: Array<{
      id: string;
      zapId: string;
      zapName: string;
      status: string;
      error: string | null;
      metadata: Record<string, unknown>;
      createdAt: string;
      completedAt: string | null;
    }>;
    total: number;
  }> {
    return this.request(`/runs?userId=${userId}&limit=${limit}`);
  }

  // OAuth Connections
  async getConnections(): Promise<{
    success: boolean;
    connections: Array<{
      id: string;
      provider: string;
      email: string | null;
      createdAt: string;
    }>;
  }> {
    return this.request("/connections");
  }

  async getGoogleAuthUrl(): Promise<{ success: boolean; authUrl: string }> {
    return this.request("/oauth/google");
  }

  async disconnectProvider(provider: string): Promise<{ success: boolean }> {
    return this.request(`/connections?provider=${provider}`, { method: "DELETE" });
  }
}

export const api = new ApiClient();
