export type ScopeInput = {
  projectName: string;
  description: string;
  industry: string;
  targetAudience: string;
  budgetMin: number;
  budgetMax: number;
  timeline: string;
  teamSize: number;
  keyFeatures: string[];
  competitors?: string;
};

export type ScopeOutput = {
  executive_summary: string;
  problem_statement: string;
  solution: string;
  features: Array<{
    name: string;
    priority: "must_have" | "nice_to_have" | "future";
    complexity: number;
    estimated_hours: number;
    description: string;
  }>;
  tech_stack: {
    frontend: string[];
    backend: string[];
    database: string[];
    hosting: string[];
  };
  timeline: {
    phases: Array<{ name: string; weeks: number; deliverables: string[] }>;
  };
  cost_estimate: {
    breakdown: Array<{ category: string; min: number; max: number }>;
    total_min: number;
    total_max: number;
    currency: string;
  };
  team: {
    roles: Array<{ name: string; hours: number; when_needed: string }>;
  };
  risks: Array<{ risk: string; probability: string; impact: string; mitigation: string }>;
  metrics: { kpis: string[] };
  next_steps: string[];
};

