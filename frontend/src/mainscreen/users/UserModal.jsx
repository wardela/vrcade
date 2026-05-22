import React, { useState, useEffect } from "react";
import api from "../../utils/axiosInstance";
import { useTranslation } from "react-i18next";

const buildEmptyPermissions = () => ({
  dashboard: { view: false, add: false, edit: false, delete: false },
  sales: { view: false, add: false, edit: false, delete: false },
  events: { view: false, add: false, edit: false, delete: false },
  pos: { view:false, add:false, edit:false, delete:false }, 
  refunds: { view: false, add: false, edit: false, delete: false },
  items: { view: false, add: false, edit: false, delete: false },
  stock_management: { view: false, add: false, edit: false, delete: false },
  clients: { view: false, add: false, edit: false, delete: false },
  reports: { view: false, add: false, edit: false, delete: false },
  users: { view: false, add: false, edit: false, delete: false },
  company_config: { view: false, add: false, edit: false, delete: false },
  einvoicing: { view: false, add: false, edit: false, delete: false },
  receipts: { view: false, add: false, edit: false, delete: false },
});

const mergePermissionsWithDefaults = (permissions = {}) => {
  const defaults = buildEmptyPermissions();
  const merged = { ...defaults };

  Object.entries(permissions || {}).forEach(([module, modulePermissions]) => {
    merged[module] = {
      ...(defaults[module] || { view: false, add: false, edit: false, delete: false }),
      ...modulePermissions,
    };
  });

  return merged;
};

export default function UserModal({ close, refresh, editData }) {
  const [full_name, setFullName] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [portalAccess, setPortalAccess] = useState(false);
  const [portalUsername, setPortalUsername] = useState("");
  const [portalPassword, setPortalPassword] = useState("");
  const [portalNotificationEmail, setPortalNotificationEmail] = useState("");
  const [submitError, setSubmitError] = useState("");
  const [permissions, setPermissions] = useState(buildEmptyPermissions);
  const {t} = useTranslation();
  let currentPermissions = {};
try {
  const raw = localStorage.getItem("permissions");
  currentPermissions = raw ? JSON.parse(raw) : {};
} catch {
  currentPermissions = {};
}

const userPerm = currentPermissions?.users || {};
const canAddUser = userPerm.add === true;
const canEditUser = userPerm.edit === true;
const canViewUser = userPerm.view === true;
const isEditMode = Boolean(editData);
const isReadOnly =
  (isEditMode && !canEditUser) ||
  (!isEditMode && !canAddUser);

  useEffect(() => {
    if (editData) {
      setFullName(editData.full_name || "");
      setUsername(editData.username || "");
      setPassword("");
      setPortalAccess(editData.portal_access === true);
      setPortalUsername(editData.portal_username || "");
      setPortalPassword("");
      setPortalNotificationEmail(editData.portal_notification_email || "");
      setSubmitError("");
      setPermissions(mergePermissionsWithDefaults(editData.permissions));
      return;
    }
    setFullName("");
    setUsername("");
    setPassword("");
    setPortalAccess(false);
    setPortalUsername("");
    setPortalPassword("");
    setPortalNotificationEmail("");
    setSubmitError("");
    setPermissions(buildEmptyPermissions());
  }, [editData]);

const toggle = (module, key) => {
  setPermissions((prev) => {
    const current = prev[module];
    const nextValue = !current[key];

    let nextModule = {
      ...current,
      [key]: nextValue,
    };

    // 🔒 RULE 1: If VIEW is turned OFF → clear everything else
    if (key === "view" && nextValue === false) {
      nextModule = {
        view: false,
        add: false,
        edit: false,
        delete: false,
      };
    }

    // 🔒 RULE 2: SALES dependency
    if (module === "sales") {
      // If ADD turned OFF → EDIT must be OFF
      if (key === "add" && nextValue === false) {
        nextModule.edit = false;
      }

      // If EDIT turned ON → ADD must be ON
      if (key === "edit" && nextValue === true) {
        nextModule.add = true;
        nextModule.view = true;
      }
    }

    // 🔒 Rule: Turning ON any action requires VIEW
    if (["add", "edit", "delete"].includes(key) && nextValue === true) {
      nextModule.view = true;
    }

    return {
      ...prev,
      [module]: nextModule,
    };
  });
};

const toggleRow = (module, actions, value) => {
  setPermissions((prev) => {
    let nextModule = {
      ...prev[module],
      view: value,
    };

    // If ALL OFF → everything OFF
    if (!value) {
      nextModule = {
        view: false,
        add: false,
        edit: false,
        delete: false,
      };
    } else {
      // ALL ON
      actions.forEach((a) => {
        nextModule[a] = true;
      });
      nextModule.view = true;

      // SALES rule: edit requires add
      if (module === "sales" && !nextModule.add) {
        nextModule.edit = false;
      }
    }

    return {
      ...prev,
      [module]: nextModule,
    };
  });
};

  const submit = async () => {
    const trimmedPortalUsername = portalUsername.trim();
    const trimmedPortalNotificationEmail = portalNotificationEmail.trim();
    const portalPasswordRequired =
      portalAccess &&
      (!editData || editData.portal_access !== true || editData.portal_password_configured !== true);

    if (portalAccess && !trimmedPortalUsername) {
      setSubmitError(t("UserModal.validation.portal_username_required"));
      return;
    }

    if (portalAccess && portalPasswordRequired && portalPassword.length < 6) {
      setSubmitError(t("UserModal.validation.portal_password_min"));
      return;
    }

    if (portalAccess && portalPassword && portalPassword.length < 6) {
      setSubmitError(t("UserModal.validation.portal_password_min"));
      return;
    }

    if (
      portalAccess &&
      trimmedPortalNotificationEmail &&
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedPortalNotificationEmail)
    ) {
      setSubmitError(t("UserModal.validation.portal_email_invalid"));
      return;
    }

    setSubmitError("");

    const payload = {
      full_name,
      username,
      portal_access: portalAccess,
      portal_username: portalAccess ? trimmedPortalUsername : null,
      portal_password: portalAccess ? portalPassword : "",
      portal_notification_email: portalAccess ? trimmedPortalNotificationEmail : null,
      permissions,
    };

    if (!editData) payload.password = password;
    if (editData && password) payload.password = password;

    try {
      if (editData) {
        await api.put(`/api/users/update/${editData.id}`, payload);
      } else {
        await api.post(`/api/users/register`, payload);
      }

      refresh();
      close();
    } catch (error) {
      setSubmitError(
        error?.response?.data?.message || t("UserModal.validation.save_failed")
      );
    }
  };

const PermissionRow = ({ label, module, actions }) => {
  const allChecked = actions.every((a) => permissions[module][a]);
  const isViewOff = permissions[module].view !== true;


  return (
    <div className="grid grid-cols-6 items-center py-2 border-b text-sm">
      <span className="font-medium text-gray-700">{label}</span>

      <input
        type="checkbox"
        className="checkbox checkbox-sm checkbox- mx-auto"
          disabled={isReadOnly}
        checked={permissions[module].view || false}
        onChange={() => toggle(module, "view")}
      />

      {actions.includes("add") ? (
        <input
          type="checkbox"
          className="checkbox checkbox-sm checkbox- mx-auto"
    disabled={isReadOnly || isViewOff}
          checked={permissions[module].add}
          onChange={() => toggle(module, "add")}
        />
      ) : <span />}

      {actions.includes("edit") ? (
        <input
          type="checkbox"
          className="checkbox checkbox-sm checkbox- mx-auto"
    disabled={isReadOnly || isViewOff}
          checked={permissions[module].edit}
          onChange={() => toggle(module, "edit")}
        />
      ) : <span />}

      {actions.includes("delete") ? (
        <input
          type="checkbox"
          className="checkbox checkbox-sm checkbox- mx-auto"
    disabled={isReadOnly || isViewOff}
          checked={permissions[module].delete}
          onChange={() => toggle(module, "delete")}
        />
      ) : <span />}

      {/* ALL */}
      <input
        type="checkbox"
        className="checkbox checkbox-sm checkbox- mx-auto"
    disabled={isReadOnly}
        checked={allChecked}
        onChange={(e) => toggleRow(module, actions, e.target.checked)}
      />
    </div>
  );
};



  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-[999]">
      <div className="bg-white rounded-lg shadow-2xl w-[1300px] h-[90vh] max-h-[90vh] overflow-hidden animate-scaleIn flex flex-col">

        {/* HEADER */}
        <div className="px-8 py-6 border-b shrink-0 bg-white">
          <h2 className="text-2xl font-semibold text-[#2f788a]">
            {editData ? t("UserModal.title.edit") : t("UserModal.title.add")}
          </h2>
        </div>

        <div
          className={`grid grid-cols-[380px_1fr] flex-1 min-h-0
            ${isReadOnly ? "opacity-70" : ""}
          `}
        >
          {/* LEFT — USER INFO */}
          <div className="p-8 border-r bg-gray-50 overflow-y-auto min-h-0">
            <h2 className="justify-start items-center text-lg font-semibold mb-4 text-gray-600">
              {t("UserModal.sections.personal")}
            </h2>
            <div className="space-y-5">
              <div>
                <label className="text-sm text-gray-500"> {t("UserModal.fields.full_name")}</label>
                <input
                  className="input input-bordered w-full mt-1"
                  value={full_name}
                    disabled={isReadOnly}
                  onChange={(e) => setFullName(e.target.value)}
                />
              </div>

              <div>
                <label className="text-sm text-gray-500">{t("UserModal.fields.username")}</label>
                <input
                  className="input input-bordered w-full mt-1"
                  value={username}
                    disabled={isReadOnly}
                  onChange={(e) => setUsername(e.target.value)}
                />
              </div>

              <div>
                <label className="text-sm text-gray-500">
                  {editData ? t("UserModal.fields.new_password") : t("UserModal.fields.password")}
                </label>
                <input
                  type="password"
                  className="input input-bordered w-full mt-1"
                  value={password}
                    disabled={isReadOnly}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>

              <div className="rounded-2xl border border-gray-200 bg-white p-4">
                <label className="flex items-center justify-between gap-4">
                  <div>
                    <p className="font-medium text-gray-700">
                      {t("UserModal.portal.access_label")}
                    </p>
                    <p className="text-xs text-gray-500">
                      {t("UserModal.portal.access_hint")}
                    </p>
                  </div>
                  <input
                    type="checkbox"
                    className="checkbox checkbox-sm"
                    checked={portalAccess}
                    disabled={isReadOnly}
                    onChange={(e) => setPortalAccess(e.target.checked)}
                  />
                </label>

                {portalAccess && (
                  <div className="mt-4 space-y-4">
                    <div>
                      <label className="text-sm text-gray-500">
                        {t("UserModal.portal.username")}
                      </label>
                      <input
                        className="input input-bordered w-full mt-1"
                        value={portalUsername}
                        disabled={isReadOnly}
                        onChange={(e) => setPortalUsername(e.target.value)}
                      />
                    </div>

                    <div>
                      <label className="text-sm text-gray-500">
                        {editData && editData.portal_access
                          ? t("UserModal.portal.password_optional")
                          : t("UserModal.portal.password")}
                      </label>
                      <input
                        type="password"
                        className="input input-bordered w-full mt-1"
                        value={portalPassword}
                        disabled={isReadOnly}
                        onChange={(e) => setPortalPassword(e.target.value)}
                      />
                      <p className="mt-1 text-xs text-gray-400">
                        {t("UserModal.portal.password_hint")}
                      </p>
                    </div>

                    <div>
                      <label className="text-sm text-gray-500">
                        {t("UserModal.portal.notification_email")}
                      </label>
                      <input
                        type="email"
                        className="input input-bordered w-full mt-1"
                        value={portalNotificationEmail}
                        disabled={isReadOnly}
                        onChange={(e) => setPortalNotificationEmail(e.target.value)}
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* RIGHT — PERMISSIONS */}
          <div className="p-6 overflow-y-auto space-y-4 min-h-0 pb-10">
            <h2 className="justify-start items-center text-lg font-semibold  text-gray-600">
              {t("UserModal.sections.permissions")}
            </h2>

<div className="border rounded-xl overflow-hidden">
  {/* HEADER */}
  <div className="grid grid-cols-6 bg-gray-100 text-xs uppercase text-gray-500 py-3 px-2 border-b">
    <span>{t("UserModal.permissions.module")}</span>
    <span className="text-center">{t("UserModal.permissions.view")}</span>
    <span className="text-center">{t("UserModal.permissions.create")}</span>
    <span className="text-center">{t("UserModal.permissions.edit")}</span>
    <span className="text-center">{t("UserModal.permissions.delete")}</span>
    <span className="text-center">{t("UserModal.permissions.all")}</span>
  </div>

  <div className="px-2">
    <PermissionRow label={t("UserModal.modules.sales")} module="sales" actions={["view","add","edit","delete"]} />
    <PermissionRow label={t("UserModal.modules.events")} module="events" actions={["view","add","edit","delete"]} />
    <PermissionRow label={t("UserModal.modules.refunds")} module="refunds" actions={["view","add"]} />
    <PermissionRow label={t("UserModal.modules.items")} module="items" actions={["view","add","edit","delete"]} />
    <PermissionRow label={t("UserModal.modules.clients")} module="clients" actions={["view","add","edit","delete"]} />
    <PermissionRow label={t("UserModal.modules.users")} module="users" actions={["view","add","edit","delete"]} />
    <PermissionRow label={t("UserModal.modules.company_config")} module="company_config" actions={["view","edit"]} />
    <PermissionRow
      label={t("UserModal.modules.stock_management")}
      module="stock_management"
      actions={["view","add"]}
    />
    <PermissionRow
      label={t("UserModal.modules.receipts")}
      module="receipts"
      actions={["view","add","edit","delete"]}
    />
    <PermissionRow
      label={t("UserModal.modules.pos")}
      module="pos"
      actions={["view","add","edit","delete"]}
    />
  </div>
</div>


<div className="space-y-2">

  {[
{
  label: t("UserModal.toggles.dashboard"),
  module: "dashboard",
  key: "view",
  annotation: t("UserModal.annotations.dashboard")
},
{
  label: t("UserModal.toggles.reports"),
  module: "reports",
  key: "view",
  annotation:  t("UserModal.annotations.reports")
},
{
  label:t("UserModal.toggles.einvoicing"),
  module: "einvoicing",
  key: "view",
  annotation: t("UserModal.annotations.einvoicing")
}
  ].map((item) => (
    <div key={item.label} >
      <div>
        <div className="card border">
      <div className="card-body py-3 px-4">
        <label className="flex items-center justify-between">
          <span className="font-medium">{item.label}</span>
          <input
            type="checkbox"
            className="toggle toggle-success"
            checked={permissions[item.module][item.key]}
              disabled={isReadOnly}
            onChange={() => toggle(item.module, item.key)}
          />
        </label>
      </div>
    </div>
    <p className="text-xs text-start items-center text-gray-400 p-2">{item.annotation}</p>
    </div>
    </div>
  ))}
</div>

          </div>
        </div>

        {/* FOOTER */}
        <div className="px-8 py-5 border-t flex justify-end gap-3 shrink-0 bg-white relative z-10">
          {submitError && (
            <div className="mr-auto self-center rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">
              {submitError}
            </div>
          )}
          <button onClick={close} className="btn btn-ghost">
            {t("UserModal.actions.cancel")}
          </button>
          {!isReadOnly && (
            <button
              onClick={submit}
              className="btn btn-primary bg-[#2f788a] border-none"
            >
              {editData ? t("UserModal.actions.save") : t("UserModal.actions.create")}
            </button>
          )}
        </div>
      </div>

      <style>{`
        @keyframes scaleIn {
          from { opacity: 0; transform: scale(.96); }
          to { opacity: 1; transform: scale(1); }
        }
        .animate-scaleIn {
          animation: scaleIn .25s ease-out forwards;
        }
      `}</style>
    </div>
  );
}
