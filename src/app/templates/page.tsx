import { redirect } from "next/navigation";
import Link from "next/link";
import { AppShell } from "@/components/app-shell";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { scopeTemplates } from "@/lib/scope-templates";

export const dynamic = "force-dynamic";

export default async function TemplatesPage() {
  const supabase = createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");
  const totalTemplates = scopeTemplates.length;
  const totalIndustries = new Set(scopeTemplates.map((template) => template.industry)).size;

  return (
    <AppShell
      title="Templates"
      subtitle="Pick a polished starting point and customize it to your client's needs in minutes."
    >
      <div className="mb-7 rounded-3xl border border-red-200 bg-gradient-to-br from-red-50 via-rose-50 to-white p-6 shadow-sm">
        <p className="text-xs font-semibold uppercase tracking-wide text-red-700">Template Library</p>
        <h2 className="mt-1 text-2xl font-bold tracking-tight text-red-950">Ready-to-use project blueprints</h2>
        <p className="mt-2 max-w-2xl text-sm text-red-900/80">
          Start with a structure that fits your industry, then refine scope, timeline, and key features during chat.
        </p>
        <div className="mt-4 flex flex-wrap gap-2">
          <span className="rounded-full border border-red-200 bg-white px-3 py-1 text-xs font-medium text-red-700">
            {totalTemplates} templates
          </span>
          <span className="rounded-full border border-red-200 bg-white px-3 py-1 text-xs font-medium text-red-700">
            {totalIndustries} industries
          </span>
          <span className="rounded-full border border-red-200 bg-white px-3 py-1 text-xs font-medium text-red-700">
            Red design system
          </span>
        </div>
      </div>

      <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
        {scopeTemplates.map((template) => (
          <Card
            key={template.name}
            className="group border-red-100 bg-white shadow-sm transition hover:-translate-y-1 hover:border-red-300 hover:shadow-md"
          >
            <CardHeader>
              <div className="mb-2 inline-flex w-fit rounded-full border border-red-100 bg-red-50 px-2 py-1 text-xs font-medium text-red-700">
                {template.industry}
              </div>
              <CardTitle className="text-lg text-red-950">{template.name}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-red-900/80">{template.description}</p>
              <p className="text-xs uppercase tracking-wide text-red-700/80">
                Estimated timeline: {template.timeline}
              </p>
              <Button asChild className="w-full bg-red-600 text-white hover:bg-red-700">
                <Link href={`/dashboard?template=${encodeURIComponent(template.id)}`}>Use Template</Link>
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </AppShell>
  );
}
