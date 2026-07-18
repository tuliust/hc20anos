import { useState, useEffect, useRef, useCallback, lazy, Suspense } from "react";
import type { Session } from "@supabase/supabase-js";
import { DEV_MODE, supabase } from "../lib/supabase";
import {
  getPeople,
  getTicketTypes,
  getCurrentAdminUser,
  writeAudit,
  MOCK_PEOPLE,
  getEventSettings,
  getApprovedPhotos,
  getApprovedMemories,
  getAttendanceIntentPersonIds,
  getHomePageContent,
  type HomePageContent,
} from "../lib/services";
import type {
  DbPerson,
  DbTicketType,
  DbEvent,
  DbPhoto,
  DbMemory,
  PaymentStatus,
} from "../lib/database.types";
import { RefreshCw } from "lucide-react";

// ─── TYPES ─────────────────────────────────────────────────────────────────────

import { Page, AuthState, DEFAULT_EVENT_ID, Btn, Header, Footer } from "./shared";

const LandingPage = lazy(() => import("./pages/public/HomePages").then(module => ({ default: module.LandingPage })));
const EventPage = lazy(() => import("./pages/public/HomePages").then(module => ({ default: module.EventPage })));
const TicketsPage = lazy(() => import("./pages/public/HomePages").then(module => ({ default: module.TicketsPage })));
const ConfirmationPage = lazy(() => import("./pages/public/PublicPages").then(module => ({ default: module.ConfirmationPage })));
const WhoGoingPage = lazy(() => import("./pages/public/PublicPages").then(module => ({ default: module.WhoGoingPage })));
const TheClassPage = lazy(() => import("./pages/public/PublicPages").then(module => ({ default: module.TheClassPage })));
const ExAlumniPage = lazy(() => import("./pages/public/PublicPages").then(module => ({ default: module.ExAlumniPage })));
const ClaimProfilePage = lazy(() => import("./pages/public/PublicPages").then(module => ({ default: module.ClaimProfilePage })));
const PhotoWallPage = lazy(() => import("./pages/public/PublicPages").then(module => ({ default: module.PhotoWallPage })));
const PhotoDetailPage = lazy(() => import("./pages/public/PublicPages").then(module => ({ default: module.PhotoDetailPage })));
const MemoriesPage = lazy(() => import("./pages/public/PublicPages").then(module => ({ default: module.MemoriesPage })));
const CuriositiesPage = lazy(() => import("./pages/public/PublicPages").then(module => ({ default: module.CuriositiesPage })));
const WhereNowPage = lazy(() => import("./pages/public/PublicPages").then(module => ({ default: module.WhereNowPage })));
const ShareInvitePage = lazy(() => import("./pages/public/PublicPages").then(module => ({ default: module.ShareInvitePage })));
const MyTicketPage = lazy(() => import("./pages/public/PublicPages").then(module => ({ default: module.MyTicketPage })));
const ArchivePage = lazy(() => import("./pages/public/PublicPages").then(module => ({ default: module.ArchivePage })));
const AlumniDashboardPage = lazy(() => import("./pages/auth/AuthPages").then(module => ({ default: module.AlumniDashboardPage })));
const EditProfilePage = lazy(() => import("./pages/auth/AuthPages").then(module => ({ default: module.EditProfilePage })));
const LoginPage = lazy(() => import("./pages/auth/LoginPage").then(module => ({ default: module.LoginPage })));
const AdminPage = lazy(() => import("./pages/admin/AdminPage").then(module => ({ default: module.AdminPage })));
const CheckinPage = lazy(() => import("./pages/checkin/CheckinPage").then(module => ({ default: module.CheckinPage })));
const SecureCheckoutPage = lazy(() => import("./SecureCheckoutPage").then(module => ({ default: module.SecureCheckoutPage })));
const TermsPage = lazy(() => import("./pages/public/LegalPages").then(module => ({ default: module.TermsPage })));
const PrivacyPage = lazy(() => import("./pages/public/LegalPages").then(module => ({ default: module.PrivacyPage })));

type CheckoutReturnState = { status: PaymentStatus | "cancelled"; publicToken: string } | null;
type AdminNavigationGuard = (action: () => void) => void;

function RouteFallback() {
  return (
    <div className="min-h-[50vh] flex items-center justify-center" role="status" aria-live="polite">
      <div className="flex flex-col items-center gap-4">
        <div className="w-10 h-10 border-2 border-[#2d6a4f] border-t-transparent rounded-full animate-spin" />
        <p className="text-[#7a9a7a] font-mono text-xs uppercase tracking-widest">Carregando página...</p>
      </div>
    </div>
  );
}

const PROTECTED_ALUMNI: Page[] = ["alumni-area", "edit-profile", "my-ticket", "checkout"];
const PROTECTED_ADMIN:  Page[] = ["admin", "checkin"];

const PAGE_PATHS: Record<Page, string> = {
  home: "/",
  event: "/evento",
  tickets: "/ingressos",
  checkout: "/checkout",
  confirmation: "/confirmacao",
  "who-going": "/quem-vai",
  "the-class": "/turma",
  "ex-alumni": "/ex-alunos",
  "claim-profile": "/reivindicar-perfil",
  "photo-wall": "/nossa-historia",
  "photo-detail": "/foto",
  memories: "/nossa-historia/memorias",
  curiosities: "/curiosidades",
  polls: "/curiosidades",
  "where-now": "/mapa",
  "share-invite": "/convite",
  "my-ticket": "/meu-ingresso",
  archive: "/pos-festa",
  "alumni-area": "/minha-area",
  "edit-profile": "/editar-perfil",
  admin: "/admin",
  checkin: "/checkin",
  login: "/login",
  terms: "/termos",
  privacy: "/privacidade",
};

function pageFromPathname(pathname: string): Page {
  const normalized = pathname.replace(/\/+$/, "") || "/";
  const legacyRoutes: Record<string, Page> = {
    "/fotos": "photo-wall",
    "/memorias": "memories",
    "/acervo": "archive",
    "/enquetes": "curiosities",
  };
  if (legacyRoutes[normalized]) return legacyRoutes[normalized];
  if (normalized.startsWith("/admin/")) return "admin";
  const found = (Object.entries(PAGE_PATHS) as [Page, string][]).find(([, path]) => path === normalized);
  return found?.[0] ?? "home";
}

function updateBrowserPath(nextPage: Page) {
  if (typeof window === "undefined") return;
  const nextPath = PAGE_PATHS[nextPage] ?? "/";
  if (window.location.pathname !== nextPath) {
    window.history.pushState({}, "", nextPath);
    window.dispatchEvent(new Event("pushstate"));
  }
}

function ScrollToTop({ pathname }: { pathname: string }) {
  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: "auto" });
  }, [pathname]);
  return null;
}

function inferFaviconType(url: string) {
  const cleanUrl = url.split("?")[0]?.toLowerCase() ?? "";
  if (cleanUrl.endsWith(".svg")) return "image/svg+xml";
  if (cleanUrl.endsWith(".ico")) return "image/x-icon";
  if (cleanUrl.endsWith(".webp")) return "image/webp";
  if (cleanUrl.endsWith(".jpg") || cleanUrl.endsWith(".jpeg")) return "image/jpeg";
  return "image/png";
}

function applyDocumentFavicon(url?: string | null) {
  if (typeof document === "undefined") return;

  const faviconUrl = url?.trim();
  const managedLink = document.querySelector<HTMLLinkElement>('link[data-managed-favicon="true"]');

  if (!faviconUrl) {
    managedLink?.remove();
    return;
  }

  const link = managedLink ?? document.querySelector<HTMLLinkElement>('link[rel~="icon"]') ?? document.createElement("link");
  link.rel = "icon";
  link.type = inferFaviconType(faviconUrl);
  link.href = faviconUrl;
  link.dataset.managedFavicon = "true";

  if (!link.parentNode) document.head.appendChild(link);
}

export default function App() {
  const initialPage = pageFromPathname(window.location.pathname);
  const [page, setPage]               = useState<Page>(initialPage);
  const [returnPage, setReturnPage]   = useState<Page>(initialPage);
  const [auth, setAuth]               = useState<AuthState>({ loggedIn: false, isAdmin: false, name: "", userId: "", role: null });
  const [people, setPeople]           = useState<DbPerson[]>(MOCK_PEOPLE);
  const [ticketTypes, setTicketTypes] = useState<DbTicketType[]>([]);
  const [event, setEvent] = useState<DbEvent | null>(null);
  const [selectedTicketTypeId, setSelectedTicketTypeId] = useState<string | null>(null);
  const [checkoutReturn, setCheckoutReturn] = useState<CheckoutReturnState>(null);
  const [approvedPhotos, setApprovedPhotos] = useState<DbPhoto[]>([]);
  const [approvedMemories, setApprovedMemories] = useState<DbMemory[]>([]);
  const [attendanceIntentPersonIds, setAttendanceIntentPersonIds] = useState<Set<string>>(() => new Set());
  const [selectedPhotoId, setSelectedPhotoId] = useState<string | null>(null);
  const [homeContent, setHomeContent] = useState<HomePageContent | null>(null);
  const [homeContentLoaded, setHomeContentLoaded] = useState(false);
  const [homeContentError, setHomeContentError] = useState<string | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const homeContentRequestRef = useRef(0);
  const pageRef = useRef<Page>(initialPage);
  const currentBrowserUrlRef = useRef(`${window.location.pathname}${window.location.search}`);
  const navigationGuardRef = useRef<AdminNavigationGuard | null>(null);
  const allowNextPopstateRef = useRef(false);
  pageRef.current = page;

  const registerAdminNavigationGuard = useCallback((guard: AdminNavigationGuard | null) => {
    navigationGuardRef.current = guard;
  }, []);

  useEffect(() => {
    applyDocumentFavicon(homeContent?.favicon_url ?? null);
  }, [homeContent?.favicon_url]);

  // ── Inicializa sessão Supabase e escuta mudanças ──────────────────────────
  useEffect(() => {
    let active = true;
    let authRequestId = 0;

    const setSignedOut = () => {
      authRequestId += 1;
      if (active) setAuth({ loggedIn: false, isAdmin: false, name: "", userId: "", role: null });
    };

    const hydrateSession = async (session: Session | null) => {
      if (!session?.user) {
        setSignedOut();
        return;
      }

      const requestId = authRequestId + 1;
      authRequestId = requestId;
      const user = session.user;
      const adminUser = await getCurrentAdminUser(user.id).catch(() => null);
      if (!active || authRequestId !== requestId) return;

      const name = user.user_metadata?.full_name ?? user.email?.split("@")[0] ?? "Usuário";
      setAuth({
        loggedIn: true,
        isAdmin: Boolean(adminUser),
        name,
        userId: user.id,
        email: user.email,
        role: adminUser?.role ?? null,
      });
    };

    supabase.auth.getSession()
      .then(({ data: { session }, error }) => {
        if (error) throw error;
        return hydrateSession(session);
      })
      .catch(() => setSignedOut())
      .finally(() => {
        if (active) setAuthLoading(false);
      });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "INITIAL_SESSION") return;
      if (event === "SIGNED_OUT" || !session) {
        setSignedOut();
        return;
      }

      // Supabase pode bloquear chamadas feitas dentro do callback de auth.
      // O timer garante que a consulta de permissões rode depois que o callback terminar.
      window.setTimeout(() => {
        if (active) void hydrateSession(session);
      }, 0);
    });

    return () => {
      active = false;
      authRequestId += 1;
      subscription.unsubscribe();
    };
  }, []);

  // ── Carrega dados reais do Supabase com fallback para mock ────────────────
  function refreshPublicEventData() {
    getEventSettings().then(setEvent).catch(() => setEvent(null));
    getTicketTypes(DEFAULT_EVENT_ID).then(setTicketTypes).catch(() => setTicketTypes([]));
    const requestId = homeContentRequestRef.current + 1;
    homeContentRequestRef.current = requestId;
    setHomeContentLoaded(false);
    setHomeContentError(null);
    getHomePageContent(DEFAULT_EVENT_ID)
      .then(content => {
        if (homeContentRequestRef.current !== requestId) return;
        setHomeContent(content);
      })
      .catch(error => {
        if (homeContentRequestRef.current !== requestId) return;
        setHomeContent(null);
        setHomeContentError(error instanceof Error ? error.message : "Não foi possível carregar o conteúdo da Home.");
      })
      .finally(() => {
        if (homeContentRequestRef.current === requestId) setHomeContentLoaded(true);
      });
    getApprovedMemories(DEFAULT_EVENT_ID).then(setApprovedMemories).catch(() => setApprovedMemories([]));
    getAttendanceIntentPersonIds().then(setAttendanceIntentPersonIds).catch(() => setAttendanceIntentPersonIds(new Set()));
  }

  useEffect(() => {
    getPeople().then(setPeople).catch(() => DEV_MODE && setPeople(MOCK_PEOPLE));
    getApprovedPhotos(DEFAULT_EVENT_ID).then(setApprovedPhotos).catch(() => DEV_MODE && setApprovedPhotos([]));
    getApprovedMemories(DEFAULT_EVENT_ID).then(setApprovedMemories).catch(() => DEV_MODE && setApprovedMemories([]));
    getAttendanceIntentPersonIds().then(setAttendanceIntentPersonIds).catch(() => setAttendanceIntentPersonIds(new Set()));
    refreshPublicEventData();
  }, []);

  useEffect(() => {
    const rememberBrowserUrl = () => {
      currentBrowserUrlRef.current = `${window.location.pathname}${window.location.search}`;
    };
    const onPopState = (event: PopStateEvent) => {
      if (allowNextPopstateRef.current) {
        allowNextPopstateRef.current = false;
        rememberBrowserUrl();
        setPage(pageFromPathname(window.location.pathname));
        return;
      }

      const navigationGuard = pageRef.current === "admin" ? navigationGuardRef.current : null;
      if (navigationGuard) {
        event.stopImmediatePropagation();
        window.history.pushState({}, "", currentBrowserUrlRef.current);
        navigationGuard(() => {
          allowNextPopstateRef.current = true;
          window.history.back();
        });
        return;
      }

      rememberBrowserUrl();
      setPage(pageFromPathname(window.location.pathname));
    };
    window.addEventListener("popstate", onPopState);
    window.addEventListener("pushstate", rememberBrowserUrl);
    return () => {
      window.removeEventListener("popstate", onPopState);
      window.removeEventListener("pushstate", rememberBrowserUrl);
    };
  }, []);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const status = params.get("checkout");
    const publicToken = params.get("token") ?? params.get("order");
    const validStatuses = ["pending", "in_process", "approved", "rejected", "expired", "cancelled", "refunded", "charged_back"];
    if (status && publicToken && validStatuses.includes(status)) {
      setCheckoutReturn({ status: status as PaymentStatus | "cancelled", publicToken });
      setPage("checkout");
    }
  }, []);

  useEffect(() => {
    if (authLoading) return;
    if (PROTECTED_ADMIN.includes(page) && !auth.isAdmin) {
      setReturnPage(page);
      setPage("login");
      updateBrowserPath("login");
    }
    if (PROTECTED_ALUMNI.includes(page) && !auth.loggedIn) {
      setReturnPage(page);
      setPage("login");
      updateBrowserPath("login");
    }
  }, [authLoading, auth.isAdmin, auth.loggedIn, page]);

  function performNavigation(p: Page) {
    if (PROTECTED_ADMIN.includes(p)  && !auth.isAdmin)  { setReturnPage(p); setPage("login"); updateBrowserPath("login"); return; }
    if (PROTECTED_ALUMNI.includes(p) && !auth.loggedIn) { setReturnPage(p); setPage("login"); updateBrowserPath("login"); return; }
    if (p === "home") refreshPublicEventData();
    setPage(p);
    updateBrowserPath(p);
  }

  function navigate(p: Page) {
    const navigationGuard = page === "admin" ? navigationGuardRef.current : null;
    if (navigationGuard && p !== "admin") {
      navigationGuard(() => performNavigation(p));
      return;
    }
    performNavigation(p);
  }

  if (authLoading) {
    return (
      <div className="min-h-screen bg-[#0d1a0f] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-2 border-[#2d6a4f] border-t-transparent rounded-full animate-spin" />
          <p className="text-[#7a9a7a] font-mono text-xs uppercase tracking-widest">Carregando...</p>
        </div>
      </div>
    );
  }

  if (page === "home" && !homeContentLoaded) {
    return (
      <div className="min-h-screen bg-[#0d1a0f] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-2 border-[#2d6a4f] border-t-transparent rounded-full animate-spin" />
          <p className="text-[#7a9a7a] font-mono text-xs uppercase tracking-widest">Carregando conteúdo...</p>
        </div>
      </div>
    );
  }

  if (page === "home" && (!homeContent || homeContentError)) {
    return (
      <div className="min-h-screen bg-[#0d1a0f] flex items-center justify-center px-6">
        <div className="max-w-md border border-[#2d6a4f]/30 bg-[#141f14] p-8 text-center">
          <p className="text-[#7a9a7a] font-mono text-xs uppercase tracking-[0.2em] mb-4">Conteúdo indisponível</p>
          <h1 className="font-['Playfair_Display'] text-[#f0ebe0] text-3xl font-bold leading-tight mb-4">Não foi possível carregar a Home</h1>
          <p className="text-[#7a9a7a] text-sm leading-relaxed mb-6">{homeContentError ?? "O Supabase não retornou conteúdo para a Home."}</p>
          <Btn onClick={refreshPublicEventData}><RefreshCw size={16} />Tentar novamente</Btn>
        </div>
      </div>
    );
  }

  function handleLogin(nextAuth: AuthState) {
    setAuth(nextAuth);
    const canUseReturnPage =
      returnPage !== "login" &&
      (!PROTECTED_ADMIN.includes(returnPage) || nextAuth.isAdmin) &&
      (!PROTECTED_ALUMNI.includes(returnPage) || nextAuth.loggedIn);
    const dest = canUseReturnPage ? returnPage : nextAuth.isAdmin ? "admin" : "alumni-area";
    setReturnPage("home");
    setPage(dest);
    updateBrowserPath(dest);
  }

  async function logout() {
    const previousUserId = auth.userId;
    if (previousUserId) void writeAudit("logout", "auth", previousUserId, {}).catch(() => {});
    try {
      await supabase.auth.signOut().catch(() => {});
    } finally {
      setAuth({ loggedIn: false, isAdmin: false, name: "", userId: "", role: null });
      setReturnPage("home");
      setPage("home");
      updateBrowserPath("home");
    }
  }

  const isFullscreen = page === "admin" || page === "checkin";

  return (
    <div data-app-root className="min-h-screen bg-background text-foreground" style={{ fontFamily: "'DM Sans', system-ui, sans-serif" }}>
      <ScrollToTop pathname={PAGE_PATHS[page] ?? "/"} />
      {!isFullscreen && <Header page={page} navigate={navigate} auth={auth} logout={logout} content={homeContent ?? undefined} />}
      <main data-app-main>
        <Suspense fallback={<RouteFallback />}>
        {page === "home"          && <LandingPage      navigate={navigate} people={people} photos={approvedPhotos} memories={approvedMemories} attendanceIntentPersonIds={attendanceIntentPersonIds} content={homeContent as HomePageContent} event={event} ticketTypes={ticketTypes} auth={auth} onSelectTicket={(id) => { setSelectedTicketTypeId(id); setCheckoutReturn(null); }} />}
        {page === "event"         && <EventPage        navigate={navigate} event={event}                             />}
        {page === "tickets"       && <TicketsPage       navigate={navigate} ticketTypes={ticketTypes} onSelectTicket={(id) => { setSelectedTicketTypeId(id); setCheckoutReturn(null); }} />}
        {page === "checkout"      && <SecureCheckoutPage navigate={navigate} auth={auth} ticketTypes={ticketTypes} selectedTicketTypeId={selectedTicketTypeId} checkoutReturn={checkoutReturn} />}
        {page === "confirmation"  && <ConfirmationPage  navigate={navigate}                                        />}
        {page === "who-going"     && <WhoGoingPage      navigate={navigate} people={people}                       />}
        {page === "the-class"     && <TheClassPage      navigate={navigate} people={people}                       />}
        {page === "ex-alumni"     && <ExAlumniPage      navigate={navigate} people={people}                       />}
        {page === "claim-profile" && <ClaimProfilePage  navigate={navigate} people={people} auth={auth}           />}
        {page === "photo-wall"    && <PhotoWallPage      navigate={navigate} auth={auth} photos={approvedPhotos} onSelectPhoto={setSelectedPhotoId} />}
        {page === "photo-detail"  && <PhotoDetailPage    navigate={navigate} people={people} auth={auth} photo={approvedPhotos.find(p => p.id === selectedPhotoId) ?? approvedPhotos[0] ?? null} />}
        {page === "memories"      && <MemoriesPage       navigate={navigate} auth={auth}                              />}
        {(page === "curiosities" || page === "polls") && <CuriositiesPage    navigate={navigate} auth={auth}                              />}
        {page === "where-now"     && <WhereNowPage       navigate={navigate} people={people}                         />}
        {page === "share-invite"  && <ShareInvitePage    navigate={navigate} auth={auth}                           />}
        {page === "my-ticket"     && <MyTicketPage       navigate={navigate} auth={auth}                           />}
        {page === "archive"       && <ArchivePage        navigate={navigate} auth={auth} photos={approvedPhotos} people={people} />}
        {page === "alumni-area"   && <AlumniDashboardPage navigate={navigate} auth={auth}                         />}
        {page === "edit-profile"  && <EditProfilePage   navigate={navigate} auth={auth}                           />}
        {page === "admin"         && auth.isAdmin && <AdminPage navigate={navigate} auth={auth} onHomeContentUpdated={setHomeContent} registerNavigationGuard={registerAdminNavigationGuard} />}
        {page === "checkin"       && <CheckinPage        navigate={navigate} auth={auth}                           />}
        {page === "login"         && <LoginPage          navigate={navigate} onLogin={handleLogin}                 />}
        {page === "terms"         && <TermsPage          navigate={navigate}                                        />}
        {page === "privacy"       && <PrivacyPage        navigate={navigate}                                        />}
        </Suspense>
      </main>
      {!isFullscreen && <Footer navigate={navigate} content={homeContent ?? undefined} />}
    </div>
  );
}
