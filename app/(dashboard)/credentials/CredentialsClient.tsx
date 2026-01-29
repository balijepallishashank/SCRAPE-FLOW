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

type CredentialType = "API_KEY" | "TOKEN" | "PASSWORD" | "OTHER";
type EnvironmentScope = "DEV" | "PROD";
type AccessLevel = "OWNER" | "EDITOR" | "VIEWER";

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
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  lastUsedAt?: string;
  expiresAt?: string;
};

type ActivityLog = {
  id: string;
  action: "CREATED" | "UPDATED" | "DELETED" | "COPIED" | "EXPORTED" | "IMPORTED";
  credentialName?: string;
  timestamp: string;
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

export function CredentialsClient() {
  const [credentials, setCredentials] = useState<Credential[]>([]);
  const [activity, setActivity] = useState<ActivityLog[]>([]);
  const [search, setSearch] = useState("");
  const [filterType, setFilterType] = useState<CredentialType | "ALL">("ALL");
  const [filterEnv, setFilterEnv] = useState<EnvironmentScope | "ALL">("ALL");
  const [filterFolder, setFilterFolder] = useState<string | "ALL">("ALL");
  const [filterTag, setFilterTag] = useState<string | "ALL">("ALL");
  const [showValue, setShowValue] = useState<Record<string, boolean>>({});
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Credential | null>(null);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  const [name, setName] = useState("");
  const [type, setType] = useState<CredentialType>("API_KEY");
  const [value, setValue] = useState("");
  const [description, setDescription] = useState("");
  const [folder, setFolder] = useState("");
  const [tags, setTags] = useState("");
  const [environment, setEnvironment] = useState<EnvironmentScope>("DEV");
  const [access, setAccess] = useState<AccessLevel>("OWNER");
  const [expiresAt, setExpiresAt] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const loaded = loadCredentials();
    setCredentials(loaded);
    setActivity(loadActivity());
  }, []);

  useEffect(() => {
    saveCredentials(credentials);
  }, [credentials]);

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
        (c.tags || []).some((t) => t.toLowerCase().includes(search.toLowerCase()));
      const matchesType = filterType === "ALL" ? true : c.type === filterType;
      const matchesEnv = filterEnv === "ALL" ? true : c.environment === filterEnv;
      const matchesFolder = filterFolder === "ALL" ? true : c.folder === filterFolder;
      const matchesTag = filterTag === "ALL" ? true : (c.tags || []).includes(filterTag);
      return matchesSearch && matchesType && matchesEnv && matchesFolder && matchesTag;
    });
  }, [credentials, search, filterType, filterEnv, filterFolder, filterTag]);

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
      setCredentials((prev) =>
        prev.map((c) =>
          c.id === cred.id ? { ...c, lastUsedAt: new Date().toISOString() } : c
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

  const toggleSelectAll = () => {
    if (selectedIds.length === filtered.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(filtered.map((c) => c.id));
    }
  };

  const canEdit = (cred: Credential) => cred.access !== "VIEWER";

  return (
    <div className="grid gap-6 lg:grid-cols-[260px_1fr]">
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
          </div>
        </CardContent>
      </Card>

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
                        <Badge variant="outline">📁 {cred.folder}</Badge>
                      )}
                      {(cred.tags || []).map((t) => (
                        <Badge key={t} variant="secondary">#{t}</Badge>
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
                        <KeyRoundIcon size={12} /> Updated {new Date(cred.updatedAt).toLocaleString("en-US", { dateStyle: "medium", timeStyle: "short" })}
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
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
                </div>
                <div className="space-y-2">
                  <Label htmlFor="cred-tags">Tags</Label>
                  <Input
                    id="cred-tags"
                    placeholder="e.g. stripe, prod"
                    value={tags}
                    onChange={(e) => setTags(e.target.value)}
                  />
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
