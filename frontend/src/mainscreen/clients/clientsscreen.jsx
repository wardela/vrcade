import { useEffect, useState } from "react";
import ClientCard from "./clientcard";
import api from "../../utils/axiosInstance";
import CreateClientModal from "./createclientmodal";
import ClientProfileScreen from "./clientprofilescreen";
import { useTranslation } from "react-i18next";
export default function ClientsScreen() {
  const [clients, setClients] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [selectedClient, setSelectedClient] = useState(null);
  const {t} = useTranslation();

  useEffect(() => {
    loadClients();
  }, []);

  const loadClients = async () => {
    setLoading(true);
    try {
const res = await api.get("/api/invoices/clients");
      const data = res.data; // ✅
      setClients(data);
    } catch (err) {
      console.error("Failed to load clients", err);
    }
    setLoading(false);
  };

  // ===== Permissions =====
  let permissions = {};
  try {
    const raw = localStorage.getItem("permissions");
    permissions = raw ? JSON.parse(raw) : {};
  } catch {
    permissions = {};
  }

  const clientPerm = permissions?.clients || {};
  const canAddClient = clientPerm.add === true;

  const filtered = clients.filter(
    c =>
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      (c.phone || "").includes(search)
  );

  if (selectedClient) {
    return (
      <ClientProfileScreen
        client={selectedClient}
        onBack={() => setSelectedClient(null)}
      />
    );
  }

  return (
    <div className="flex flex-col w-full h-full bg-base-200">

      {/* Header */}
<div className="sticky top-0 z-10 bg-white border-b">

  {/* Top Row — Title + Primary Action */}
  <div className="px-6 py-4 flex items-center justify-between">
    <div className="flex flex-col">
      <h1 className="text-2xl font-semibold text-gray-800 leading-tight">
        {t("ClientsScreen.title")}
      </h1>
      <span className="text-sm text-gray-500">
        {t("ClientsScreen.subtitle")}
      </span>
    </div>

    {canAddClient && (
      <button
        onClick={() => setCreateModalOpen(true)}
        className="
          inline-flex items-center gap-2
          px-5 py-2.5
          bg-[#2f788a] text-white
          rounded-lg font-medium
          shadow-sm
          hover:bg-[#276472]
          transition
        "
      >
        <span className="text-lg leading-none">+</span>
        {t("ClientsScreen.actions.add_client")}
      </button>
    )}
  </div>

  {/* Bottom Row — Search / Filters */}
  <div className="px-6 py-3 bg-gray-50 border-t">
    <div className="flex items-center gap-4">
      <div className="relative w-full md:w-1/3">
        <input
          type="text"
          placeholder={t("ClientsScreen.search.placeholder")}
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="
            w-full
            pl-10 pr-4 py-2.5
            border border-gray-300
            rounded-lg
            text-sm
            focus:outline-none
            focus:ring-2 focus:ring-[#2f788a]/40
            bg-white
          "
        />

        {/* Search Icon */}
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth={1.5}
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M21 21l-4.35-4.35m1.35-5.65a7 7 0 1 1-14 0a7 7 0 0 1 14 0Z"
          />
        </svg>
      </div>
    </div>
  </div>
</div>


      {/* Scrollable Content */}
      <div className="flex-1 overflow-hidden p-4">
        <div className="
          h-full overflow-y-auto
          bg-white border border-gray-200
          rounded-xl shadow-lg
          p-5
        ">
          {loading ? (
            <div className="text-gray-500 text-center py-10">
              {t("ClientsScreen.states.loading")}
            </div>
          ) : filtered.length > 0 ? (
            <div className="
              grid grid-cols-1
              sm:grid-cols-2
              lg:grid-cols-3
              xl:grid-cols-4
              gap-4
            ">
              {filtered.map(client => (
                <ClientCard
                  key={client.id}
                  client={client}
                  onClick={setSelectedClient}
                />
              ))}
            </div>
          ) : (
            <div className="text-gray-500 text-center py-16">
              {t("ClientsScreen.states.empty")}
            </div>
          )}
        </div>
      </div>

      {createModalOpen && (
        <CreateClientModal
          isOpen={createModalOpen}
          onClose={() => setCreateModalOpen(false)}
          onCreated={loadClients}
        />
      )}
    </div>
  );
}
