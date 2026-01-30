"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import {
  AlertTriangleIcon,
  CopyIcon,
  DownloadIcon,
  EyeIcon,
  EyeOffIcon,
  FileUpIcon,
  KeyRoundIcon,
  PencilIcon,
  PlusIcon,
  SearchIcon,
  ShieldCheckIcon,
  Trash2Icon,
  UserIcon,
} from "lucide-react";

const STORAGE_KEY = "scrape-flow:credentials";
const ACTIVITY_KEY = "scrape-flow:credentials-activity";
const VAULT_KEY = "scrape-flow:credentials-vault";
const VAULT_META_KEY = "scrape-flow:credentials-vault-meta";
const SERVER_SYNC_KEY = "scrape-flow:credentials-server-sync";

type CredentialType = "API_KEY" | "TOKEN" | "PASSWORD" | "OTHER";
type EnvironmentScope = "DEV" | "PROD";
type AccessLevel = "OWNER" | "EDITOR" | "VIEWER";
type WorkflowScope = "ALL" | "CUSTOM";

type SharedMember = {
  id: string;
  name: string;
  email: string;
  role: AccessLevel;
};

type Credential = {
  id: string;
  name: string;
  type: CredentialType;
  value: string;
  description?: string;
  folder?: string;
  tags?: string[];
  environment: EnvironmentScope;
  access: AccessLevel;
  sharedWith?: SharedMember[];
  workflowScope?: WorkflowScope;
  workflowIds?: string[];
  rotationIntervalDays?: number;
  nextRotationAt?: string;
  usageCount?: number;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  lastUsedAt?: string;
  expiresAt?: string;
};

type ActivityLog = {
  id: string;
  action:
    | "CREATED"
    | "UPDATED"
    | "DELETED"
    | "COPIED"
    | "EXPORTED"
    | "IMPORTED"
    | "TESTED"
    | "ROTATION_REMINDER"
    | "SHARED"
    | "SYNCED";
  credentialName?: string;
  timestamp: string;
};

type VaultPayload = {
  ciphertext: string;
  iv: string;
  salt: string;
  iterations: number;
  updatedAt: string;
};

const typeLabels: Record<CredentialType, string> = {
  API_KEY: "API Key",
  TOKEN: "Token",
  PASSWORD: "Password",
  OTHER: "Other",
};

const typeBadgeClasses: Record<CredentialType, string> = {
  API_KEY: "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/30",
  TOKEN: "bg-green-500/10 text-green-600 dark:text-green-400 border-green-500/30",
  PASSWORD: "bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/30",
  OTHER: "bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/30",
};

const envBadgeClasses: Record<EnvironmentScope, string> = {
  DEV: "bg-yellow-500/10 text-yellow-700 dark:text-yellow-400 border-yellow-500/30",
  PROD: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/30",
};

const accessBadgeClasses: Record<AccessLevel, string> = {
  OWNER: "bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-500/30",
  EDITOR: "bg-sky-500/10 text-sky-600 dark:text-sky-400 border-sky-500/30",
  VIEWER: "bg-slate-500/10 text-slate-600 dark:text-slate-400 border-slate-500/30",
};

const folderPresets = [
  { name: "Payments", color: "bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/30" },
  { name: "AI", color: "bg-purple-500/10 text-purple-700 dark:text-purple-400 border-purple-500/30" },
  { name: "Database", color: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/30" },
  { name: "VCS", color: "bg-slate-500/10 text-slate-700 dark:text-slate-300 border-slate-500/30" },
  { name: "Notifications", color: "bg-sky-500/10 text-sky-700 dark:text-sky-300 border-sky-500/30" },
];

const tagPresets = [
  { name: "stripe", color: "bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/30" },
  { name: "openai", color: "bg-purple-500/10 text-purple-700 dark:text-purple-400 border-purple-500/30" },
  { name: "database", color: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/30" },
  { name: "github", color: "bg-slate-500/10 text-slate-700 dark:text-slate-300 border-slate-500/30" },
  { name: "prod", color: "bg-red-500/10 text-red-700 dark:text-red-400 border-red-500/30" },
  { name: "dev", color: "bg-yellow-500/10 text-yellow-700 dark:text-yellow-400 border-yellow-500/30" },
];

function loadCredentials(): Credential[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function saveCredentials(creds: Credential[]) {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(creds));
}

function loadActivity(): ActivityLog[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(ACTIVITY_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function saveActivity(logs: ActivityLog[]) {
  if (typeof window === "undefined") return;
  localStorage.setItem(ACTIVITY_KEY, JSON.stringify(logs.slice(0, 100)));
}

function loadVaultMeta() {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(VAULT_META_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as { enabled: boolean; lastSyncedAt?: string };
  } catch {
    return null;
  }
}

function saveVaultMeta(meta: { enabled: boolean; lastSyncedAt?: string }) {
  if (typeof window === "undefined") return;
  localStorage.setItem(VAULT_META_KEY, JSON.stringify(meta));
}

function loadVaultPayload(): VaultPayload | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(VAULT_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as VaultPayload;
  } catch {
    return null;
  }
}

function saveVaultPayload(payload: VaultPayload) {
  if (typeof window === "undefined") return;
  localStorage.setItem(VAULT_KEY, JSON.stringify(payload));
}

function maskValue(value: string) {
  if (!value) return "";
  const visible = value.slice(-4);
  return "•".repeat(Math.max(4, value.length - 4)) + visible;
}

function isExpiringSoon(expiresAt?: string) {
  if (!expiresAt) return false;
  const diff = new Date(expiresAt).getTime() - Date.now();
  return diff <= 7 * 24 * 60 * 60 * 1000 && diff > 0;
}

function isExpired(expiresAt?: string) {
  if (!expiresAt) return false;
  return new Date(expiresAt).getTime() <= Date.now();
}

function isRotationDue(nextRotationAt?: string) {
  if (!nextRotationAt) return false;
  return new Date(nextRotationAt).getTime() <= Date.now();
}

function isRotationSoon(nextRotationAt?: string) {
  if (!nextRotationAt) return false;
  const diff = new Date(nextRotationAt).getTime() - Date.now();
  return diff <= 7 * 24 * 60 * 60 * 1000 && diff > 0;
}

function arrayBufferToBase64(buffer: ArrayBuffer) {
  const bytes = new Uint8Array(buffer);
  let binary = "";
  bytes.forEach((b) => (binary += String.fromCharCode(b)));
  return btoa(binary);
}

function base64ToArrayBuffer(base64: string) {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes.buffer;
}

async function deriveKey(passphrase: string, salt: Uint8Array, iterations: number) {
  const enc = new TextEncoder();
  const saltBytes = new Uint8Array(salt);
  const keyMaterial = await crypto.subtle.importKey(
    "raw",
    enc.encode(passphrase),
    "PBKDF2",
    false,
    ["deriveKey"]
  );
  return crypto.subtle.deriveKey(
    {
      name: "PBKDF2",
      salt: saltBytes,
      iterations,
      hash: "SHA-256",
    },
    keyMaterial,
    { name: "AES-GCM", length: 256 },
    false,
    ["encrypt", "decrypt"]
  );
}

async function encryptCredentials(passphrase: string, credentials: Credential[]): Promise<VaultPayload> {
  const enc = new TextEncoder();
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const iterations = 120000;
  const key = await deriveKey(passphrase, salt, iterations);
  const plaintext = enc.encode(JSON.stringify(credentials));
  const ciphertext = await crypto.subtle.encrypt({ name: "AES-GCM", iv }, key, plaintext);
  return {
    ciphertext: arrayBufferToBase64(ciphertext),
    iv: arrayBufferToBase64(iv.buffer),
    salt: arrayBufferToBase64(salt.buffer),
    iterations,
    updatedAt: new Date().toISOString(),
  };
}

async function decryptCredentials(passphrase: string, payload: VaultPayload): Promise<Credential[]> {
  const dec = new TextDecoder();
  const iv = new Uint8Array(base64ToArrayBuffer(payload.iv));
  const salt = new Uint8Array(base64ToArrayBuffer(payload.salt));
  const key = await deriveKey(passphrase, salt, payload.iterations);
  const ciphertext = base64ToArrayBuffer(payload.ciphertext);
  const plaintext = await crypto.subtle.decrypt({ name: "AES-GCM", iv }, key, ciphertext);
  const decoded = dec.decode(plaintext);
  const parsed = JSON.parse(decoded);
  return Array.isArray(parsed) ? (parsed as Credential[]) : [];
}

export function CredentialsClient() {
  const [credentials, setCredentials] = useState<Credential[]>([]);
  const [activity, setActivity] = useState<ActivityLog[]>([]);
  const [search, setSearch] = useState("");
  const [filterType, setFilterType] = useState<CredentialType | "ALL">("ALL");
  const [filterEnv, setFilterEnv] = useState<EnvironmentScope | "ALL">("ALL");
  const [filterFolder, setFilterFolder] = useState<string | "ALL">("ALL");
  const [filterTag, setFilterTag] = useState<string | "ALL">("ALL");
  const [quickFilter, setQuickFilter] = useState<
    "ALL" | "EXPIRING" | "EXPIRED" | "RECENT" | "UNUSED" | "SHARED" | "OWNED" | "ROTATION_DUE"
  >("ALL");
  const [showValue, setShowValue] = useState<Record<string, boolean>>({});
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Credential | null>(null);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [vaultEnabled, setVaultEnabled] = useState(false);
  const [vaultLocked, setVaultLocked] = useState(false);
  const [vaultPassphrase, setVaultPassphrase] = useState("");
  const [vaultError, setVaultError] = useState("");
  const [syncEnabled, setSyncEnabled] = useState(false);
  const [lastSyncedAt, setLastSyncedAt] = useState<string | null>(null);

  const [shareName, setShareName] = useState("");
  const [shareEmail, setShareEmail] = useState("");
  const [shareRole, setShareRole] = useState<AccessLevel>("VIEWER");

  const [name, setName] = useState("");
  const [type, setType] = useState<CredentialType>("API_KEY");
  const [value, setValue] = useState("");
  const [description, setDescription] = useState("");
  const [folder, setFolder] = useState("");
  const [tags, setTags] = useState("");
  const [environment, setEnvironment] = useState<EnvironmentScope>("DEV");
  const [access, setAccess] = useState<AccessLevel>("OWNER");
  const [expiresAt, setExpiresAt] = useState("");
  const [rotationIntervalDays, setRotationIntervalDays] = useState<string>("");
  const [workflowScope, setWorkflowScope] = useState<WorkflowScope>("ALL");
  const [workflowIds, setWorkflowIds] = useState<string[]>([]);
  const [workflowInput, setWorkflowInput] = useState("");
  const [sharedWith, setSharedWith] = useState<SharedMember[]>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const meta = loadVaultMeta();
    const vaultPayload = loadVaultPayload();
    if (meta?.enabled && vaultPayload) {
      setVaultEnabled(true);
      setVaultLocked(true);
      setLastSyncedAt(meta.lastSyncedAt ?? null);
    } else {
      let loaded = loadCredentials();

      // Load example credentials if none exist
      if (loaded.length === 0) {
        const now = new Date().toISOString();
        const exampleCredentials: Credential[] = [
          {
            id: "example-1",
            name: "Stripe API Key",
            type: "API_KEY",
            value: "sk_test_XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX",
            description: "Stripe test API key for payment processing",
            folder: "Payments",
            tags: ["stripe", "payment", "test"],
            environment: "DEV",
            access: "OWNER",
            workflowScope: "ALL",
            workflowIds: [],
            rotationIntervalDays: 90,
            nextRotationAt: new Date(Date.now() + 90 * 86400000).toISOString(),
            usageCount: 3,
            sharedWith: [
              { id: "member-1", name: "Alex Johnson", email: "alex@team.dev", role: "EDITOR" },
            ],
            createdBy: "system",
            createdAt: now,
            updatedAt: now,
          },
          {
            id: "example-2",
            name: "OpenAI API Key",
            type: "API_KEY",
            value: "sk-proj-XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX",
            description: "OpenAI API key for AI features",
            folder: "AI",
            tags: ["openai", "ai", "dev"],
            environment: "DEV",
            access: "OWNER",
            workflowScope: "CUSTOM",
            workflowIds: ["workflow-ai-summarize", "workflow-ai-enrich"],
            rotationIntervalDays: 60,
            nextRotationAt: new Date(Date.now() + 60 * 86400000).toISOString(),
            usageCount: 12,
            createdBy: "system",
            createdAt: now,
            updatedAt: now,
          },
          {
            id: "example-3",
            name: "Database Password",
            type: "PASSWORD",
            value: "postgres_dev_password_example",
            description: "PostgreSQL development database password",
            folder: "Database",
            tags: ["postgres", "database", "dev"],
            environment: "DEV",
            access: "OWNER",
            workflowScope: "ALL",
            workflowIds: [],
            rotationIntervalDays: 120,
            nextRotationAt: new Date(Date.now() + 120 * 86400000).toISOString(),
            usageCount: 5,
            createdBy: "system",
            createdAt: now,
            updatedAt: now,
          },
          {
            id: "example-4",
            name: "GitHub Personal Token",
            type: "TOKEN",
            value: "ghp_XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX",
            description: "GitHub personal access token for API access",
            folder: "VCS",
            tags: ["github", "vcs", "automation"],
            environment: "DEV",
            access: "OWNER",
            workflowScope: "CUSTOM",
            workflowIds: ["workflow-sync-repo"],
            rotationIntervalDays: 180,
            nextRotationAt: new Date(Date.now() + 180 * 86400000).toISOString(),
            usageCount: 2,
            createdBy: "system",
            createdAt: now,
            updatedAt: now,
          },
        ];
        saveCredentials(exampleCredentials);
        loaded = exampleCredentials;
      }

      setCredentials(loaded);
    }

    setActivity(loadActivity());
    const syncFlag = typeof window !== "undefined" && localStorage.getItem(SERVER_SYNC_KEY) === "true";
    setSyncEnabled(syncFlag);
  }, []);

  useEffect(() => {
    if (!syncEnabled) return;
    const existingPayload = loadVaultPayload();
    if (existingPayload) return;
    const loadFromServer = async () => {
      try {
        const response = await fetch("/api/credentials");
        const data = await response.json();
        if (data?.data) {
          const payload = JSON.parse(data.data) as VaultPayload;
          saveVaultPayload(payload);
          saveVaultMeta({ enabled: true, lastSyncedAt: payload.updatedAt });
          setVaultEnabled(true);
          setVaultLocked(true);
          setLastSyncedAt(payload.updatedAt || null);
        }
      } catch {
        // ignore sync errors on load
      }
    };
    void loadFromServer();
  }, [syncEnabled]);

  useEffect(() => {
    if (!vaultEnabled) {
      saveCredentials(credentials);
    }
  }, [credentials, vaultEnabled]);

  useEffect(() => {
    if (!vaultEnabled || vaultLocked) return;
    const encryptAndPersist = async () => {
      try {
        const payload = await encryptCredentials(vaultPassphrase, credentials);
        saveVaultPayload(payload);
        saveVaultMeta({ enabled: true, lastSyncedAt: lastSyncedAt ?? undefined });
        if (syncEnabled) {
          await fetch("/api/credentials", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
          });
          const syncedAt = new Date().toISOString();
          setLastSyncedAt(syncedAt);
          saveVaultMeta({ enabled: true, lastSyncedAt: syncedAt });
          logActivity({
            id: `${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
            action: "SYNCED",
            timestamp: syncedAt,
          });
        }
      } catch (error) {
        toast.error("Vault encryption failed", {
          description: error instanceof Error ? error.message : "Unknown error",
        });
      }
    };
    void encryptAndPersist();
  }, [credentials, vaultEnabled, vaultLocked, vaultPassphrase, syncEnabled, lastSyncedAt]);

  useEffect(() => {
    saveActivity(activity);
  }, [activity]);

  const folders = useMemo(() => {
    const set = new Set<string>();
    credentials.forEach((c) => c.folder && set.add(c.folder));
    return Array.from(set).sort();
  }, [credentials]);

  const tagList = useMemo(() => {
    const set = new Set<string>();
    credentials.forEach((c) => (c.tags || []).forEach((t) => set.add(t)));
    return Array.from(set).sort();
  }, [credentials]);

  const filtered = useMemo(() => {
    return credentials.filter((c) => {
      const matchesSearch =
        c.name.toLowerCase().includes(search.toLowerCase()) ||
        (c.description || "").toLowerCase().includes(search.toLowerCase()) ||
        (c.folder || "").toLowerCase().includes(search.toLowerCase()) ||
        (c.tags || []).some((t) => t.toLowerCase().includes(search.toLowerCase())) ||
        (c.sharedWith || []).some((m) =>
          `${m.name} ${m.email}`.toLowerCase().includes(search.toLowerCase())
        );
      const matchesType = filterType === "ALL" ? true : c.type === filterType;
      const matchesEnv = filterEnv === "ALL" ? true : c.environment === filterEnv;
      const matchesFolder = filterFolder === "ALL" ? true : c.folder === filterFolder;
      const matchesTag = filterTag === "ALL" ? true : (c.tags || []).includes(filterTag);
      const matchesQuick = (() => {
        switch (quickFilter) {
          case "EXPIRING":
            return isExpiringSoon(c.expiresAt);
          case "EXPIRED":
            return isExpired(c.expiresAt);
          case "RECENT":
            return c.lastUsedAt
              ? new Date(c.lastUsedAt).getTime() > Date.now() - 7 * 86400000
              : false;
          case "UNUSED":
            return !c.lastUsedAt;
          case "SHARED":
            return (c.sharedWith || []).length > 0;
          case "OWNED":
            return c.access === "OWNER";
          case "ROTATION_DUE":
            return isRotationDue(c.nextRotationAt) || isRotationSoon(c.nextRotationAt);
          default:
            return true;
        }
      })();
      return matchesSearch && matchesType && matchesEnv && matchesFolder && matchesTag && matchesQuick;
    });
  }, [credentials, search, filterType, filterEnv, filterFolder, filterTag, quickFilter]);

  const usageStats = useMemo(() => {
    const totalUsage = credentials.reduce((sum, c) => sum + (c.usageCount || 0), 0);
    const mostUsed = [...credentials].sort((a, b) => (b.usageCount || 0) - (a.usageCount || 0))[0];
    const recent = [...credentials]
      .filter((c) => c.lastUsedAt)
      .sort((a, b) =>
        new Date(b.lastUsedAt || 0).getTime() - new Date(a.lastUsedAt || 0).getTime()
      )[0];
    return { totalUsage, mostUsed, recent };
  }, [credentials]);

  const logActivity = (entry: ActivityLog) => {
    setActivity((prev) => [entry, ...prev]);
  };

  const openCreate = () => {
    setEditing(null);
    setName("");
    setType("API_KEY");
    setValue("");
    setDescription("");
    setFolder("");
    setTags("");
    setEnvironment("DEV");
    setAccess("OWNER");
    setExpiresAt("");
    setRotationIntervalDays("");
    setWorkflowScope("ALL");
    setWorkflowIds([]);
    setWorkflowInput("");
    setSharedWith([]);
    setShareName("");
    setShareEmail("");
    setShareRole("VIEWER");
    setErrors({});
    setDialogOpen(true);
  };

  const openEdit = (cred: Credential) => {
    setEditing(cred);
    setName(cred.name);
    setType(cred.type);
    setValue(cred.value);
    setDescription(cred.description || "");
    setFolder(cred.folder || "");
    setTags((cred.tags || []).join(", "));
    setEnvironment(cred.environment);
    setAccess(cred.access);
    setExpiresAt(cred.expiresAt ? cred.expiresAt.slice(0, 10) : "");
    setRotationIntervalDays(cred.rotationIntervalDays ? String(cred.rotationIntervalDays) : "");
    setWorkflowScope(cred.workflowScope || "ALL");
    setWorkflowIds(cred.workflowIds || []);
    setWorkflowInput("");
    setSharedWith(cred.sharedWith || []);
    setErrors({});
    setDialogOpen(true);
  };

  const validate = () => {
    const next: Record<string, string> = {};
    if (!name.trim()) next.name = "Name is required";
    if (!value.trim()) next.value = "Value is required";
    if (expiresAt && Number.isNaN(new Date(expiresAt).getTime())) {
      next.expiresAt = "Invalid date";
    }
    if (rotationIntervalDays && Number.isNaN(Number(rotationIntervalDays))) {
      next.rotationIntervalDays = "Rotation must be a number";
    }
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSave = () => {
    if (!validate()) return;

    const now = new Date().toISOString();
    const tagArray = tags
      .split(",")
      .map((t) => t.trim())
      .filter(Boolean);

    const rotationDays = rotationIntervalDays ? Number(rotationIntervalDays) : undefined;
    const nextRotationAt = rotationDays
      ? new Date(Date.now() + rotationDays * 86400000).toISOString()
      : undefined;

    if (editing) {
      setCredentials((prev) =>
        prev.map((c) =>
          c.id === editing.id
            ? {
                ...c,
                name: name.trim(),
                type,
                value: value.trim(),
                description: description.trim() || undefined,
                folder: folder.trim() || undefined,
                tags: tagArray.length ? tagArray : undefined,
                environment,
                access,
                sharedWith: sharedWith.length ? sharedWith : undefined,
                workflowScope,
                workflowIds: workflowScope === "CUSTOM" ? workflowIds : [],
                rotationIntervalDays: rotationDays,
                nextRotationAt,
                usageCount: c.usageCount || 0,
                expiresAt: expiresAt ? new Date(expiresAt).toISOString() : undefined,
                updatedAt: now,
              }
            : c
        )
      );
      logActivity({
        id: `${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        action: "UPDATED",
        credentialName: editing.name,
        timestamp: now,
      });
      toast.success("Credential updated");
    } else {
      const id = typeof crypto !== "undefined" && "randomUUID" in crypto
        ? crypto.randomUUID()
        : `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

      const newCred: Credential = {
        id,
        name: name.trim(),
        type,
        value: value.trim(),
        description: description.trim() || undefined,
        folder: folder.trim() || undefined,
        tags: tagArray.length ? tagArray : undefined,
        environment,
        access,
        sharedWith: sharedWith.length ? sharedWith : undefined,
        workflowScope,
        workflowIds: workflowScope === "CUSTOM" ? workflowIds : [],
        rotationIntervalDays: rotationDays,
        nextRotationAt,
        usageCount: 0,
        createdBy: "You",
        createdAt: now,
        updatedAt: now,
        expiresAt: expiresAt ? new Date(expiresAt).toISOString() : undefined,
      };

      setCredentials((prev) => [newCred, ...prev]);
      logActivity({
        id: `${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        action: "CREATED",
        credentialName: newCred.name,
        timestamp: now,
      });
      toast.success("Credential added");
    }

    setDialogOpen(false);
  };

  const handleDelete = (cred: Credential) => {
    setCredentials((prev) => prev.filter((c) => c.id !== cred.id));
    logActivity({
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      action: "DELETED",
      credentialName: cred.name,
      timestamp: new Date().toISOString(),
    });
    toast.success("Credential deleted");
  };

  const handleCopy = async (cred: Credential) => {
    try {
      await navigator.clipboard.writeText(cred.value);
      const now = new Date().toISOString();
      setCredentials((prev) =>
        prev.map((c) =>
          c.id === cred.id
            ? { ...c, lastUsedAt: now, usageCount: (c.usageCount || 0) + 1 }
            : c
        )
      );
      logActivity({
        id: `${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        action: "COPIED",
        credentialName: cred.name,
        timestamp: new Date().toISOString(),
      });
      toast.success("Copied to clipboard");
    } catch {
      toast.error("Clipboard blocked", {
        description: "Copy manually from the value field.",
      });
    }
  };

  const handleExport = () => {
    const data = selectedIds.length
      ? credentials.filter((c) => selectedIds.includes(c.id))
      : credentials;
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `credentials-export-${new Date().toISOString().slice(0, 10)}.json`;
    link.click();
    URL.revokeObjectURL(url);
    logActivity({
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      action: "EXPORTED",
      timestamp: new Date().toISOString(),
    });
    toast.success("Export complete");
  };

  const handleExportActivity = () => {
    const blob = new Blob([JSON.stringify(activity, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `credentials-activity-${new Date().toISOString().slice(0, 10)}.json`;
    link.click();
    URL.revokeObjectURL(url);
    toast.success("Activity exported");
  };

  const handleImport = async (file: File) => {
    try {
      const text = await file.text();
      const parsed = JSON.parse(text);
      if (!Array.isArray(parsed)) throw new Error("Invalid file format");

      const now = new Date().toISOString();
      const imported: Credential[] = parsed.map((item) => ({
        id: item.id || `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        name: String(item.name || "Imported Credential"),
        type: (item.type as CredentialType) || "OTHER",
        value: String(item.value || ""),
        description: item.description,
        folder: item.folder,
        tags: Array.isArray(item.tags) ? item.tags : undefined,
        environment: (item.environment as EnvironmentScope) || "DEV",
        access: (item.access as AccessLevel) || "OWNER",
        sharedWith: Array.isArray(item.sharedWith) ? item.sharedWith : undefined,
        workflowScope: (item.workflowScope as WorkflowScope) || "ALL",
        workflowIds: Array.isArray(item.workflowIds) ? item.workflowIds : [],
        rotationIntervalDays: typeof item.rotationIntervalDays === "number" ? item.rotationIntervalDays : undefined,
        nextRotationAt: item.nextRotationAt,
        usageCount: typeof item.usageCount === "number" ? item.usageCount : 0,
        createdBy: item.createdBy || "You",
        createdAt: item.createdAt || now,
        updatedAt: item.updatedAt || now,
        lastUsedAt: item.lastUsedAt,
        expiresAt: item.expiresAt,
      }));

      setCredentials((prev) => [...imported, ...prev]);
      logActivity({
        id: `${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        action: "IMPORTED",
        timestamp: now,
      });
      toast.success("Import complete");
    } catch (error) {
      toast.error("Import failed", {
        description: error instanceof Error ? error.message : "Invalid file",
      });
    }
  };

  const handleBulkDelete = () => {
    setCredentials((prev) => prev.filter((c) => !selectedIds.includes(c.id)));
    setSelectedIds([]);
    toast.success("Selected credentials deleted");
  };

  const handleTestCredential = async (cred: Credential) => {
    let credentialType = "";

    if (cred.name.toLowerCase().includes("stripe")) {
      credentialType = "STRIPE";
    } else if (cred.name.toLowerCase().includes("openai")) {
      credentialType = "OPENAI";
    } else if (cred.name.toLowerCase().includes("github")) {
      credentialType = "GITHUB";
    } else {
      // Basic local validation for other types
      const value = cred.value.trim();
      const ok = value.length >= 8;
      await new Promise((resolve) => setTimeout(resolve, 500));
      if (ok) {
        toast.success("Credential format looks valid");
      } else {
        toast.error("Credential appears too short");
      }
      const now = new Date().toISOString();
      setCredentials((prev) =>
        prev.map((c) =>
          c.id === cred.id
            ? { ...c, lastUsedAt: now, usageCount: (c.usageCount || 0) + 1 }
            : c
        )
      );
      logActivity({
        id: `${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        action: "TESTED",
        credentialName: cred.name,
        timestamp: now,
      });
      return;
    }

    try {
      const response = await fetch("/api/credentials/validate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          credentialType,
          value: cred.value,
        }),
      });

      const data = await response.json();

      if (data.valid) {
        toast.success(data.message);
      } else {
        toast.error(data.error || "Credential test failed");
      }
    } catch (error) {
      toast.error("Test failed", {
        description: error instanceof Error ? error.message : "Network error",
      });
    }

    const now = new Date().toISOString();
    setCredentials((prev) =>
      prev.map((c) =>
        c.id === cred.id
          ? { ...c, lastUsedAt: now, usageCount: (c.usageCount || 0) + 1 }
          : c
      )
    );
    logActivity({
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      action: "TESTED",
      credentialName: cred.name,
      timestamp: now,
    });
  };

  const handleEnableVault = async () => {
    setVaultError("");
    if (!vaultPassphrase.trim()) {
      setVaultError("Passphrase is required");
      return;
    }
    try {
      const payload = await encryptCredentials(vaultPassphrase, credentials);
      saveVaultPayload(payload);
      saveVaultMeta({ enabled: true, lastSyncedAt: lastSyncedAt ?? undefined });
      setVaultEnabled(true);
      setVaultLocked(false);
      localStorage.removeItem(STORAGE_KEY);
      toast.success("Vault enabled");
    } catch (error) {
      setVaultError(error instanceof Error ? error.message : "Vault encryption failed");
    }
  };

  const handleUnlockVault = async () => {
    setVaultError("");
    const payload = loadVaultPayload();
    if (!payload) {
      setVaultError("Vault data missing");
      return;
    }
    try {
      const decrypted = await decryptCredentials(vaultPassphrase, payload);
      setCredentials(decrypted);
      setVaultEnabled(true);
      setVaultLocked(false);
      toast.success("Vault unlocked");
    } catch (error) {
      setVaultError("Invalid passphrase");
    }
  };

  const handleLockVault = () => {
    setCredentials([]);
    setVaultLocked(true);
    toast.success("Vault locked");
  };

  const handleSyncToggle = (enabled: boolean) => {
    setSyncEnabled(enabled);
    if (typeof window !== "undefined") {
      localStorage.setItem(SERVER_SYNC_KEY, enabled ? "true" : "false");
    }
  };

  const handleSyncNow = async () => {
    try {
      const response = await fetch("/api/credentials");
      const data = await response.json();
      if (data?.data) {
        const payload = JSON.parse(data.data) as VaultPayload;
        saveVaultPayload(payload);
        setVaultEnabled(true);
        setVaultLocked(true);
        setLastSyncedAt(payload.updatedAt || new Date().toISOString());
        saveVaultMeta({ enabled: true, lastSyncedAt: payload.updatedAt });
        toast.success("Vault synced from server");
      } else {
        toast.message("No server vault found");
      }
    } catch (error) {
      toast.error("Sync failed", {
        description: error instanceof Error ? error.message : "Unknown error",
      });
    }
  };

  const handleAddWorkflow = () => {
    const trimmed = workflowInput.trim();
    if (!trimmed) return;
    if (!workflowIds.includes(trimmed)) {
      setWorkflowIds((prev) => [...prev, trimmed]);
    }
    setWorkflowInput("");
  };

  const handleAddShare = () => {
    if (!shareName.trim() || !shareEmail.trim()) return;
    setSharedWith((prev) => [
      ...prev,
      {
        id: `${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        name: shareName.trim(),
        email: shareEmail.trim(),
        role: shareRole,
      },
    ]);
    setShareName("");
    setShareEmail("");
    setShareRole("VIEWER");
    logActivity({
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      action: "SHARED",
      timestamp: new Date().toISOString(),
    });
  };

  const toggleSelectAll = () => {
    if (selectedIds.length === filtered.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(filtered.map((c) => c.id));
    }
  };

  const canEdit = (cred: Credential) => cred.access !== "VIEWER";

  return (
    <div className="grid gap-6 lg:grid-cols-[300px_1fr]">
      <div className="space-y-4">
        <Card className="h-fit">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Vault & Sync</CardTitle>
            <CardDescription>Encrypt and sync credentials securely</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Status</span>
              <Badge variant="outline">
                {vaultEnabled ? (vaultLocked ? "Locked" : "Unlocked") : "Disabled"}
              </Badge>
            </div>

            <div className="space-y-2">
              <Label htmlFor="vault-passphrase">Vault passphrase</Label>
              <Input
                id="vault-passphrase"
                type="password"
                placeholder="Enter passphrase"
                value={vaultPassphrase}
                onChange={(e) => setVaultPassphrase(e.target.value)}
              />
              {vaultError && <p className="text-xs text-red-500">{vaultError}</p>}
            </div>

            <div className="flex flex-wrap gap-2">
              {!vaultEnabled ? (
                <Button size="sm" onClick={handleEnableVault}>
                  Enable Vault
                </Button>
              ) : vaultLocked ? (
                <Button size="sm" onClick={handleUnlockVault}>
                  Unlock Vault
                </Button>
              ) : (
                <Button variant="outline" size="sm" onClick={handleLockVault}>
                  Lock Vault
                </Button>
              )}
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleSyncToggle(!syncEnabled)}
              >
                {syncEnabled ? "Sync On" : "Sync Off"}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleSyncNow}
                disabled={!syncEnabled}
              >
                Sync Now
              </Button>
            </div>

            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>Server sync</span>
              <span>{syncEnabled ? "Enabled" : "Disabled"}</span>
            </div>
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>Last synced</span>
              <span>{lastSyncedAt ? new Date(lastSyncedAt).toLocaleString("en-US", { dateStyle: "medium", timeStyle: "short" }) : "Never"}</span>
            </div>
          </CardContent>
        </Card>

        <Card className="h-fit">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Filters</CardTitle>
            <CardDescription>Folders, tags, and environments</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
          <div>
            <Label className="text-xs uppercase text-muted-foreground">Environment</Label>
            <div className="mt-2 flex flex-wrap gap-2">
              {["ALL", "DEV", "PROD"].map((env) => (
                <Button
                  key={env}
                  variant={filterEnv === env ? "default" : "outline"}
                  size="sm"
                  onClick={() => setFilterEnv(env as EnvironmentScope | "ALL")}
                >
                  {env}
                </Button>
              ))}
            </div>
          </div>

          <div>
            <Label className="text-xs uppercase text-muted-foreground">Folders</Label>
            <div className="mt-2 flex flex-col gap-1">
              <Button
                variant={filterFolder === "ALL" ? "default" : "ghost"}
                size="sm"
                className="justify-start"
                onClick={() => setFilterFolder("ALL")}
              >
                All Folders
              </Button>
              {folders.map((f) => (
                <Button
                  key={f}
                  variant={filterFolder === f ? "default" : "ghost"}
                  size="sm"
                  className="justify-start"
                  onClick={() => setFilterFolder(f)}
                >
                  {f}
                </Button>
              ))}
            </div>
          </div>

          <div>
            <Label className="text-xs uppercase text-muted-foreground">Tags</Label>
            <div className="mt-2 flex flex-wrap gap-2">
              <Button
                variant={filterTag === "ALL" ? "default" : "outline"}
                size="sm"
                onClick={() => setFilterTag("ALL")}
              >
                All
              </Button>
              {tagList.map((t) => (
                <Button
                  key={t}
                  variant={filterTag === t ? "default" : "outline"}
                  size="sm"
                  onClick={() => setFilterTag(t)}
                >
                  {t}
                </Button>
              ))}
            </div>
          </div>

          <div>
            <Label className="text-xs uppercase text-muted-foreground">Activity</Label>
            <div className="mt-2 space-y-2">
              {activity.length === 0 ? (
                <p className="text-xs text-muted-foreground">No recent activity</p>
              ) : (
                activity.slice(0, 6).map((log) => (
                  <div key={log.id} className="text-xs text-muted-foreground">
                    <span className="font-medium text-foreground">
                      {log.action}
                    </span>
                    {log.credentialName ? ` • ${log.credentialName}` : ""}
                    <div>
                      {new Date(log.timestamp).toLocaleString("en-US", {
                        dateStyle: "medium",
                        timeStyle: "short",
                      })}
                    </div>
                  </div>
                ))
              )}
            </div>
            <div className="pt-2">
              <Button variant="outline" size="sm" className="w-full" onClick={handleExportActivity}>
                Export Activity
              </Button>
            </div>
          </div>
        </CardContent>
        </Card>

        <Card className="h-fit">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Usage Analytics</CardTitle>
            <CardDescription>Last used and frequency</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Total usage</span>
              <span className="font-medium">{usageStats.totalUsage}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Most used</span>
              <span className="font-medium">
                {usageStats.mostUsed ? usageStats.mostUsed.name : "-"}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Last used</span>
              <span className="font-medium">
                {usageStats.recent?.lastUsedAt
                  ? new Date(usageStats.recent.lastUsedAt).toLocaleDateString("en-US")
                  : "-"}
              </span>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="space-y-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-wrap items-center gap-2">
            <Button onClick={openCreate} className="gap-2">
              <PlusIcon size={16} />
              Add Credential
            </Button>
            <Button variant="outline" className="gap-2" onClick={handleExport}>
              <DownloadIcon size={16} />
              Export {selectedIds.length ? "Selected" : "All"}
            </Button>
            <Button
              variant="outline"
              className="gap-2"
              onClick={() => fileInputRef.current?.click()}
            >
              <FileUpIcon size={16} />
              Import
            </Button>
            <input
              ref={fileInputRef}
              type="file"
              accept="application/json"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) handleImport(file);
                e.currentTarget.value = "";
              }}
            />
            <Badge variant="outline" className="px-2.5 py-1">
              {credentials.length} total
            </Badge>
          </div>

          <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row">
            <div className="relative w-full sm:w-64">
              <SearchIcon size={16} className="absolute left-3 top-3 text-muted-foreground" />
              <Input
                className="pl-9"
                placeholder="Search credentials..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <Select value={filterType} onValueChange={(v) => setFilterType(v as CredentialType | "ALL")}>
              <SelectTrigger className="w-full sm:w-[160px]">
                <SelectValue placeholder="Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All Types</SelectItem>
                <SelectItem value="API_KEY">API Key</SelectItem>
                <SelectItem value="TOKEN">Token</SelectItem>
                <SelectItem value="PASSWORD">Password</SelectItem>
                <SelectItem value="OTHER">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          {[
            { key: "ALL", label: "All" },
            { key: "EXPIRING", label: "Expiring Soon" },
            { key: "EXPIRED", label: "Expired" },
            { key: "RECENT", label: "Recently Used" },
            { key: "UNUSED", label: "Unused" },
            { key: "SHARED", label: "Shared" },
            { key: "OWNED", label: "Owned" },
            { key: "ROTATION_DUE", label: "Rotation Due" },
          ].map((item) => (
            <Button
              key={item.key}
              variant={quickFilter === item.key ? "default" : "outline"}
              size="sm"
              onClick={() => setQuickFilter(item.key as typeof quickFilter)}
            >
              {item.label}
            </Button>
          ))}
        </div>

        {vaultEnabled && vaultLocked ? (
          <Card className="border-dashed bg-muted/40">
            <CardContent className="py-10 text-center">
              <p className="text-sm text-muted-foreground">Vault is locked. Unlock to view credentials.</p>
              <div className="mt-3 flex justify-center">
                <Button size="sm" onClick={handleUnlockVault}>Unlock Vault</Button>
              </div>
            </CardContent>
          </Card>
        ) : (
          <>
            {selectedIds.length > 0 && (
              <Card className="border-dashed bg-muted/40">
                <CardContent className="flex items-center justify-between gap-2 py-3">
                  <span className="text-sm">{selectedIds.length} selected</span>
                  <div className="flex items-center gap-2">
                    <Button variant="destructive" size="sm" onClick={handleBulkDelete}>
                      Delete Selected
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            {filtered.length === 0 ? (
              <div className="flex flex-col gap-4 h-[360px] items-center justify-center text-center">
                <div className="rounded-full bg-accent w-20 h-20 flex items-center justify-center">
                  <KeyRoundIcon size={40} className="stroke-primary" />
                </div>
                <div className="space-y-1">
                  <p className="font-bold">No credentials found</p>
                  <p className="text-sm text-muted-foreground">
                    Add credentials to connect external services
                  </p>
                </div>
                <Button onClick={openCreate} className="gap-2">
                  <PlusIcon size={16} />
                  Add Your First Credential
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Checkbox
                    checked={selectedIds.length === filtered.length}
                    onCheckedChange={toggleSelectAll}
                  />
                  <span>Select all</span>
                </div>
                <div className="grid gap-4 md:grid-cols-2">
                  {filtered.map((cred) => (
                    <Card key={cred.id} className="group border-2">
                      <CardHeader className="pb-3">
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex items-start gap-3">
                            <Checkbox
                              checked={selectedIds.includes(cred.id)}
                              onCheckedChange={(checked) => {
                                setSelectedIds((prev) =>
                                  checked
                                    ? [...prev, cred.id]
                                    : prev.filter((id) => id !== cred.id)
                                );
                              }}
                            />
                            <div>
                              <CardTitle className="text-lg flex items-center gap-2">
                                {cred.name}
                              </CardTitle>
                              <CardDescription className="mt-1">
                                {cred.description || "No description"}
                              </CardDescription>
                            </div>
                          </div>
                          <div className="flex flex-col gap-2 items-end">
                            <Badge className={`${typeBadgeClasses[cred.type]} border font-medium px-2.5 py-1`}>
                              {typeLabels[cred.type]}
                            </Badge>
                            <Badge className={`${envBadgeClasses[cred.environment]} border font-medium px-2.5 py-1`}>
                              {cred.environment}
                            </Badge>
                            <Badge className={`${accessBadgeClasses[cred.access]} border font-medium px-2.5 py-1`}>
                              {cred.access}
                            </Badge>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        <div className="flex flex-wrap gap-2">
                          {cred.folder && (
                            <Badge
                              className={
                                folderPresets.find((p) => p.name === cred.folder)?.color ||
                                "bg-muted/60 text-muted-foreground border-muted"
                              }
                            >
                              📁 {cred.folder}
                            </Badge>
                          )}
                          {(cred.tags || []).map((t) => (
                            <Badge
                              key={t}
                              className={
                                tagPresets.find((p) => p.name === t)?.color ||
                                "bg-muted/60 text-muted-foreground border-muted"
                              }
                            >
                              #{t}
                            </Badge>
                          ))}
                          {isExpired(cred.expiresAt) && (
                            <Badge variant="destructive" className="gap-1">
                              <AlertTriangleIcon size={12} /> Expired
                            </Badge>
                          )}
                          {isExpiringSoon(cred.expiresAt) && !isExpired(cred.expiresAt) && (
                            <Badge className="bg-orange-500/10 text-orange-600 border-orange-500/30 gap-1">
                              <AlertTriangleIcon size={12} /> Expiring Soon
                            </Badge>
                          )}
                          {isRotationDue(cred.nextRotationAt) && (
                            <Badge variant="destructive" className="gap-1">
                              <AlertTriangleIcon size={12} /> Rotation Due
                            </Badge>
                          )}
                          {isRotationSoon(cred.nextRotationAt) && !isRotationDue(cred.nextRotationAt) && (
                            <Badge className="bg-yellow-500/10 text-yellow-700 border-yellow-500/30 gap-1">
                              <AlertTriangleIcon size={12} /> Rotate Soon
                            </Badge>
                          )}
                        </div>

                        <div className="flex items-center justify-between gap-2 rounded-md border bg-muted/30 px-3 py-2">
                          <span className="text-sm font-mono break-all">
                            {showValue[cred.id] ? cred.value : maskValue(cred.value)}
                          </span>
                          <div className="flex items-center gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() =>
                                setShowValue((prev) => ({
                                  ...prev,
                                  [cred.id]: !prev[cred.id],
                                }))
                              }
                            >
                              {showValue[cred.id] ? <EyeOffIcon size={16} /> : <EyeIcon size={16} />}
                            </Button>
                            <Button variant="ghost" size="icon" onClick={() => handleCopy(cred)}>
                              <CopyIcon size={16} />
                            </Button>
                          </div>
                        </div>

                        <div className="grid gap-2 text-xs text-muted-foreground">
                          <div className="flex items-center gap-2">
                            <UserIcon size={12} /> Created by {cred.createdBy}
                          </div>
                          <div className="flex items-center gap-2">
                            <ShieldCheckIcon size={12} /> Last used {cred.lastUsedAt ? new Date(cred.lastUsedAt).toLocaleString("en-US", { dateStyle: "medium", timeStyle: "short" }) : "Never"}
                          </div>
                          <div className="flex items-center gap-2">
                            <KeyRoundIcon size={12} /> Usage {cred.usageCount ?? 0}
                          </div>
                          <div className="flex items-center gap-2">
                            <KeyRoundIcon size={12} /> Updated {new Date(cred.updatedAt).toLocaleString("en-US", { dateStyle: "medium", timeStyle: "short" })}
                          </div>
                          <div className="flex items-center gap-2">
                            <ShieldCheckIcon size={12} /> Workflow access {cred.workflowScope === "CUSTOM" ? "Scoped" : "All"}
                          </div>
                        </div>

                        {(cred.workflowIds || []).length > 0 && (
                          <div className="flex flex-wrap gap-2 text-xs">
                            {(cred.workflowIds || []).map((id) => (
                              <Badge key={id} variant="outline">
                                {id}
                              </Badge>
                            ))}
                          </div>
                        )}

                        {(cred.sharedWith || []).length > 0 && (
                          <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
                            {(cred.sharedWith || []).map((member) => (
                              <Badge key={member.id} variant="secondary">
                                {member.name} • {member.role}
                              </Badge>
                            ))}
                          </div>
                        )}

                        <div className="flex items-center gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            className="gap-1"
                            onClick={() => handleTestCredential(cred)}
                          >
                            <ShieldCheckIcon size={14} />
                            Test
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            className="gap-1"
                            onClick={() => openEdit(cred)}
                            disabled={!canEdit(cred)}
                          >
                            <PencilIcon size={14} />
                            Edit
                          </Button>
                          <Button
                            variant="destructive"
                            size="sm"
                            className="gap-1"
                            onClick={() => handleDelete(cred)}
                            disabled={!canEdit(cred)}
                          >
                            <Trash2Icon size={14} />
                            Delete
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            )}
          </>
        )}

        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogContent className="sm:max-w-[560px]">
            <DialogHeader>
              <DialogTitle>{editing ? "Edit Credential" : "Add Credential"}</DialogTitle>
              <DialogDescription>
                Store keys securely for quick access while building workflows.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="cred-name">Name</Label>
                  <Input
                    id="cred-name"
                    placeholder="e.g. Stripe API Key"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                  />
                  {errors.name && <p className="text-xs text-red-500">{errors.name}</p>}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="cred-type">Type</Label>
                  <Select value={type} onValueChange={(v) => setType(v as CredentialType)}>
                    <SelectTrigger id="cred-type">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="API_KEY">API Key</SelectItem>
                      <SelectItem value="TOKEN">Token</SelectItem>
                      <SelectItem value="PASSWORD">Password</SelectItem>
                      <SelectItem value="OTHER">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="cred-value">Value</Label>
                <Input
                  id="cred-value"
                  placeholder="Enter secret value"
                  value={value}
                  onChange={(e) => setValue(e.target.value)}
                  type="password"
                />
                {errors.value && <p className="text-xs text-red-500">{errors.value}</p>}
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="cred-folder">Folder</Label>
                  <Input
                    id="cred-folder"
                    placeholder="e.g. Billing"
                    value={folder}
                    onChange={(e) => setFolder(e.target.value)}
                  />
                  <div className="flex flex-wrap gap-2">
                    {folderPresets.map((preset) => (
                      <Button
                        key={preset.name}
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => setFolder(preset.name)}
                      >
                        {preset.name}
                      </Button>
                    ))}
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="cred-tags">Tags</Label>
                  <Input
                    id="cred-tags"
                    placeholder="e.g. stripe, prod"
                    value={tags}
                    onChange={(e) => setTags(e.target.value)}
                  />
                  <div className="flex flex-wrap gap-2">
                    {tagPresets.map((preset) => (
                      <Button
                        key={preset.name}
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          const tagSet = new Set(
                            tags
                              .split(",")
                              .map((t) => t.trim())
                              .filter(Boolean)
                          );
                          tagSet.add(preset.name);
                          setTags(Array.from(tagSet).join(", "));
                        }}
                      >
                        #{preset.name}
                      </Button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="cred-env">Environment</Label>
                  <Select value={environment} onValueChange={(v) => setEnvironment(v as EnvironmentScope)}>
                    <SelectTrigger id="cred-env">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="DEV">Dev</SelectItem>
                      <SelectItem value="PROD">Prod</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="cred-access">Access</Label>
                  <Select value={access} onValueChange={(v) => setAccess(v as AccessLevel)}>
                    <SelectTrigger id="cred-access">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="OWNER">Owner</SelectItem>
                      <SelectItem value="EDITOR">Editor</SelectItem>
                      <SelectItem value="VIEWER">Viewer</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="cred-expires">Expires At</Label>
                  <Input
                    id="cred-expires"
                    type="date"
                    value={expiresAt}
                    onChange={(e) => setExpiresAt(e.target.value)}
                  />
                  {errors.expiresAt && <p className="text-xs text-red-500">{errors.expiresAt}</p>}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="cred-desc">Description (optional)</Label>
                  <Input
                    id="cred-desc"
                    placeholder="Where this key is used"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                  />
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="cred-rotation">Rotation interval (days)</Label>
                  <Input
                    id="cred-rotation"
                    type="number"
                    min={0}
                    placeholder="e.g. 90"
                    value={rotationIntervalDays}
                    onChange={(e) => setRotationIntervalDays(e.target.value)}
                  />
                  {errors.rotationIntervalDays && (
                    <p className="text-xs text-red-500">{errors.rotationIntervalDays}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="cred-scope">Workflow Access</Label>
                  <Select value={workflowScope} onValueChange={(v) => setWorkflowScope(v as WorkflowScope)}>
                    <SelectTrigger id="cred-scope">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ALL">All Workflows</SelectItem>
                      <SelectItem value="CUSTOM">Specific Workflows</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {workflowScope === "CUSTOM" && (
                <div className="space-y-2">
                  <Label htmlFor="cred-workflows">Allowed workflow IDs</Label>
                  <div className="flex gap-2">
                    <Input
                      id="cred-workflows"
                      placeholder="workflow-id"
                      value={workflowInput}
                      onChange={(e) => setWorkflowInput(e.target.value)}
                    />
                    <Button type="button" onClick={handleAddWorkflow}>
                      Add
                    </Button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {workflowIds.map((id) => (
                      <Badge key={id} variant="outline" className="gap-2">
                        {id}
                        <button
                          type="button"
                          className="text-xs"
                          onClick={() => setWorkflowIds((prev) => prev.filter((w) => w !== id))}
                        >
                          ×
                        </button>
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              <div className="space-y-2">
                <Label>Sharing & Roles</Label>
                <div className="grid gap-2 md:grid-cols-[1fr_1fr_140px_auto]">
                  <Input
                    placeholder="Name"
                    value={shareName}
                    onChange={(e) => setShareName(e.target.value)}
                  />
                  <Input
                    placeholder="Email"
                    value={shareEmail}
                    onChange={(e) => setShareEmail(e.target.value)}
                  />
                  <Select value={shareRole} onValueChange={(v) => setShareRole(v as AccessLevel)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="OWNER">Owner</SelectItem>
                      <SelectItem value="EDITOR">Editor</SelectItem>
                      <SelectItem value="VIEWER">Viewer</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button type="button" onClick={handleAddShare}>Add</Button>
                </div>

                {(sharedWith || []).length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {sharedWith.map((member) => (
                      <Badge key={member.id} variant="secondary" className="gap-2">
                        {member.name} • {member.role}
                        <button
                          type="button"
                          className="text-xs"
                          onClick={() =>
                            setSharedWith((prev) => prev.filter((m) => m.id !== member.id))
                          }
                        >
                          ×
                        </button>
                      </Badge>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleSave}>{editing ? "Save Changes" : "Add Credential"}</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
