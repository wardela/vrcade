import React, { useState, useEffect, useRef } from "react";
import api from "../../utils/axiosInstance";
import { useTranslation } from "react-i18next";
const CategoryModal = ({ isOpen, onClose, onSaved, canEditItem }) => {
  const [categories, setCategories] = useState([]);
  const [editingId, setEditingId] = useState(null);
  const [name, setName] = useState("");
  const {t} = useTranslation();
  const modalRef = useRef(null);

  // Load categories
  useEffect(() => {
    if (isOpen) {
      api.get(`/api/invoices/categories`).then((res) => {
        setCategories(res.data);
      });
    }
  }, [isOpen]);

  // Click outside to close
  useEffect(() => {
    function handleClickOutside(e) {
      if (modalRef.current && !modalRef.current.contains(e.target)) {
        resetForm();
        onClose();
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  if (!isOpen) return null;

  const resetForm = () => {
    setEditingId(null);
    setName("");
  };

  const saveCategory = async () => {
    if (!name.trim()) return;
if (!canEditItem) return;

if (editingId) {
  const res = await api.put(
    `/api/invoices/categories/${editingId}`,
    { name }
  );
  setCategories(categories.map((c) => (c.id === editingId ? res.data : c)));
} else {
  const res = await api.post(`/api/invoices/categories`, { name });
  setCategories([...categories, res.data]);
}

if (onSaved) await onSaved();
resetForm();
  };

  const startEdit = (cat) => {
    setEditingId(cat.id);
    setName(cat.name);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div
        ref={modalRef}
        className="bg-white w-[600px] rounded-lg p-6 shadow-xl"
      >
        <h2 className="text-xl font-semibold mb-4">{t("CategoryModal.title")}</h2>

        {/* Form */}
        <div className="flex gap-3 mb-4">
          <input
            className="flex-1 border px-3 py-2 rounded"
            placeholder={t("CategoryModal.form.name_placeholder")}
            value={name}
            onChange={(e) => setName(e.target.value)}
          />

        {canEditItem && (
          <button
            onClick={saveCategory}
            className="px-4 py-2 bg-[#2f788a] text-white rounded hover:bg-[#276472]"
          >
            {editingId ? t("CategoryModal.form.update") :t("CategoryModal.form.add")}
          </button>
        )}
        </div>

        {/* Table */}
        <div className="border rounded-lg max-h-[350px] overflow-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-100">
              <tr>
                <th className="p-2 border">{t("CategoryModal.table.id")}</th>
                <th className="p-2 border">{t("CategoryModal.table.name")}</th>
              </tr>
            </thead>
            <tbody>
              {categories.map((cat) => (
                <tr key={cat.id} className="hover:bg-gray-50">
                  <td className="p-2 border">{cat.id}</td>
                  <td
                    className="p-2 border cursor-pointer text-[#2f788a]"
                    onClick={() => startEdit(cat)}
                  >
                    {cat.name}
                  </td>
                </tr>
              ))}

              {categories.length === 0 && (
                <tr>
                  <td colSpan="3" className="p-3 text-center text-gray-500">
                   {t("CategoryModal.empty.no_categories")}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default CategoryModal;
