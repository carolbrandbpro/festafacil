import { useEffect, useRef, useState } from "react";
import { ArrowUp } from "lucide-react";
import { cn } from "@/lib/utils";
import { useIsMobile } from "@/hooks/use-mobile";
import { Dashboard } from "@/components/Dashboard";
import { GuestList } from "@/components/GuestList";
import { AccommodationView } from "@/components/AccommodationView";
import { SettingsView } from "@/components/SettingsView";
import { BottomNav } from "@/components/BottomNav";
import { initialGuests } from "@/data/guests";
import { getArrivals, setArrived } from "@/lib/api";

type TabType = "dashboard" | "guests" | "accommodations" | "settings";

const Index = () => {
  const [activeTab, setActiveTab] = useState<TabType>("dashboard");
  const [guests, setGuests] = useState(() => {
    try {
      const raw = localStorage.getItem("isola.guests");
      if (!raw) return initialGuests;
      const data = JSON.parse(raw);
      return Array.isArray(data) ? data : initialGuests;
    } catch {
      return initialGuests;
    }
  });
  const [eventTitle, setEventTitle] = useState<string>(() => {
    const t = localStorage.getItem("isola.title");
    return t || "Isola 70";
  });
  const isMobile = useIsMobile();
  const contentRef = useRef<HTMLDivElement>(null);
  const [showTop, setShowTop] = useState(false);

  const renderContent = () => {
    switch (activeTab) {
      case "dashboard":
        return <Dashboard guests={guests} />;
      case "guests":
        return <GuestList guests={guests} />;
      case "accommodations":
        return <AccommodationView guests={guests} />;
      case "settings":
        return <SettingsView guests={guests} onImport={setGuests} />;
      default:
        return <Dashboard guests={guests} />;
    }
  };

  useEffect(() => {
    document.title = `${eventTitle} - Controle de Convidados`;
  }, [eventTitle]);

  useEffect(() => {
    try {
      localStorage.setItem("isola.guests", JSON.stringify(guests));
    } catch {
      void 0;
    }
  }, [guests]);

  useEffect(() => {
    try {
      localStorage.setItem("isola.title", eventTitle);
    } catch {
      void 0;
    }
  }, [eventTitle]);

  useEffect(() => {
    const el = (isMobile ? contentRef.current : window) as HTMLDivElement | (Window & typeof globalThis) | null;
    if (!el) return;
    const onScroll = () => {
      const y = isMobile ? (contentRef.current?.scrollTop || 0) : window.scrollY;
      setShowTop(y > 120);
    };
    onScroll();
    el.addEventListener("scroll", onScroll);
    return () => {
      el.removeEventListener("scroll", onScroll);
    };
  }, [isMobile]);

  useEffect(() => {
    (async () => {
      const map = await getArrivals();
      if (map && Object.keys(map).length) {
        setGuests((prev) => prev.map((g) => ({ ...g, arrived: !!map[g.id] })));
      }
    })();
  }, []);

  const scrollToTop = () => {
    if (isMobile) {
      contentRef.current?.scrollTo({ top: 0, behavior: "smooth" });
    } else {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <main
        className={cn(
          isMobile
            ? "container w-full px-3 h-[calc(100vh-3rem)] overflow-y-auto pb-3"
            : "container max-w-3xl mx-auto px-6 py-8 pb-20"
        )}
        ref={contentRef}
      >
        {activeTab === "dashboard" ? (
          <Dashboard guests={guests} title={eventTitle} />
        ) : activeTab === "guests" ? (
          <GuestList
            guests={guests}
            eventTitle={eventTitle}
            onToggleArrived={async (id, arrived) => {
              setGuests((prev) => prev.map((g) => (g.id === id ? { ...g, arrived } : g)));
              await setArrived(id, arrived);
            }}
          />
        ) : activeTab === "accommodations" ? (
          <AccommodationView guests={guests} />
        ) : (
          <SettingsView guests={guests} onImport={setGuests} eventTitle={eventTitle} onTitleChange={setEventTitle} />
        )}
      </main>
      {showTop && (
        <button
          onClick={scrollToTop}
          aria-label="Subir para o topo"
          className="fixed right-3 bottom-16 sm:bottom-20 z-50 rounded-full bg-primary text-primary-foreground shadow-lg p-3 hover:opacity-90"
        >
          <ArrowUp className="h-5 w-5" />
        </button>
      )}
      <BottomNav activeTab={activeTab} onTabChange={setActiveTab} />
    </div>
  );
};

export default Index;
