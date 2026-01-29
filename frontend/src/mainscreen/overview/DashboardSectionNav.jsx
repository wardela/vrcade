import { useEffect, useRef, useState } from "react";



const KpiIcon = ({ className }) => (
<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="size-6">
  <path stroke-linecap="round" stroke-linejoin="round" d="m4.5 18.75 7.5-7.5 7.5 7.5" />
  <path stroke-linecap="round" stroke-linejoin="round" d="m4.5 12.75 7.5-7.5 7.5 7.5" />
</svg>
);

const OverviewIcon = ({ className }) => (
<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="size-6">
  <path stroke-linecap="round" stroke-linejoin="round" d="M3.75 3v11.25A2.25 2.25 0 0 0 6 16.5h2.25M3.75 3h-1.5m1.5 0h16.5m0 0h1.5m-1.5 0v11.25A2.25 2.25 0 0 1 18 16.5h-2.25m-7.5 0h7.5m-7.5 0-1 3m8.5-3 1 3m0 0 .5 1.5m-.5-1.5h-9.5m0 0-.5 1.5m.75-9 3-3 2.148 2.148A12.061 12.061 0 0 1 16.5 7.605" />
</svg>
);

const SalesIcon = ({ className }) => (
<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-banknote-arrow-up-icon lucide-banknote-arrow-up"><path d="M12 18H4a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5"/><path d="M18 12h.01"/><path d="M19 22v-6"/><path d="m22 19-3-3-3 3"/><path d="M6 12h.01"/><circle cx="12" cy="12" r="2"/></svg>
);

const InventoryIcon = ({ className }) => (
<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="size-6">
  <path stroke-linecap="round" stroke-linejoin="round" d="m7.875 14.25 1.214 1.942a2.25 2.25 0 0 0 1.908 1.058h2.006c.776 0 1.497-.4 1.908-1.058l1.214-1.942M2.41 9h4.636a2.25 2.25 0 0 1 1.872 1.002l.164.246a2.25 2.25 0 0 0 1.872 1.002h2.092a2.25 2.25 0 0 0 1.872-1.002l.164-.246A2.25 2.25 0 0 1 16.954 9h4.636M2.41 9a2.25 2.25 0 0 0-.16.832V12a2.25 2.25 0 0 0 2.25 2.25h15A2.25 2.25 0 0 0 21.75 12V9.832c0-.287-.055-.57-.16-.832M2.41 9a2.25 2.25 0 0 1 .382-.632l3.285-3.832a2.25 2.25 0 0 1 1.708-.786h8.43c.657 0 1.281.287 1.709.786l3.284 3.832c.163.19.291.404.382.632M4.5 20.25h15A2.25 2.25 0 0 0 21.75 18v-2.625c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125V18a2.25 2.25 0 0 0 2.25 2.25Z" />
</svg>
);

const ClientsIcon = ({ className }) => (
<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="size-6">
  <path stroke-linecap="round" stroke-linejoin="round" d="M18 18.72a9.094 9.094 0 0 0 3.741-.479 3 3 0 0 0-4.682-2.72m.94 3.198.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0 1 12 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 0 1 6 18.719m12 0a5.971 5.971 0 0 0-.941-3.197m0 0A5.995 5.995 0 0 0 12 12.75a5.995 5.995 0 0 0-5.058 2.772m0 0a3 3 0 0 0-4.681 2.72 8.986 8.986 0 0 0 3.74.477m.94-3.197a5.971 5.971 0 0 0-.94 3.197M15 6.75a3 3 0 1 1-6 0 3 3 0 0 1 6 0Zm6 3a2.25 2.25 0 1 1-4.5 0 2.25 2.25 0 0 1 4.5 0Zm-13.5 0a2.25 2.25 0 1 1-4.5 0 2.25 2.25 0 0 1 4.5 0Z" />
</svg>
);

const ReceiptsIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="size-6">
  <path stroke-linecap="round" stroke-linejoin="round" d="M2.25 18.75a60.07 60.07 0 0 1 15.797 2.101c.727.198 1.453-.342 1.453-1.096V18.75M3.75 4.5v.75A.75.75 0 0 1 3 6h-.75m0 0v-.375c0-.621.504-1.125 1.125-1.125H20.25M2.25 6v9m18-10.5v.75c0 .414.336.75.75.75h.75m-1.5-1.5h.375c.621 0 1.125.504 1.125 1.125v9.75c0 .621-.504 1.125-1.125 1.125h-.375m1.5-1.5H21a.75.75 0 0 0-.75.75v.75m0 0H3.75m0 0h-.375a1.125 1.125 0 0 1-1.125-1.125V15m1.5 1.5v-.75A.75.75 0 0 0 3 15h-.75M15 10.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0Zm3 0h.008v.008H18V10.5Zm-12 0h.008v.008H6V10.5Z" />
</svg>
);

const SECTIONS = [
  { id: "kpis", label: "KPIs", icon: KpiIcon },
  { id: "overview", label: "Overview", icon: OverviewIcon },
  { id: "sales", label: "Sales", icon: SalesIcon },
  { id: "receipts", label: "Receipts", icon: ReceiptsIcon }, // 👈 ADD THIS
  { id: "inventory", label: "Inventory", icon: InventoryIcon },
  { id: "clients", label: "Clients", icon: ClientsIcon }
];

export default function DashboardSectionNav() {
  const [visible, setVisible] = useState(false);
  const [hovered, setHovered] = useState(false);
  const [active, setActive] = useState("kpis");

  const hideTimerRef = useRef(null);

  // -------------------------------
  // SCROLL ACTIVITY HANDLER
  // -------------------------------
  useEffect(() => {
    const container = document.getElementById("dashboard-scroll-container");
    if (!container) return;

    const onScroll = () => {
      // show immediately on scroll
      setVisible(true);

      // reset hide timer
      if (hideTimerRef.current) {
        clearTimeout(hideTimerRef.current);
      }

      hideTimerRef.current = setTimeout(() => {
        // hide ONLY if not hovered
        setVisible(false);
      }, 1200); // idle delay (ms)

      // update active section
      for (const s of SECTIONS) {
        const el = document.getElementById(s.id);
        if (!el) continue;

        const rect = el.getBoundingClientRect();
        if (rect.top >= 0 && rect.top < window.innerHeight * 0.4) {
          setActive(s.id);
          break;
        }
      }
    };

    container.addEventListener("scroll", onScroll);
    return () => {
      container.removeEventListener("scroll", onScroll);
      if (hideTimerRef.current) clearTimeout(hideTimerRef.current);
    };
  }, []);

  // -------------------------------
  // MOUSE PROXIMITY (RIGHT EDGE)
useEffect(() => {
  const onMouseMove = (e) => {
    const isRTL = document.documentElement.dir === "rtl";

    const nearEdge = isRTL
      ? e.clientX < 80                         // LEFT edge in RTL
      : window.innerWidth - e.clientX < 80;    // RIGHT edge in LTR

    setHovered(nearEdge);
  };

  window.addEventListener("mousemove", onMouseMove);
  return () => window.removeEventListener("mousemove", onMouseMove);
}, []);


  const scrollTo = (id) => {
    document.getElementById(id)?.scrollIntoView({
      behavior: "smooth",
      block: "start"
    });
  };

  // visibility decision
  if (!visible && !hovered) return null;

  return (
<div
  className={`fixed end-3 top-1/2 z-50 transition-all duration-300 ease-out
    ${visible || hovered
      ? "opacity-100 translate-x-0 pointer-events-auto"
      : "opacity-0 translate-x-6 pointer-events-none"
    }
    -translate-y-1/2
  `}
  onMouseEnter={() => setHovered(true)}
  onMouseLeave={() => setHovered(false)}
>
      <div className="bg-white border shadow-xl rounded-full px-2 py-3 flex flex-col gap-2">

        {SECTIONS.map((s) => (
<button
  key={s.id}
  onClick={() => scrollTo(s.id)}
  className={`w-10 h-10 rounded-full flex items-center justify-center transition-all
    ${active === s.id
      ? "bg-[#2f788a] text-white scale-105"
      : "bg-gray-100 text-gray-600 hover:bg-gray-200"
    }`}
  title={s.label}
>
  <s.icon className="w-5 h-5" />
</button>
        ))}

      </div>
    </div>
  );
}
