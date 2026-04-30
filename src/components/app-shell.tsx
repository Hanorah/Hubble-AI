"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { ChevronLeft, LayoutDashboard, LayoutTemplate, LogIn, LogOut, Menu, PanelLeftClose, PanelLeftOpen, Sparkles, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

type Props = {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  hideTopNav?: boolean;
};

type SavedChatTitle = {
  id: string;
  title: string;
  createdAt: string;
};

const CHAT_TITLES_STORAGE_KEY = "hubble.chatTitles";

export function AppShell({ title, subtitle, children, hideTopNav = false }: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const supabase = useMemo(() => createSupabaseBrowserClient(), []);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [chatTitles, setChatTitles] = useState<SavedChatTitle[]>([]);

  const navItems = [
    { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { href: "/templates", label: "Template", icon: LayoutTemplate },
  ];

  const isActive = (href: string) => pathname === href || pathname.startsWith(`${href}/`);
  const linkClass = (href: string, compact = false) =>
    `group flex items-center rounded-xl text-sm transition ${
      compact ? "justify-center px-2 py-2.5" : "gap-3 px-3 py-2.5"
    } ${
      isActive(href)
        ? "bg-red-600 text-white shadow-sm"
        : "text-slate-700 hover:bg-red-50 hover:text-red-700"
    }`;

  useEffect(() => {
    if (!supabase) {
      setIsAuthenticated(false);
      return;
    }
    let mounted = true;

    const loadSession = async () => {
      const { data } = await supabase.auth.getSession();
      if (!mounted) return;
      setIsAuthenticated(Boolean(data.session?.user));
    };

    loadSession();

    const { data: authListener } = supabase.auth.onAuthStateChange((_event, session) => {
      setIsAuthenticated(Boolean(session?.user));
    });

    return () => {
      mounted = false;
      authListener.subscription.unsubscribe();
    };
  }, [supabase]);

  useEffect(() => {
    const loadChatTitles = () => {
      try {
        const raw = window.localStorage.getItem(CHAT_TITLES_STORAGE_KEY);
        if (!raw) {
          setChatTitles([]);
          return;
        }
        const parsed = JSON.parse(raw) as SavedChatTitle[];
        setChatTitles(Array.isArray(parsed) ? parsed : []);
      } catch {
        setChatTitles([]);
      }
    };

    loadChatTitles();
    window.addEventListener("storage", loadChatTitles);
    window.addEventListener("hubble:chat-titles-updated", loadChatTitles as EventListener);
    return () => {
      window.removeEventListener("storage", loadChatTitles);
      window.removeEventListener("hubble:chat-titles-updated", loadChatTitles as EventListener);
    };
  }, []);

  async function logout() {
    if (!supabase) return;
    await supabase.auth.signOut();
    router.push("/");
    router.refresh();
  }

  function startNewChat() {
    router.push(`/dashboard?chat=${Date.now()}`);
  }

  function deleteChatTitle(id: string) {
    const nextTitles = chatTitles.filter((item) => item.id !== id);
    setChatTitles(nextTitles);
    try {
      window.localStorage.setItem(CHAT_TITLES_STORAGE_KEY, JSON.stringify(nextTitles));
      window.dispatchEvent(new Event("hubble:chat-titles-updated"));
    } catch {
      // Ignore localStorage failures.
    }
  }

  return (
    <div className="min-h-screen bg-white text-slate-900">
      <div className="flex min-h-screen">
        <aside
          className={`hidden h-screen self-start flex-col overflow-hidden border-r border-red-100 bg-white p-3 transition-all duration-300 lg:sticky lg:top-0 lg:flex ${
            sidebarOpen ? "w-72" : "w-24"
          }`}
        >
          <div className={`mb-4 flex items-center ${sidebarOpen ? "justify-between" : "justify-center"}`}>
            {sidebarOpen ? (
              <Link href="/" className="inline-flex items-center" aria-label="Go to Hubble home">
                <Image src="/logo.png" alt="Hubble logo" width={156} height={52} className="h-10 w-auto object-contain" priority />
              </Link>
            ) : null}
            <Button
              size="icon"
              type="button"
              onClick={() => setSidebarOpen((v) => !v)}
              title={sidebarOpen ? "Collapse sidebar" : "Expand sidebar"}
              variant="ghost"
              className="h-9 w-9 rounded-lg text-slate-600 hover:bg-red-50 hover:text-red-700"
            >
              {sidebarOpen ? <PanelLeftClose className="h-4 w-4" /> : <PanelLeftOpen className="h-4 w-4" />}
            </Button>
          </div>

          <nav className="space-y-1.5 text-sm">
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <Link key={item.href} href={item.href} className={linkClass(item.href, !sidebarOpen)}>
                  <Icon className="h-4 w-4 shrink-0" />
                  {sidebarOpen ? <span className="font-medium">{item.label}</span> : null}
                </Link>
              );
            })}
          </nav>

          <Button
            size={sidebarOpen ? "sm" : "icon"}
            className={`mt-4 border border-red-200 bg-red-50 text-red-700 hover:bg-red-100 ${sidebarOpen ? "w-full justify-start gap-2" : "h-9 w-9 self-center p-0"}`}
            onClick={startNewChat}
          >
            {sidebarOpen ? (
              <>
                <Sparkles className="h-4 w-4" />
                <span>New chat</span>
              </>
            ) : (
              <Sparkles className="h-4 w-4" />
            )}
          </Button>

          {sidebarOpen ? (
            <div className="mt-8 flex min-h-0 flex-1 flex-col">
              <p className="px-3 text-xs uppercase tracking-wide text-slate-500">Today</p>
              <div className="mt-2 min-h-0 space-y-1 overflow-y-auto pr-1 text-sm">
                {chatTitles.length ? (
                  chatTitles.map((item) => (
                    <div
                      key={item.id}
                      className="group flex items-center gap-1 rounded-lg px-2 py-1 text-slate-600 transition-colors hover:bg-red-50 hover:text-red-700"
                      title={item.title}
                    >
                      <button
                        className="flex-1 rounded-md px-1 py-1 text-left text-sm"
                        type="button"
                        onClick={() => router.push(`/dashboard?chat=${encodeURIComponent(item.id)}`)}
                      >
                        <span className="line-clamp-1">{item.title}</span>
                      </button>
                      <button
                        type="button"
                        aria-label={`Delete chat ${item.title}`}
                        onClick={() => deleteChatTitle(item.id)}
                        className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md text-slate-400 hover:bg-red-100 hover:text-red-700"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  ))
                ) : (
                  <p className="px-3 py-2 text-xs text-slate-400">No chats yet</p>
                )}
              </div>
            </div>
          ) : null}

          <div className="mt-auto">
            {isAuthenticated ? (
              <Button
                size="sm"
                className={`border border-red-200 bg-red-50 text-red-700 hover:bg-red-100 ${sidebarOpen ? "w-full justify-start gap-2" : "mx-auto h-9 w-9 p-0"}`}
                onClick={logout}
              >
                <LogOut className="h-4 w-4" />
                {sidebarOpen ? "Sign out" : null}
              </Button>
            ) : (
              <Button
                asChild
                size="sm"
                className={`border border-red-200 bg-red-50 text-red-700 hover:bg-red-100 ${sidebarOpen ? "w-full justify-start gap-2" : "mx-auto h-9 w-9 p-0"}`}
              >
                <Link href="/login?next=/dashboard">
                  <LogIn className="h-4 w-4" />
                  {sidebarOpen ? "Login / Signup" : null}
                </Link>
              </Button>
            )}
          </div>
        </aside>

        {mobileMenuOpen ? (
          <div className="fixed inset-0 z-40 bg-black/20 lg:hidden" onClick={() => setMobileMenuOpen(false)}>
            <div
              className="h-full w-72 border-r border-red-100 bg-white p-4"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="mb-4 flex items-center justify-between">
                <Link href="/" className="inline-flex items-center" onClick={() => setMobileMenuOpen(false)} aria-label="Go to Hubble home">
                  <Image src="/logo.png" alt="Hubble logo" width={148} height={50} className="h-9 w-auto object-contain" />
                </Link>
                <Button
                  size="icon"
                  onClick={() => setMobileMenuOpen(false)}
                  variant="ghost"
                  className="h-9 w-9 rounded-lg text-slate-600 hover:bg-red-50 hover:text-red-700"
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
              </div>
              <nav className="space-y-1.5 text-sm">
                {navItems.map((item) => {
                  const Icon = item.icon;
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={linkClass(item.href)}
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      <Icon className="h-4 w-4 shrink-0" />
                      <span className="font-medium">{item.label}</span>
                    </Link>
                  );
                })}
              </nav>
            </div>
          </div>
        ) : null}

        <main className="min-w-0 flex-1">
          {!hideTopNav ? (
            <header className="sticky top-0 z-30 border-b border-red-100 bg-white/90 backdrop-blur">
              <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-8">
                <div className="flex items-center gap-3 lg:hidden">
                  <Button
                    size="icon"
                    onClick={() => setMobileMenuOpen(true)}
                    variant="ghost"
                    className="h-9 w-9 rounded-lg text-slate-600 hover:bg-red-50 hover:text-red-700"
                  >
                    <Menu className="h-5 w-5" />
                  </Button>
                  <Image src="/logo.png" alt="Hubble logo" width={132} height={44} className="h-8 w-auto object-contain" />
                </div>
                {title ? (
                  <div className="hidden lg:block">
                    <h1 className="text-lg font-semibold tracking-tight">{title}</h1>
                  </div>
                ) : (
                  <div className="hidden lg:block" />
                )}
                {isAuthenticated ? (
                  <Button
                    size="sm"
                    onClick={logout}
                    className="border border-red-200 bg-red-50 text-red-700 hover:bg-red-100 lg:hidden"
                  >
                    Sign out
                  </Button>
                ) : (
                  <Button
                    asChild
                    size="sm"
                    className="border border-red-200 bg-red-50 text-red-700 hover:bg-red-100 lg:hidden"
                  >
                    <Link href="/login?next=/dashboard">Login / Signup</Link>
                  </Button>
                )}
              </div>
            </header>
          ) : null}

          <section data-sidebar-open={sidebarOpen} className="group/app mx-auto w-full max-w-7xl px-4 py-10 sm:px-8">
            {hideTopNav ? (
              <div className="mb-4 flex items-center justify-between lg:hidden">
                <Button
                  size="icon"
                  onClick={() => setMobileMenuOpen(true)}
                  variant="ghost"
                  className="h-9 w-9 rounded-lg text-slate-600 hover:bg-red-50 hover:text-red-700"
                >
                  <Menu className="h-5 w-5" />
                </Button>
                {isAuthenticated ? (
                  <Button
                    size="sm"
                    onClick={logout}
                    className="border border-red-200 bg-red-50 text-red-700 hover:bg-red-100"
                  >
                    Sign out
                  </Button>
                ) : (
                  <Button
                    asChild
                    size="sm"
                    className="border border-red-200 bg-red-50 text-red-700 hover:bg-red-100"
                  >
                    <Link href="/login?next=/dashboard">Login / Signup</Link>
                  </Button>
                )}
              </div>
            ) : null}
            {title ? (
              <div className="mb-6 hidden lg:block">
                <h1 className="text-3xl font-bold tracking-tight">{title}</h1>
                {subtitle ? <p className="mt-2 text-sm text-slate-600">{subtitle}</p> : null}
              </div>
            ) : null}
            {subtitle ? <p className="mb-6 text-sm text-slate-600 lg:hidden">{subtitle}</p> : null}
            {children}
          </section>
        </main>
      </div>
    </div>
  );
}

