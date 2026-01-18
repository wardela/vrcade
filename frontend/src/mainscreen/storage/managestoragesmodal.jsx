import { useEffect, useRef, useState } from "react";
import api from "../../utils/axiosInstance";
import { useTranslation } from "react-i18next";
export default function ManageStoragesModal({ open, onClose, onSaved }) {
  const modalRef = useRef(null);

  const [storages, setStorages] = useState([]);
  const [editing, setEditing] = useState(null);

  const [name, setName] = useState("");
  const [location, setLocation] = useState("");
  const {t} = useTranslation();
  // ------------------ helpers ------------------
  const resetForm = () => {
    setEditing(null);
    setName("");
    setLocation("");
  };

  const close = () => {
    resetForm();
    onClose();
  };

  // click outside
  useEffect(() => {
    const handler = (e) => {
      if (modalRef.current && !modalRef.current.contains(e.target)) {
        close();
      }
    };
    if (open) document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  // load storages
  useEffect(() => {
    if (!open) return;
    api.get(`/api/invoices/storages`).then((res) => setStorages(res.data));
  }, [open]);

  const startEdit = (s) => {
    setEditing(s);
    setName(s.name);
    setLocation(s.location || "");
  };

  const submit = async () => {
    if (!name.trim()) return;

    if (editing) {
      await api.put(`/api/invoices/storages/${editing.id}`, {
        name,
        location,
      });
    } else {
      await api.post(`/api/invoices/storages`, {
        name,
        location,
      });
    }

    resetForm();
    const res = await api.get(`/api/invoices/storages`);
    setStorages(res.data);
    onSaved?.();
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center">
      <div
        ref={modalRef}
        className="bg-white w-[520px] rounded-xl shadow-xl p-6"
      >
        {/* Header */}
        <div className="mb-4">
          <h2 className="text-lg font-semibold text-gray-800">
            {t("ManageStoragesModal.title")}
          </h2>
          <p className="text-sm text-gray-500">
            {t("ManageStoragesModal.subtitle")}
          </p>
        </div>

        {/* List */}
        <div className="border rounded-lg mb-4 max-h-56 overflow-y-auto">
          {storages.map((s) => (
            <div
              key={s.id}
              onClick={() => startEdit(s)}
              className={`px-4 py-2 cursor-pointer flex justify-between items-center
                hover:bg-gray-50 ${
                  editing?.id === s.id ? "bg-gray-100" : ""
                }`}
            >
              <div>
                <div className="font-medium text-gray-700">{s.name}</div>
                {s.location && (
                  <div className="text-xs text-gray-500">{s.location}</div>
                )}
              </div>
              <span className="text-xs text-gray-400">#{s.id}</span>
            </div>
          ))}

          {storages.length === 0 && (
            <div className="px-4 py-6 text-center text-gray-400">
              {t("ManageStoragesModal.list.empty")}
            </div>
          )}
        </div>

        {/* Form */}
        <div className="space-y-3">
          <input
            type="text"
            placeholder={t("ManageStoragesModal.form.name_placeholder")}
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full border rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-[#2f788a]"
          />

          <input
            type="text"
            placeholder={t("ManageStoragesModal.form.location_placeholder")}
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            className="w-full border rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-[#2f788a]"
          />
        </div>

        {/* Actions */}
        <div className="mt-5 flex justify-between items-center">
          <button
            onClick={close}
            className="text-sm text-gray-500 hover:text-gray-700"
          >
            {t("ManageStoragesModal.actions.cancel")}
          </button>

          <button
            onClick={submit}
            className="px-5 py-2 rounded-md text-sm font-medium
              bg-[#2f788a] text-white hover:bg-[#256273]"
          >
            {editing ? t("ManageStoragesModal.actions.update") : t("ManageStoragesModal.actions.add")}
          </button>
        </div>
      </div>
    </div>
  );
}
