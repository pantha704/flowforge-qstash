// TypeScript interfaces derived from Prisma schema
// These match the exact field names from schema.prisma

export interface User {
  id: number;
  email: string;
  name: string | null;
  createdAt?: string;
  updatedAt?: string;
}

export interface AvailableTrigger {
  id: string;
  name: string;
}

export interface AvailableAction {
  id: string;
  name: string;
}

export interface Trigger {
  id: string;
  zapId: string;
  availableTriggersId: string;
  payload: Record<string, unknown>;
  type: AvailableTrigger;
  createdAt?: string;
  updatedAt?: string;
}

export interface Action {
  id: string;
  zapId: string;
  actionId: string;
  sortingOrder: number;
  metadata: Record<string, unknown>;
  type: AvailableAction;
}

export interface Zap {
  id: string;
  triggerId: string;
  userId: number;
  trigger: Trigger | null;
  actions: Action[];
  user?: Pick<User, "id" | "email" | "name">;
  createdAt?: string;
  updatedAt?: string;
  isActive?: boolean; // Enable/disable toggle
  maxRuns?: number; // -1 = forever, 1+ = limit
  _count?: { ZapRuns: number };
}

export interface ZapRun {
  id: string;
  zapId: string;
  metadata: Record<string, unknown>;
}

// Zap builder state types
export interface ZapBuilderAction {
  id: string; // temporary ID for UI
  availableAction: AvailableAction;
  actionMetadata: Record<string, unknown>;
}

export interface ZapBuilderState {
  selectedTrigger: AvailableTrigger | null;
  triggerMetadata: Record<string, unknown>;
  actions: ZapBuilderAction[];
}

// API response types
export interface ApiResponse<T> {
  success: boolean;
  error?: string;
  message?: string;
  data?: T;
}

export interface ZapsResponse {
  success: boolean;
  zaps: Zap[];
  error?: string;
}

export interface ZapResponse {
  success: boolean;
  zap: Zap;
  error?: string;
}

export interface AvailableTriggersResponse {
  success: boolean;
  availableTriggers: AvailableTrigger[];
  error?: string;
}

export interface AvailableActionsResponse {
  success: boolean;
  availableActions: AvailableAction[];
  error?: string;
}

export interface AuthResponse {
  token?: string;
  user?: {
    id: number;
    email: string;
    name: string | null;
  };
  error?: string;
}
