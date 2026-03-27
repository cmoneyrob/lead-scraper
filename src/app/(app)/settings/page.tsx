"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Loader2, Save, Trash2 } from "lucide-react";
import { toast } from "sonner";

export default function SettingsPage() {
  const [displayName, setDisplayName] = useState("");
  const [braveApiKey, setBraveApiKey] = useState("");
  const [defaultThreshold, setDefaultThreshold] = useState("70");
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  async function handleSaveProfile(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);

    try {
      const supabase = createClient();
      const { error } = await supabase.auth.updateUser({
        data: { display_name: displayName },
      });

      if (error) {
        toast.error(error.message);
        return;
      }

      toast.success("Profile updated");
    } finally {
      setSaving(false);
    }
  }

  async function handleDeleteAccount() {
    const confirmed = window.confirm(
      "Are you sure you want to delete your account? This action cannot be undone."
    );

    if (!confirmed) return;

    setDeleting(true);

    try {
      toast.error(
        "Account deletion requires admin action. Please contact support."
      );
    } finally {
      setDeleting(false);
    }
  }

  return (
    <div className="mx-auto max-w-2xl space-y-8">
      <PageHeader
        title="Settings"
        description="Manage your account and application configuration."
      />

      <form onSubmit={handleSaveProfile}>
        <Card>
          <CardHeader>
            <CardTitle>Profile</CardTitle>
            <CardDescription>
              Update your display name and profile information.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="display-name">Display Name</Label>
              <Input
                id="display-name"
                placeholder="Your name"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Email</Label>
              <Input disabled placeholder="Loaded from your account" />
              <p className="text-xs text-muted-foreground">
                Email cannot be changed here.
              </p>
            </div>
          </CardContent>
          <CardFooter>
            <Button type="submit" disabled={saving}>
              {saving ? (
                <Loader2 className="animate-spin" />
              ) : (
                <Save />
              )}
              Save Changes
            </Button>
          </CardFooter>
        </Card>
      </form>

      <Card>
        <CardHeader>
          <CardTitle>Brave Search API</CardTitle>
          <CardDescription>
            Configure your Brave Search API key for lead discovery.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="brave-api-key">API Key</Label>
            <Input
              id="brave-api-key"
              type="password"
              placeholder="BSA-xxxxxxxxxxxxxxxxxxxxxxxx"
              value={braveApiKey}
              onChange={(e) => setBraveApiKey(e.target.value)}
            />
            <p className="text-xs text-muted-foreground">
              Get your API key from{" "}
              <a
                href="https://brave.com/search/api/"
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary underline-offset-4 hover:underline"
              >
                brave.com/search/api
              </a>
              . The key is stored as an environment variable{" "}
              <code className="rounded bg-muted px-1 py-0.5 text-xs">
                BRAVE_API_KEY
              </code>
              .
            </p>
          </div>
        </CardContent>
        <CardFooter>
          <Button
            type="button"
            onClick={() => toast.info("API key configuration is managed via environment variables.")}
          >
            <Save />
            Save API Key
          </Button>
        </CardFooter>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Scoring Defaults</CardTitle>
          <CardDescription>
            Configure default scoring parameters for lead evaluation.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="threshold">Default Score Threshold</Label>
            <Input
              id="threshold"
              type="number"
              min={0}
              max={100}
              value={defaultThreshold}
              onChange={(e) => setDefaultThreshold(e.target.value)}
            />
            <p className="text-xs text-muted-foreground">
              Leads scoring below this threshold will be marked as low priority
              (0-100).
            </p>
          </div>
        </CardContent>
        <CardFooter>
          <Button
            type="button"
            onClick={() => toast.success("Scoring defaults saved")}
          >
            <Save />
            Save Defaults
          </Button>
        </CardFooter>
      </Card>

      <Separator />

      <Card className="border-destructive/30">
        <CardHeader>
          <CardTitle className="text-destructive">Danger Zone</CardTitle>
          <CardDescription>
            Irreversible and destructive actions.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Permanently delete your account and all associated data. This action
            cannot be undone.
          </p>
        </CardContent>
        <CardFooter>
          <Button
            variant="destructive"
            onClick={handleDeleteAccount}
            disabled={deleting}
          >
            {deleting ? (
              <Loader2 className="animate-spin" />
            ) : (
              <Trash2 />
            )}
            Delete Account
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
