"use client";

import { createContext, useContext, useEffect, useState, useCallback } from "react";
import { User } from "@supabase/supabase-js";
import { getSupabaseClient, supabase } from "@/lib/supabase";

export { supabase };
export { getSupabaseClient };

export interface Folder {
  id: string;
  name: string;
  user_id: string;
  created_at: string;
  updated_at: string;
}

interface KnowledgeItem {
  id: string;
  title: string;
  folder_id: string | null;
  domain: string;
  source: string | null;
  tags: string[];
  createdAt: string;
  nextReviewAt: string;
  reviewCount: number;
  contentPreview: string;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  signOut: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

interface KnowledgeContextType {
  items: KnowledgeItem[];
  loading: boolean;
  error: string | null;
  fetchItems: () => Promise<void>;
  deleteItem: (id: string) => Promise<void>;
  refreshItems: () => Promise<void>;
}

interface FoldersContextType {
  folders: Folder[];
  loading: boolean;
  error: string | null;
  fetchFolders: () => Promise<void>;
  createFolder: (name: string) => Promise<Folder | null>;
  renameFolder: (id: string, name: string) => Promise<void>;
  deleteFolder: (id: string) => Promise<void>;
  refreshFolders: () => Promise<void>;
}

interface StarredItem {
  id: string;
  user_id: string;
  item_id: string;
  created_at: string;
}

interface StarredContextType {
  starredIds: string[];
  loading: boolean;
  error: string | null;
  fetchStarred: () => Promise<void>;
  starItem: (itemId: string) => Promise<void>;
  unstarItem: (itemId: string) => Promise<void>;
  isStarred: (itemId: string) => boolean;
  refreshStarred: () => Promise<void>;
}

interface TrashedItem {
  id: string;
  user_id: string;
  item_id: string;
  deleted_at: string;
}

interface TrashContextType {
  trashedIds: string[];
  loading: boolean;
  error: string | null;
  fetchTrash: () => Promise<void>;
  trashItem: (itemId: string) => Promise<void>;
  restoreItem: (itemId: string) => Promise<void>;
  permanentlyDeleteItem: (itemId: string) => Promise<void>;
  isTrashed: (itemId: string) => boolean;
  refreshTrash: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);
const KnowledgeContext = createContext<KnowledgeContextType | undefined>(undefined);
const FoldersContext = createContext<FoldersContextType | undefined>(undefined);
const StarredContext = createContext<StarredContextType | undefined>(undefined);
const TrashContext = createContext<TrashContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState<KnowledgeItem[]>([]);
  const [itemsLoading, setItemsLoading] = useState(false);
  const [itemsError, setItemsError] = useState<string | null>(null);
  const [hasFetched, setHasFetched] = useState(false);
  const [folders, setFolders] = useState<Folder[]>([]);
  const [foldersLoading, setFoldersLoading] = useState(false);
  const [foldersError, setFoldersError] = useState<string | null>(null);
  const [hasFetchedFolders, setHasFetchedFolders] = useState(false);
  const [starredIds, setStarredIds] = useState<string[]>([]);
  const [starredLoading, setStarredLoading] = useState(false);
  const [starredError, setStarredError] = useState<string | null>(null);
  const [hasFetchedStarred, setHasFetchedStarred] = useState(false);
  const [trashedIds, setTrashedIds] = useState<string[]>([]);
  const [trashLoading, setTrashLoading] = useState(false);
  const [trashError, setTrashError] = useState<string | null>(null);
  const [hasFetchedTrash, setHasFetchedTrash] = useState(false);

  useEffect(() => {
    // Get initial session
    getSupabaseClient().auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      setLoading(false);
    });

    // Listen for auth state changes
    const {
      data: { subscription },
    } = getSupabaseClient().auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signOut = async () => {
    await getSupabaseClient().auth.signOut();
    setUser(null);
    setItems([]);
    setHasFetched(false);
  };

  const refreshUser = async () => {
    const { data: { session } } = await getSupabaseClient().auth.getSession();
    setUser(session?.user ?? null);
  };

  const fetchItems = useCallback(async () => {
    if (!user) return;
    setItemsLoading(true);
    setItemsError(null);
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      const token = session?.access_token ?? "";

      const response = await fetch("/api/library/list", {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!response.ok) {
        throw new Error("Failed to fetch items");
      }
      const data = await response.json() as { items?: KnowledgeItem[] };
      setItems(data.items ?? []);
      setHasFetched(true);
    } catch (err) {
      setItemsError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setItemsLoading(false);
    }
  }, [user]);

  const deleteItem = useCallback(async (id: string) => {
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      const token = session?.access_token ?? "";

      const response = await fetch("/api/library/delete", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ id }),
      });

      if (!response.ok) {
        throw new Error("Failed to delete item");
      }

      // Update local state
      setItems((prev) => prev.filter((item) => item.id !== id));
    } catch (err) {
      console.error("Delete error:", err);
      throw err;
    }
  }, []);

  const refreshItems = useCallback(async () => {
    await fetchItems();
  }, [fetchItems]);

  // Folders CRUD
  const fetchFolders = useCallback(async () => {
    if (!user) return;
    setFoldersLoading(true);
    setFoldersError(null);
    try {
      const { data, error } = await supabase
        .from("folders")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setFolders(data ?? []);
      setHasFetchedFolders(true);
    } catch (err) {
      console.error("Fetch folders error:", err);
      setFoldersError(err instanceof Error ? err.message : "Failed to fetch folders");
    } finally {
      setFoldersLoading(false);
    }
  }, [user]);

  const createFolder = useCallback(async (name: string): Promise<Folder | null> => {
    if (!user) return null;
    try {
      const { data, error } = await supabase
        .from("folders")
        .insert({ user_id: user.id, name })
        .select()
        .single();

      if (error) throw error;
      setFolders((prev) => [data, ...prev]);
      return data;
    } catch (err) {
      console.error("Create folder error:", err);
      throw err;
    }
  }, [user]);

  const renameFolder = useCallback(async (id: string, name: string) => {
    try {
      const { error } = await supabase
        .from("folders")
        .update({ name, updated_at: new Date().toISOString() })
        .eq("id", id);

      if (error) throw error;
      setFolders((prev) => prev.map((f) => f.id === id ? { ...f, name } : f));
    } catch (err) {
      console.error("Rename folder error:", err);
      throw err;
    }
  }, []);

  const deleteFolder = useCallback(async (id: string) => {
    try {
      const { error } = await supabase
        .from("folders")
        .delete()
        .eq("id", id);

      if (error) throw error;
      setFolders((prev) => prev.filter((f) => f.id !== id));
    } catch (err) {
      console.error("Delete folder error:", err);
      throw err;
    }
  }, []);

  const refreshFolders = useCallback(async () => {
    await fetchFolders();
  }, [fetchFolders]);

  // Starred items CRUD
  const fetchStarred = useCallback(async () => {
    if (!user) return;
    setStarredLoading(true);
    setStarredError(null);
    try {
      const { data, error } = await supabase
        .from("starred_items")
        .select("item_id")
        .eq("user_id", user.id);

      if (error) throw error;
      setStarredIds(data?.map((s: { item_id: string }) => s.item_id) ?? []);
      setHasFetchedStarred(true);
    } catch (err) {
      console.error("Fetch starred error:", err);
      setStarredError(err instanceof Error ? err.message : "Failed to fetch starred");
    } finally {
      setStarredLoading(false);
    }
  }, [user]);

  const starItem = useCallback(async (itemId: string) => {
    if (!user) return;
    try {
      const { error } = await supabase
        .from("starred_items")
        .insert({ user_id: user.id, item_id: itemId });

      if (error) throw error;
      setStarredIds((prev) => [...prev, itemId]);
    } catch (err) {
      console.error("Star item error:", err);
      throw err;
    }
  }, [user]);

  const unstarItem = useCallback(async (itemId: string) => {
    if (!user) return;
    try {
      const { error } = await supabase
        .from("starred_items")
        .delete()
        .eq("user_id", user.id)
        .eq("item_id", itemId);

      if (error) throw error;
      setStarredIds((prev) => prev.filter((id) => id !== itemId));
    } catch (err) {
      console.error("Unstar item error:", err);
      throw err;
    }
  }, [user]);

  const isStarred = useCallback((itemId: string) => {
    return starredIds.includes(itemId);
  }, [starredIds]);

  const refreshStarred = useCallback(async () => {
    await fetchStarred();
  }, [fetchStarred]);

  // Trash items CRUD
  const fetchTrash = useCallback(async () => {
    if (!user) return;
    setTrashLoading(true);
    setTrashError(null);
    try {
      const { data, error } = await supabase
        .from("trashed_items")
        .select("item_id")
        .eq("user_id", user.id);

      if (error) throw error;
      setTrashedIds(data?.map((s: { item_id: string }) => s.item_id) ?? []);
      setHasFetchedTrash(true);
    } catch (err) {
      console.error("Fetch trash error:", err);
      setTrashError(err instanceof Error ? err.message : "Failed to fetch trash");
    } finally {
      setTrashLoading(false);
    }
  }, [user]);

  const trashItem = useCallback(async (itemId: string) => {
    if (!user) return;
    try {
      // 1. Delete associated review_state (if exists)
      await supabase.from("review_state").delete().eq("item_id", itemId);

      // 2. Delete associated starred_items
      await supabase.from("starred_items").delete().eq("item_id", itemId);

      // 3. Delete from knowledge_items
      const { error: deleteError } = await supabase
        .from("knowledge_items")
        .delete()
        .eq("id", itemId)
        .eq("user_id", user.id);

      if (deleteError) {
        console.error("knowledge_items delete error:", deleteError);
        throw deleteError;
      }

      // 4. Remove from local state
      setItems((prev) => prev.filter((item) => item.id !== itemId));
    } catch (err) {
      console.error("Trash item error:", err);
      throw err;
    }
  }, [user]);

  const restoreItem = useCallback(async (itemId: string) => {
    if (!user) return;
    try {
      const { error } = await supabase
        .from("trashed_items")
        .delete()
        .eq("user_id", user.id)
        .eq("item_id", itemId);

      if (error) throw error;
      setTrashedIds((prev) => prev.filter((id) => id !== itemId));
    } catch (err) {
      console.error("Restore item error:", err);
      throw err;
    }
  }, [user]);

  const permanentlyDeleteItem = useCallback(async (itemId: string) => {
    if (!user) return;
    try {
      // First delete from trashed_items
      await supabase
        .from("trashed_items")
        .delete()
        .eq("user_id", user.id)
        .eq("item_id", itemId);

      // Then delete the actual knowledge item
      const { error } = await supabase
        .from("knowledge_items")
        .delete()
        .eq("id", itemId)
        .eq("user_id", user.id);

      if (error) throw error;
      setTrashedIds((prev) => prev.filter((id) => id !== itemId));
      // Also remove from items if present
      setItems((prev) => prev.filter((item) => item.id !== itemId));
    } catch (err) {
      console.error("Permanently delete item error:", err);
      throw err;
    }
  }, [user]);

  const isTrashed = useCallback((itemId: string) => {
    return trashedIds.includes(itemId);
  }, [trashedIds]);

  const refreshTrash = useCallback(async () => {
    await fetchTrash();
  }, [fetchTrash]);

  // Auto-fetch items and folders when user logs in
  useEffect(() => {
    if (user && !hasFetched) {
      fetchItems();
    }
    if (user && !hasFetchedFolders) {
      fetchFolders();
    }
    if (user && !hasFetchedStarred) {
      fetchStarred();
    }
    if (user && !hasFetchedTrash) {
      fetchTrash();
    }
    // Clear items and folders when user logs out
    if (!user) {
      setItems([]);
      setFolders([]);
      setStarredIds([]);
      setTrashedIds([]);
      setHasFetched(false);
      setHasFetchedFolders(false);
      setHasFetchedStarred(false);
      setHasFetchedTrash(false);
    }
  }, [user, hasFetched, hasFetchedFolders, hasFetchedStarred, hasFetchedTrash, fetchItems, fetchFolders, fetchStarred, fetchTrash]);

  return (
    <AuthContext.Provider value={{ user, loading, signOut, refreshUser }}>
      <KnowledgeContext.Provider value={{ items, loading: itemsLoading, error: itemsError, fetchItems, deleteItem, refreshItems }}>
        <FoldersContext.Provider value={{ folders, loading: foldersLoading, error: foldersError, fetchFolders, createFolder, renameFolder, deleteFolder, refreshFolders }}>
          <StarredContext.Provider value={{ starredIds, loading: starredLoading, error: starredError, fetchStarred, starItem, unstarItem, isStarred, refreshStarred }}>
            <TrashContext.Provider value={{ trashedIds, loading: trashLoading, error: trashError, fetchTrash, trashItem, restoreItem, permanentlyDeleteItem, isTrashed, refreshTrash }}>
              {children}
            </TrashContext.Provider>
          </StarredContext.Provider>
        </FoldersContext.Provider>
      </KnowledgeContext.Provider>
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}

export function useKnowledge() {
  const context = useContext(KnowledgeContext);
  if (context === undefined) {
    throw new Error("useKnowledge must be used within an AuthProvider");
  }
  return context;
}

export function useFolders() {
  const context = useContext(FoldersContext);
  if (context === undefined) {
    throw new Error("useFolders must be used within an AuthProvider");
  }
  return context;
}

export function useStarred() {
  const context = useContext(StarredContext);
  if (context === undefined) {
    throw new Error("useStarred must be used within an AuthProvider");
  }
  return context;
}

export function useTrash() {
  const context = useContext(TrashContext);
  if (context === undefined) {
    throw new Error("useTrash must be used within an AuthProvider");
  }
  return context;
}