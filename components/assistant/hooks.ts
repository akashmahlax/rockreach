"use client";

import { useEffect, useState } from "react";
import { Conversation, UsageStats } from "./types";
import { toast } from "sonner";

export function useConversations() {
  const [conversations, setConversations] = useState<Conversation[]>(() => {
    const saved = localStorage.getItem("assistant-conversations");
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        // Migration: ensure createdAt exists
        return parsed.map((conv: Conversation) => ({
          ...conv,
          createdAt: conv.createdAt || Date.now(),
        }));
      } catch (error) {
        console.error("Failed to parse conversations:", error);
      }
    }
    return [];
  });
  
  const [activeConvId, setActiveConvId] = useState<string | null>(() => {
    const saved = localStorage.getItem("assistant-conversations");
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        return parsed.length > 0 ? parsed[0].id : null;
      } catch {
        return null;
      }
    }
    return null;
  });

  // Save to localStorage whenever conversations change
  useEffect(() => {
    if (conversations.length > 0) {
      localStorage.setItem("assistant-conversations", JSON.stringify(conversations));
    }
  }, [conversations]);

  const createNewConversation = () => {
    const newConv: Conversation = {
      id: `conv-${Date.now()}`,
      title: "New Chat",
      messages: [],
      createdAt: Date.now(),
    };

    setConversations((prev) => [newConv, ...prev]);
    setActiveConvId(newConv.id);
  };

  const deleteConversation = (id: string) => {
    const remaining = conversations.filter((c) => c.id !== id);
    setConversations(remaining);

    if (activeConvId === id && remaining.length > 0) {
      setActiveConvId(remaining[0].id);
    } else if (remaining.length === 0) {
      setActiveConvId(null);
    }
  };

  const renameConversation = (id: string, newTitle: string) => {
    setConversations((prev) =>
      prev.map((c) => (c.id === id ? { ...c, title: newTitle } : c))
    );
  };

  const updateConversationMessages = (id: string, messages: Conversation['messages']) => {
    setConversations((prev) =>
      prev.map((c) => (c.id === id ? { ...c, messages } : c))
    );
  };

  const activeConv = conversations.find((c) => c.id === activeConvId);

  return {
    conversations,
    activeConvId,
    activeConv,
    setActiveConvId,
    createNewConversation,
    deleteConversation,
    renameConversation,
    updateConversationMessages,
  };
}

export function useUsageStats(period: "24h" | "7d" | "30d") {
  const [usageStats, setUsageStats] = useState<UsageStats | null>(null);
  const [loadingStats, setLoadingStats] = useState(false);

  useEffect(() => {
    fetchUsageStats(period);
  }, [period]);

  const fetchUsageStats = async (period: string) => {
    setLoadingStats(true);
    try {
      const res = await fetch(`/api/assistant/usage?period=${period}`);
      if (res.ok) {
        const data = await res.json();
        setUsageStats(data);
      }
    } catch (error) {
      console.error("Failed to fetch usage stats:", error);
      toast.error("Failed to load usage stats");
    } finally {
      setLoadingStats(false);
    }
  };

  return {
    usageStats,
    loadingStats,
    refetchStats: () => fetchUsageStats(period),
  };
}
