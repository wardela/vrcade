import React, { useState, useEffect, useRef } from "react";
import api from "../../utils/axiosInstance";
import { useTranslation } from "react-i18next";
const UnitsModal = ({ isOpen, onClose, canAddItem, canEditItem }) => {

  const [units, setUnits] = useState([]);
  const [editingId, setEditingId] = useState(null);
  const [name, setName] = useState("");
  const [desc, setDesc] = useState("");
  const {t} = useTranslation();
  const isEditMode = Boolean(editingId);
const canSave =
  (isEditMode && canEditItem) ||
  (!isEditMode && canAddItem);

  // Load all units
  useEffect(() => {
    if (isOpen) {
      api.get(`/api/invoices/units`).then((res) => {
        setUnits(res.data);
      });
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const resetFields = () => {
    setEditingId(null);
    setName("");
    setDesc("");
  };

  const saveUnit = async () => {
    if (!name.trim()) return;
if (!canSave) return;
    if (editingId) {
      // update
      const res = await api.put(`/api/invoices/units/${editingId}`, {
        name,
        description: desc,
      });

      setUnits(units.map((u) => (u.id === editingId ? res.data : u)));
    } else {
      // add
      const res = await api.post(`/api/invoices/units`, {
        name,
        description: desc,
      });

      setUnits([...units, res.data]);
    }

    resetFields();
  };

  const deleteUnit = async (id) => {
    await api.delete(`/api/invoices/units/${id}`);
    setUnits(units.filter((u) => u.id !== id));
  };

  const selectForEdit = (u) => {
    setEditingId(u.id);
    setName(u.name);
    setDesc(u.description || "");
  };
const modalRef = useRef(null);
useEffect(() => {
  function handleClickOutside(event) {
    if (modalRef.current && !modalRef.current.contains(event.target)) {
      resetFields();
      onClose();
    }
  }

  document.addEventListener("mousedown", handleClickOutside);
  return () => {
    document.removeEventListener("mousedown", handleClickOutside);
  };
}, []);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
<div
  ref={modalRef}
  className="bg-white w-[700px] rounded-lg p-6 shadow-xl"
>
        <h2 className="text-xl font-semibold mb-4">{t("UnitsModal.title")}</h2>

        {/* Inputs */}
        <div className="flex gap-3 mb-4">
          <input
            className="w-1/3 border px-3 py-2 rounded"
            placeholder={t("UnitsModal.form.name_placeholder")}
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
          <input
            className="flex-1 border px-3 py-2 rounded"
            placeholder={t("UnitsModal.form.description_placeholder")}
            value={desc}
            onChange={(e) => setDesc(e.target.value)}
          />
{canSave && (
  <button
    onClick={saveUnit}
    className="px-4 py-2 bg-[#2f788a] text-white rounded hover:bg-[#276472]"
  >
    {editingId ? t("UnitsModal.form.update") : t("UnitsModal.form.add")}
  </button>
)}
        </div>

        {/* Table */}
        <div className="border rounded-lg max-h-[350px] overflow-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-100">
              <tr>
                <th className="p-2 border">{t("UnitsModal.table.id")}</th>
                <th className="p-2 border">{t("UnitsModal.table.name")}</th>
                <th className="p-2 border">{t("UnitsModal.table.description")}</th>
              </tr>
            </thead>
            <tbody>
              {units.map((u) => (
                <tr key={u.id} className="hover:bg-gray-50">
                  <td className="p-2 border">{u.id}</td>
                  <td
                    className="p-2 border cursor-pointer text-[#2f788a]"
                    onClick={() => selectForEdit(u)}
                  >
                    {u.name}
                  </td>
                  <td className="p-2 border">{u.description || "-"}</td>
                </tr>
              ))}
              {units.length === 0 && (
                <tr>
                  <td colSpan="4" className="p-3 text-center text-gray-500">
                    {t("UnitsModal.empty.no_units")}
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

export default UnitsModal;
