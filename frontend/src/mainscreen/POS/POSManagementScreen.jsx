import { useEffect, useState } from "react";
import api from "../../utils/axiosInstance";

const formatDateTime = (value) => {
  if (!value) return "—";

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return "—";

  return new Intl.DateTimeFormat(undefined, {
    year: "numeric",
    month: "short",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(parsed);
};

const formatCurrency = (value) => `${Number(value || 0).toFixed(3)} JOD`;
const formatCount = (value) =>
  Number(value || 0).toLocaleString(undefined, {
    minimumFractionDigits: Number(value || 0) % 1 === 0 ? 0 : 3,
    maximumFractionDigits: 3,
  });
const formatTokens = (value) => `${formatCount(value)} Tokens`;

const getApiMessage = (error, fallbackMessage) =>
  error?.response?.data?.message || fallbackMessage;

const readPermissions = () => {
  try {
    return JSON.parse(localStorage.getItem("permissions")) || {};
  } catch {
    return {};
  }
};

function NoAccess() {
  return (
    <div className="flex h-full w-full items-center justify-center bg-base-200 p-6">
      <div className="rounded-2xl border border-base-300 bg-white px-8 py-10 text-center shadow-xl">
        <h2 className="text-xl font-bold text-gray-900">POS Access Required</h2>
        <p className="mt-2 text-sm text-gray-600">
          Your account does not have permission to open POS management.
        </p>
      </div>
    </div>
  );
}

function StatusBadge({ active, activeLabel = "Active", inactiveLabel = "Inactive" }) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${
        active
          ? "bg-emerald-100 text-emerald-700"
          : "bg-slate-200 text-slate-600"
      }`}
    >
      {active ? activeLabel : inactiveLabel}
    </span>
  );
}

function POSPointModal({ open, onClose, onSubmit, submitting, initialData, canEdit }) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [isActive, setIsActive] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!open) return;

    setName(initialData?.name || "");
    setDescription(initialData?.description || "");
    setIsActive(initialData?.is_active ?? true);
    setError("");
  }, [initialData, open]);

  if (!open) return null;

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!name.trim()) {
      setError("POS station name is required.");
      return;
    }

    setError("");
    await onSubmit({
      name: name.trim(),
      description: description.trim(),
      is_active: isActive,
    });
  };

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/45 p-4">
      <div className="w-full max-w-lg rounded-3xl border border-base-300 bg-white shadow-2xl">
        <div className="border-b border-base-300 px-6 py-5">
          <h2 className="text-xl font-semibold text-gray-900">
            {initialData ? "Edit POS Station" : "Create POS Station"}
          </h2>
          <p className="mt-1 text-sm text-gray-500">
            Keep the station names clear so cashiers can pick the correct one quickly.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5 px-6 py-5">
          {error && (
            <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          )}

          <div>
            <label className="text-sm font-medium text-gray-700">Name</label>
            <input
              type="text"
              value={name}
              onChange={(event) => setName(event.target.value)}
              className="mt-2 w-full rounded-xl border border-gray-300 px-4 py-3 text-sm focus:border-[#2f788a] focus:outline-none focus:ring-2 focus:ring-[#2f788a]/20"
              placeholder="POS 1"
              disabled={submitting || !canEdit}
            />
          </div>

          <div>
            <label className="text-sm font-medium text-gray-700">Description</label>
            <textarea
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              rows={3}
              className="mt-2 w-full rounded-xl border border-gray-300 px-4 py-3 text-sm focus:border-[#2f788a] focus:outline-none focus:ring-2 focus:ring-[#2f788a]/20"
              placeholder="Optional note for this station"
              disabled={submitting || !canEdit}
            />
          </div>

          <label className="flex items-center justify-between rounded-2xl border border-base-300 bg-base-100 px-4 py-3">
            <div>
              <div className="text-sm font-medium text-gray-800">Station status</div>
              <div className="text-xs text-gray-500">
                Inactive stations cannot be selected when starting a POS session.
              </div>
            </div>

            <input
              type="checkbox"
              className="toggle toggle-info"
              checked={isActive}
              onChange={(event) => setIsActive(event.target.checked)}
              disabled={submitting || !canEdit}
            />
          </label>

          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              className="btn btn-outline"
              onClick={onClose}
              disabled={submitting}
            >
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={submitting || !canEdit}>
              {submitting ? "Saving..." : initialData ? "Save Changes" : "Create POS"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function SessionDetailModal({ sessionId, onClose }) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [session, setSession] = useState(null);
  const [showSoldItems, setShowSoldItems] = useState(false);

  useEffect(() => {
    if (!sessionId) return undefined;

    let cancelled = false;
    setShowSoldItems(false);

    const load = async () => {
      setLoading(true);
      setError("");

      try {
        const res = await api.get(`/api/pos-sessions/${sessionId}/detail`);
        if (!cancelled) {
          setSession(res.data);
        }
      } catch (err) {
        if (!cancelled) {
          setError(getApiMessage(err, "Failed to load session details"));
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    load();

    return () => {
      cancelled = true;
    };
  }, [sessionId]);

  if (!sessionId) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 p-4">
      <div className="max-h-[90vh] w-full max-w-4xl overflow-hidden rounded-3xl border border-base-300 bg-white shadow-2xl">
        <div className="flex items-start justify-between border-b border-base-300 px-6 py-5">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">Session Details</h2>
            <p className="mt-1 text-sm text-gray-500">
              Review the full POS session breakdown for monitoring and cash-up.
            </p>
          </div>

          <button type="button" className="btn btn-ghost btn-sm" onClick={onClose}>
            Close
          </button>
        </div>

        <div className="max-h-[calc(90vh-96px)] overflow-y-auto px-6 py-5">
          {loading ? (
            <div className="flex items-center gap-3 rounded-2xl border border-base-300 bg-base-100 px-4 py-4 text-sm text-gray-600">
              <span className="loading loading-spinner loading-md text-[#2f788a]"></span>
              Loading session details...
            </div>
          ) : error ? (
            <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          ) : session ? (
            <div className="space-y-5">
              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                <div className="rounded-2xl border border-base-300 bg-base-100 px-4 py-4">
                  <div className="text-xs uppercase tracking-wide text-gray-500">POS Station</div>
                  <div className="mt-2 text-lg font-semibold text-gray-900">
                    {session.pos_point_name || session.pos || "—"}
                  </div>
                  <div className="mt-1 text-sm text-gray-500">Session #{session.id}</div>
                </div>

                <div className="rounded-2xl border border-base-300 bg-base-100 px-4 py-4">
                  <div className="text-xs uppercase tracking-wide text-gray-500">Opened By</div>
                  <div className="mt-2 text-lg font-semibold text-gray-900">
                    {session.full_name || session.username || "—"}
                  </div>
                  <div className="mt-1 text-sm text-gray-500">{session.username || "—"}</div>
                </div>

                <div className="rounded-2xl border border-base-300 bg-base-100 px-4 py-4">
                  <div className="text-xs uppercase tracking-wide text-gray-500">Started</div>
                  <div className="mt-2 text-sm font-semibold text-gray-900">
                    {formatDateTime(session.started_at)}
                  </div>
                </div>

                <div className="rounded-2xl border border-base-300 bg-base-100 px-4 py-4">
                  <div className="text-xs uppercase tracking-wide text-gray-500">Ended</div>
                  <div className="mt-2 text-sm font-semibold text-gray-900">
                    {formatDateTime(session.ended_at)}
                  </div>
                  <div className="mt-2">
                    <StatusBadge
                      active={session.status === "active" && !session.ended_at}
                      activeLabel="Active Session"
                      inactiveLabel="Ended Session"
                    />
                  </div>
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                <SummaryCard label="Invoices" value={session.invoice_count || 0} />
                <SummaryCard label="Total Sales" value={formatCurrency(session.total_sales_amount)} />
                <SummaryCard
                  label="Total Tokens"
                  value={formatTokens(session.total_tokens_sold)}
                />
                <SummaryCard label="Cash" value={formatCurrency(session.payment_totals?.cash)} />
                <SummaryCard label="Card" value={formatCurrency(session.payment_totals?.card)} />
                <SummaryCard
                  label="Transfer"
                  value={formatCurrency(session.payment_totals?.transfer)}
                />
                <SummaryCard
                  label="Cash Received"
                  value={formatCurrency(session.total_cash_received)}
                />
                <SummaryCard
                  label="Change Given"
                  value={formatCurrency(session.total_change_given)}
                />
              </div>

              <div className="overflow-hidden rounded-2xl border border-base-300">
                <button
                  type="button"
                  className="flex w-full items-center justify-between border-b border-base-300 bg-base-100 px-4 py-3 text-left"
                  onClick={() => setShowSoldItems((prev) => !prev)}
                >
                  <div>
                    <h3 className="text-sm font-semibold text-gray-800">Sold Items Breakdown</h3>
                    <p className="mt-1 text-xs text-gray-500">
                      Quantity, sales total, and token contribution for items sold in this session.
                    </p>
                  </div>

                  <span className="text-sm font-medium text-[#2f788a]">
                    {showSoldItems ? "Hide" : "Show"}
                  </span>
                </button>

                {showSoldItems && (
                  (session.sold_items_breakdown || []).length === 0 ? (
                    <div className="px-4 py-6 text-sm text-gray-500">
                      No sold items were found for this session.
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead className="bg-gray-50 text-left text-gray-500">
                          <tr>
                            <th className="px-4 py-3 font-medium">Item</th>
                            <th className="px-4 py-3 text-right font-medium">Qty Sold</th>
                            <th className="px-4 py-3 text-right font-medium">Total Sales</th>
                            <th className="px-4 py-3 text-right font-medium">Tokens / Item</th>
                            <th className="px-4 py-3 text-right font-medium">Total Tokens</th>
                          </tr>
                        </thead>
                        <tbody>
                          {(session.sold_items_breakdown || []).map((item) => (
                            <tr
                              key={item.item_id}
                              className="border-t border-base-200"
                            >
                              <td className="px-4 py-3 font-medium text-gray-900">
                                {item.item_name || `Item #${item.item_id}`}
                              </td>
                              <td className="px-4 py-3 text-right text-gray-700">
                                {formatCount(item.quantity_sold)}
                              </td>
                              <td className="px-4 py-3 text-right font-semibold text-gray-900">
                                {formatCurrency(item.total_amount)}
                              </td>
                              <td className="px-4 py-3 text-right text-gray-700">
                                {formatCount(item.tokens_per_item)}
                              </td>
                              <td className="px-4 py-3 text-right font-semibold text-[#2f788a]">
                                {formatCount(item.total_tokens)}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )
                )}
              </div>

              <div className="overflow-hidden rounded-2xl border border-base-300">
                <div className="border-b border-base-300 bg-base-100 px-4 py-3">
                  <h3 className="text-sm font-semibold text-gray-800">Invoices in Session</h3>
                </div>

                {(session.invoices || []).length === 0 ? (
                  <div className="px-4 py-6 text-sm text-gray-500">
                    No invoices were linked to this session.
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead className="bg-gray-50 text-left text-gray-500">
                        <tr>
                          <th className="px-4 py-3 font-medium">Invoice</th>
                          <th className="px-4 py-3 font-medium">Client</th>
                          <th className="px-4 py-3 font-medium">Date</th>
                          <th className="px-4 py-3 text-right font-medium">Total</th>
                        </tr>
                      </thead>
                      <tbody>
                        {session.invoices.map((invoice) => (
                          <tr key={invoice.invoice_number} className="border-t border-base-200">
                            <td className="px-4 py-3 font-medium text-gray-900">
                              {invoice.invoice_number}
                            </td>
                            <td className="px-4 py-3 text-gray-600">
                              {invoice.client || "Walk-in"}
                            </td>
                            <td className="px-4 py-3 text-gray-600">
                              {formatDateTime(invoice.date)}
                            </td>
                            <td className="px-4 py-3 text-right font-semibold text-gray-900">
                              {formatCurrency(invoice.total)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}

function SummaryCard({ label, value }) {
  return (
    <div className="rounded-2xl border border-base-300 bg-base-100 px-4 py-4">
      <div className="text-xs uppercase tracking-wide text-gray-500">{label}</div>
      <div className="mt-2 text-lg font-semibold text-gray-900">{value}</div>
    </div>
  );
}

export default function POSManagementScreen() {
  const permissions = readPermissions();
  const posPerm = permissions?.pos || {};
  const canView = posPerm.view === true;
  const canCreate = posPerm.add === true;
  const canEdit = posPerm.edit === true;

  const [posPoints, setPosPoints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [editingPoint, setEditingPoint] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [expandedPosPointId, setExpandedPosPointId] = useState(null);
  const [sessionsByPosPointId, setSessionsByPosPointId] = useState({});
  const [historyLoadingFor, setHistoryLoadingFor] = useState(null);
  const [selectedSessionId, setSelectedSessionId] = useState(null);

  const loadMonitoring = async () => {
    setLoading(true);
    setError("");

    try {
      const res = await api.get("/api/pos-points/monitoring");
      setPosPoints(res.data?.pos_points || []);
    } catch (err) {
      setError(getApiMessage(err, "Failed to load POS monitoring"));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadMonitoring();
  }, []);

  const handleOpenCreate = () => {
    setEditingPoint(null);
    setModalOpen(true);
  };

  const handleOpenEdit = (posPoint) => {
    setEditingPoint(posPoint);
    setModalOpen(true);
  };

  const handleSubmitPosPoint = async (payload) => {
    setSubmitting(true);

    try {
      if (editingPoint) {
        await api.put(`/api/pos-points/${editingPoint.id}`, payload);
      } else {
        await api.post("/api/pos-points", payload);
      }

      setModalOpen(false);
      setEditingPoint(null);
      await loadMonitoring();
    } catch (err) {
      alert(getApiMessage(err, "Failed to save POS station"));
    } finally {
      setSubmitting(false);
    }
  };

  const toggleHistory = async (posPointId) => {
    const nextExpanded = expandedPosPointId === posPointId ? null : posPointId;
    setExpandedPosPointId(nextExpanded);

    if (nextExpanded == null || sessionsByPosPointId[posPointId]) {
      return;
    }

    setHistoryLoadingFor(posPointId);

    try {
      const res = await api.get(`/api/pos-points/${posPointId}/sessions`);
      setSessionsByPosPointId((prev) => ({
        ...prev,
        [posPointId]: res.data?.sessions || [],
      }));
    } catch (err) {
      alert(getApiMessage(err, "Failed to load POS session history"));
    } finally {
      setHistoryLoadingFor(null);
    }
  };

  if (!canView) {
    return <NoAccess />;
  }

  return (
    <div className="flex h-full w-full flex-col bg-base-200">
      <div className="sticky top-0 z-10 border-b bg-white">
        <div className="flex flex-col gap-4 px-6 py-5 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-gray-800">POS Management</h1>
            <p className="mt-1 text-sm text-gray-500">
              Monitor each station, see who is currently selling, and review session history.
            </p>
          </div>

          <div className="flex gap-3">
            <button type="button" className="btn btn-outline" onClick={loadMonitoring}>
              Refresh
            </button>
            {canCreate && (
              <button type="button" className="btn btn-primary" onClick={handleOpenCreate}>
                Create POS Station
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-5">
        {error ? (
          <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        ) : loading ? (
          <div className="flex items-center gap-3 rounded-2xl border border-base-300 bg-white px-5 py-4 text-sm text-gray-600 shadow-sm">
            <span className="loading loading-spinner loading-md text-[#2f788a]"></span>
            Loading POS stations...
          </div>
        ) : (
          <div className="grid gap-5 lg:grid-cols-2 xl:grid-cols-3">
            {posPoints.map((posPoint) => {
              const sessions = sessionsByPosPointId[posPoint.id] || [];
              const isExpanded = expandedPosPointId === posPoint.id;
              const activeSession = posPoint.active_session;

              return (
                <div
                  key={posPoint.id}
                  className="overflow-hidden rounded-3xl border border-base-300 bg-white shadow-sm transition-shadow hover:shadow-lg"
                >
                  <div className="space-y-4 px-5 py-5">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <div className="text-xs uppercase tracking-[0.2em] text-[#2f788a]">
                          POS Station
                        </div>
                        <h2 className="mt-2 text-2xl font-semibold text-gray-900">
                          {posPoint.name}
                        </h2>
                      </div>

                      <StatusBadge active={posPoint.is_active} />
                    </div>

                    <div className="grid gap-3 md:grid-cols-2">
                      <div className="rounded-2xl bg-base-100 px-4 py-3">
                        <div className="text-xs uppercase tracking-wide text-gray-500">
                          Current Occupancy
                        </div>
                        {activeSession ? (
                          <>
                            <div className="mt-2 font-semibold text-gray-900">
                              {activeSession.full_name || activeSession.username || "Active user"}
                            </div>
                            <div className="mt-1 text-sm text-gray-500">
                              Started {formatDateTime(activeSession.started_at)}
                            </div>
                          </>
                        ) : (
                          <div className="mt-2 text-sm text-gray-500">
                            No active session on this station.
                          </div>
                        )}
                      </div>

                      <div className="rounded-2xl bg-base-100 px-4 py-3">
                        <div className="text-xs uppercase tracking-wide text-gray-500">
                          Session History
                        </div>
                        <div className="mt-2 text-2xl font-semibold text-gray-900">
                          {posPoint.session_count || 0}
                        </div>
                        <div className="mt-1 text-sm text-gray-500">
                          Total sessions recorded
                        </div>
                      </div>
                    </div>

                    {posPoint.description && (
                      <p className="rounded-2xl bg-slate-50 px-4 py-3 text-sm text-gray-600">
                        {posPoint.description}
                      </p>
                    )}

                    <div className="flex flex-wrap gap-3">
                      <button
                        type="button"
                        className="btn btn-outline"
                        onClick={() => toggleHistory(posPoint.id)}
                      >
                        {isExpanded ? "Hide Sessions" : "View Sessions"}
                      </button>

                      {canEdit && (
                        <button
                          type="button"
                          className="btn btn-ghost"
                          onClick={() => handleOpenEdit(posPoint)}
                        >
                          Edit
                        </button>
                      )}
                    </div>
                  </div>

                  {isExpanded && (
                    <div className="border-t border-base-300 bg-base-100 px-5 py-4">
                      <div className="mb-3 flex items-center justify-between">
                        <h3 className="text-sm font-semibold text-gray-800">Session History</h3>
                        {historyLoadingFor === posPoint.id && (
                          <span className="text-xs text-gray-500">Loading...</span>
                        )}
                      </div>

                      {historyLoadingFor === posPoint.id ? (
                        <div className="text-sm text-gray-500">Loading sessions...</div>
                      ) : sessions.length === 0 ? (
                        <div className="rounded-2xl border border-dashed border-base-300 px-4 py-4 text-sm text-gray-500">
                          No sessions recorded for this POS station yet.
                        </div>
                      ) : (
                        <div className="space-y-3">
                          {sessions.map((session) => (
                            <button
                              key={session.id}
                              type="button"
                              className="flex w-full items-center justify-between rounded-2xl border border-base-300 bg-white px-4 py-4 text-left transition hover:border-[#2f788a]/40 hover:shadow-sm"
                              onClick={() => setSelectedSessionId(session.id)}
                            >
                              <div>
                                <div className="flex flex-wrap items-center gap-2">
                                  <span className="font-semibold text-gray-900">
                                    Session #{session.id}
                                  </span>
                                  <StatusBadge
                                    active={session.status === "active" && !session.ended_at}
                                    activeLabel="Active"
                                    inactiveLabel="Ended"
                                  />
                                </div>
                                <div className="mt-2 text-sm text-gray-600">
                                  {session.full_name || session.username || "Unknown user"}
                                </div>
                                <div className="mt-1 text-xs text-gray-500">
                                  {formatDateTime(session.started_at)} to {formatDateTime(session.ended_at)}
                                </div>
                              </div>

                              <div className="text-right">
                                <div className="text-sm font-semibold text-gray-900">
                                  {formatCurrency(session.total_sales_amount)}
                                </div>
                                <div className="mt-1 text-xs text-gray-500">
                                  {session.invoice_count || 0} invoices
                                </div>
                              </div>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      <POSPointModal
        open={modalOpen}
        onClose={() => {
          if (submitting) return;
          setModalOpen(false);
          setEditingPoint(null);
        }}
        onSubmit={handleSubmitPosPoint}
        submitting={submitting}
        initialData={editingPoint}
        canEdit={editingPoint ? canEdit : canCreate}
      />

      <SessionDetailModal
        sessionId={selectedSessionId}
        onClose={() => setSelectedSessionId(null)}
      />
    </div>
  );
}
