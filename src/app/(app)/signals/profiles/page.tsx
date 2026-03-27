"use client";

import { useState } from "react";
import { PageHeader } from "@/components/page-header";
import { ScoringProfileEditor } from "@/components/signals/scoring-profile-editor";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { Plus, Pencil, Trash2, Star } from "lucide-react";
import { useSignals, useScoringProfiles, type ScoringProfile } from "@/hooks/use-signals";
import { toast } from "sonner";

export default function ScoringProfilesPage() {
  const { signals } = useSignals();
  const { profiles, loading, createProfile, updateProfile, deleteProfile } = useScoringProfiles();
  const [editing, setEditing] = useState<ScoringProfile | undefined>();
  const [dialogOpen, setDialogOpen] = useState(false);

  const handleSave = async (data: Partial<ScoringProfile>) => {
    try {
      if (editing) {
        await updateProfile(editing.id, data);
        toast.success("Profile updated");
      } else {
        await createProfile(data);
        toast.success("Profile created");
      }
      setDialogOpen(false);
      setEditing(undefined);
    } catch {
      toast.error("Failed to save profile");
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteProfile(id);
      toast.success("Profile deleted");
    } catch {
      toast.error("Failed to delete profile");
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader title="Scoring Profiles" description="Group signals into profiles with qualification thresholds">
        <Dialog open={dialogOpen} onOpenChange={(v) => { setDialogOpen(v); if (!v) setEditing(undefined); }}>
          <DialogTrigger render={<Button size="sm" className="gap-1" />}>
              <Plus className="size-3.5" /> New Profile
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
            <ScoringProfileEditor
              profile={editing}
              signals={signals}
              onSave={handleSave}
            />
          </DialogContent>
        </Dialog>
      </PageHeader>

      {loading ? (
        <div className="space-y-3">
          {[1, 2].map((i) => <Skeleton key={i} className="h-20 rounded-lg" />)}
        </div>
      ) : profiles.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <Star className="size-10 text-muted-foreground mb-3" />
            <p className="text-lg font-medium">No scoring profiles</p>
            <p className="text-sm text-muted-foreground mb-4">Create a profile to group signals and set a qualification threshold.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {profiles.map((profile) => (
            <Card key={profile.id}>
              <CardContent className="flex items-center gap-4 py-3 px-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <p className="font-medium">{profile.name}</p>
                    {profile.is_default && <Badge variant="secondary" className="text-xs">Default</Badge>}
                  </div>
                  {profile.description && (
                    <p className="text-xs text-muted-foreground mt-0.5">{profile.description}</p>
                  )}
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Threshold: {profile.qualification_threshold} &middot; {profile.signal_ids.length} signals
                  </p>
                </div>
                <div className="flex gap-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="size-8 p-0"
                    onClick={() => { setEditing(profile); setDialogOpen(true); }}
                  >
                    <Pencil className="size-3.5" />
                  </Button>
                  <Button variant="ghost" size="sm" className="size-8 p-0 text-destructive" onClick={() => handleDelete(profile.id)}>
                    <Trash2 className="size-3.5" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
