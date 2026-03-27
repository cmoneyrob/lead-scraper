"use client";

import { useCallback, useEffect, useState } from "react";

export interface Tag {
  id: string;
  name: string;
  color: string;
  created_at: string;
}

export function useTags() {
  const [tags, setTags] = useState<Tag[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchTags = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/tags");
      if (!res.ok) throw new Error("Failed to fetch tags");
      const data = await res.json();
      setTags(data.tags ?? data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchTags(); }, [fetchTags]);

  const createTag = useCallback(async (name: string, color?: string) => {
    const res = await fetch("/api/tags", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, color }),
    });
    if (!res.ok) throw new Error("Failed to create tag");
    await fetchTags();
    return res.json();
  }, [fetchTags]);

  const updateTag = useCallback(async (id: string, data: { name?: string; color?: string }) => {
    const res = await fetch(`/api/tags/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error("Failed to update tag");
    await fetchTags();
  }, [fetchTags]);

  const deleteTag = useCallback(async (id: string) => {
    const res = await fetch(`/api/tags/${id}`, { method: "DELETE" });
    if (!res.ok) throw new Error("Failed to delete tag");
    await fetchTags();
  }, [fetchTags]);

  return { tags, loading, fetchTags, createTag, updateTag, deleteTag };
}
