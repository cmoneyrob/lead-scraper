"use client";

import { useState } from "react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Tag } from "lucide-react";
import { TagBadge } from "./tag-badge";

interface TagOption {
  id: string;
  name: string;
  color: string;
}

interface TagPickerProps {
  tags: TagOption[];
  selectedIds: string[];
  onToggle: (tagId: string) => void;
  onCreate?: (name: string) => void;
}

export function TagPicker({ tags, selectedIds, onToggle, onCreate }: TagPickerProps) {
  const [open, setOpen] = useState(false);
  const [newName, setNewName] = useState("");

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger render={<Button variant="outline" size="sm" className="gap-1" />}>
          <Tag className="size-3.5" />
          Tags
      </PopoverTrigger>
      <PopoverContent className="w-64 p-3" align="start">
        <div className="space-y-2">
          {tags.map((tag) => (
            <button
              key={tag.id}
              onClick={() => onToggle(tag.id)}
              className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-sm hover:bg-accent"
            >
              <input
                type="checkbox"
                checked={selectedIds.includes(tag.id)}
                readOnly
                className="rounded border-muted-foreground"
              />
              <TagBadge name={tag.name} color={tag.color} />
            </button>
          ))}
          {onCreate && (
            <div className="flex gap-1 pt-1 border-t">
              <Input
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="New tag..."
                className="h-8 text-xs"
                onKeyDown={(e) => {
                  if (e.key === "Enter" && newName.trim()) {
                    onCreate(newName.trim());
                    setNewName("");
                  }
                }}
              />
              <Button
                size="sm"
                variant="ghost"
                className="h-8 px-2"
                onClick={() => {
                  if (newName.trim()) {
                    onCreate(newName.trim());
                    setNewName("");
                  }
                }}
              >
                <Plus className="size-3.5" />
              </Button>
            </div>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}
