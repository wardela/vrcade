import React, { useEffect, useState } from "react";
import UserModal from "./UserModal";
import api from "../../utils/axiosInstance";
import { useTranslation } from "react-i18next";
export default function UsersScreen() {
  const [users, setUsers] = useState([]);
  const [openModal, setOpenModal] = useState(false);
  const [editData, setEditData] = useState(null);
  const {t} = useTranslation();
  const loadUsers = async () => {
    const res = await api.get(`/api/users/all`);
    setUsers(res.data);
  };

  // Converts UTC timestamp → Jordan local time (Asia/Amman)
const formatJordanTime = (dateStr) => {
  if (!dateStr) return t("UsersScreen.states.never");

  try {
    return new Date(dateStr).toLocaleString("en-GB", {
      timeZone: "Asia/Amman",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit"
    });
  } catch {
    return dateStr;
  }
};


  useEffect(() => {
    loadUsers();
  }, []);

  const openAdd = () => {
    setEditData(null);
    setOpenModal(true);
  };

  const openEdit = (user) => {
    setEditData(user);
    setOpenModal(true);
  };

  const deleteUser = async (id) => {
    if (!window.confirm("Delete this user?")) return;
    await api.delete(`/api/users/delete/${id}`);
    loadUsers();
  };

  // ===== Permissions =====
let permissions = {};
try {
  const raw = localStorage.getItem("permissions");
  permissions = raw ? JSON.parse(raw) : {};
} catch {
  permissions = {};
}

const userPerm = permissions?.users || {};
const canAddUser = userPerm.add === true;
const canDeleteUser = userPerm.delete === true;

  return (
    <div className="p-6 h-full w-full">

      {/* MAIN CARD CONTAINER */}
      <div className="bg-white border border-gray-200 rounded-2xl shadow-sm p-6 mx-auto">

        {/* HEADER */}
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-semibold text-gray-700">
            {t("UsersScreen.title")}
          </h1>

{canAddUser && (
  <button
    onClick={openAdd}
    className="px-4 py-2 bg-[#2f788a] text-white rounded-xl shadow-sm hover:bg-[#26606f] transition"
  >
    + {t("UsersScreen.actions.add")}
  </button>
)}
        </div>

        {/* TABLE CONTAINER */}
        <div className="overflow-hidden rounded-xl border border-gray-200 shadow-sm bg-gray-50">
          <table className="w-full text-sm">
            <thead className="bg-gray-100 border-b border-gray-300">
              <tr className="text-start text-gray-600">
                <th className="p-3 font-medium w-16 text-start">{t("UsersScreen.table.id")}</th>
                <th className="p-3 font-medium text-start">{t("UsersScreen.table.full_name")}</th>
                <th className="p-3 font-medium text-start">{t("UsersScreen.table.username")}</th>
                <th className="p-3 font-medium text-start">{t("UsersScreen.table.last_login")}</th>
                <th className="p-3 text-center font-medium w-44">{t("UsersScreen.table.actions")}</th>
              </tr>
            </thead>

            <tbody>
              {users.map((u) => (
                <tr
                  key={u.id}
                  className="border-t border-gray-200 hover:bg-white transition"
                >
                  <td className="p-3 text-gray-700 text-start">{u.id}</td>
                  <td className="p-3 text-gray-700 text-start">{u.full_name || "-"}</td>
                  <td className="p-3 text-gray-700 text-start">{u.username}</td>
                  <td className="p-3 text-gray-500 text-sm text-start">
                    {formatJordanTime(u.last_login)}
                  </td>

                  <td className="p-3 text-center space-x-2">
                    <button
                      onClick={() => openEdit(u)}
                      className="px-3 py-1 bg-[#2f788a] text-white rounded-lg hover:bg-[#26606f] transition mx-2"
                    >
                      {t("UsersScreen.actions.view")}
                    </button>

{canDeleteUser && (
  <button
    onClick={() => deleteUser(u.id)}
    className="px-3 py-1 bg-red-600 text-white rounded-lg hover:bg-red-700 transition mx-2"
  >
    {t("UsersScreen.actions.delete")}
  </button>
)}
                  </td>
                </tr>
              ))}

              {users.length === 0 && (
                <tr>
                  <td
                    colSpan={5}
                    className="text-center text-gray-500 py-6 text-sm"
                  >
                   {t("UsersScreen.states.no_users")}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {openModal && (
        <UserModal
          close={() => setOpenModal(false)}
          refresh={loadUsers}
          editData={editData}
        />
      )}
    </div>
  );
}
