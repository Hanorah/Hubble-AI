"use client";

import { create } from "zustand";
import type { ScopeInput, ScopeOutput } from "@/lib/scope";

type ScopeState = {
  input: ScopeInput;
  output: ScopeOutput | null;
  loading: boolean;
  error: string | null;
  setField: <K extends keyof ScopeInput>(key: K, value: ScopeInput[K]) => void;
  setOutput: (value: ScopeOutput | null) => void;
  setLoading: (value: boolean) => void;
  setError: (value: string | null) => void;
};

const initialInput: ScopeInput = {
  projectName: "",
  description: "",
  industry: "SaaS",
  targetAudience: "",
  budgetMin: 100000,
  budgetMax: 1000000,
  timeline: "3 months",
  teamSize: 3,
  keyFeatures: [],
  competitors: "",
};

export const useScopeStore = create<ScopeState>((set) => ({
  input: initialInput,
  output: null,
  loading: false,
  error: null,
  setField: (key, value) => set((s) => ({ input: { ...s.input, [key]: value } })),
  setOutput: (value) => set({ output: value }),
  setLoading: (value) => set({ loading: value }),
  setError: (value) => set({ error: value }),
}));

