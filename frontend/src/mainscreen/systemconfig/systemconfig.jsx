import React, { useEffect, useState, useRef } from "react";
import api from "../../utils/axiosInstance";
import { useTranslation } from "react-i18next";
import Popup from "../../components/Popup";
const CompanyConfig = () => {
  const [form, setForm] = useState({});
  const [loading, setLoading] = useState(false);
  const [companyName, setCompanyName] = useState("");
const [taxNumber, setTaxNumber] = useState("");
const [taxSerial, setTaxSerial] = useState("");
const [clientId, setClientId] = useState("");
const [secretKey, setSecretKey] = useState("");
const [logo, setLogo] = useState(null);
const fileInputRef = useRef(null);
const [phone, setPhone] = useState("");
const [location, setLocation] = useState("");
const [email, setEmail] = useState("");
const {t} = useTranslation();
const [popupMessage, setPopupMessage] = useState(null);
const [invoiceTerms, setInvoiceTerms] = useState("");
const [autoPosEinvoicing, setAutoPosEinvoicing] = useState(false);
const [ecrIntegratorName, setEcrIntegratorName] = useState("");

const showPopup = (message) => {
  setPopupMessage(message);
};

const closePopup = () => {
  setPopupMessage(null);
};

  // ✅ Fetch company info from backend
const fetchCompany = async () => {
  try {
    setLoading(true);
    const res = await api.get(`/api/invoices/company`);
    if (res.data) {
      const data = res.data;

      setCompanyName(data.company_name || "");
      setTaxNumber(data.tax_number || "");
      setTaxSerial(data.tax_serial || "");
      setClientId(data.client_id || "");
      setSecretKey(data.secret_key || "");
      setLogo(data.logo_url || null);
      setPhone(data.phone_number || "");
      setLocation(data.company_location || "");
      setEmail(data.email || "");
      setInvoiceTerms(data.invoice_terms || "");
      setEcrIntegratorName(data.ecr_integrator_name || "");

      // ✅ ADD THIS
      setAutoPosEinvoicing(
        data.auto_pos_einvoicing ?? true
      );
    }
  } catch (err) {
    console.error("Error fetching company:", err);
    showPopup(" Failed to load company data");
  } finally {
    setLoading(false);
  }
};



  // ✅ Save or update company info
  const saveCompany = async () => {
    try {
      setLoading(true);
const payload = {
  company_name: companyName,
  tax_number: taxNumber,
  tax_serial: taxSerial,
  client_id: clientId,
  secret_key: secretKey,
  phone_number: phone,
  company_location: location,
  email,
  invoice_terms: invoiceTerms,
  auto_pos_einvoicing: autoPosEinvoicing,
  ecr_integrator_name: ecrIntegratorName
};

await api.post(`/api/invoices/company`, payload);
await fetchCompany(); // ✅ keep UI in sync
      showPopup(" Company configuration saved successfully!");
    } catch (err) {
      console.error("Error saving company:", err);
      showPopup(" Failed to save company configuration");
    } finally {
      setLoading(false);
    }
  };

    const handleFileChange = async (e) => {
  if (isReadOnly) return;   // ✅ HARD BLOCK

      const file = e.target.files[0];
      if (!file) return;

      const formData = new FormData();
      formData.append("logo", file); // MUST be "logo"

      try {
        setLoading(true);
        await api.post(
          `/api/invoices/company/logo`,
          formData,
          { headers: { "Content-Type": "multipart/form-data" } }
        );

        await fetchCompany(); // refresh signed URL
      } catch (err) {
        showPopup("Logo upload failed");
      } finally {
        setLoading(false);
      }
    };

const handleDrop = (e) => {
    if (isReadOnly) return;   // ✅ HARD BLOCK
  e.preventDefault();
  const file = e.dataTransfer.files[0];
  if (file) {
    const reader = new FileReader();
    reader.onload = () => setLogo(reader.result);
    reader.readAsDataURL(file);
  }
};


  useEffect(() => {
    fetchCompany();
  }, []);

  // ===== Permissions =====
let permissions = {};
try {
  const raw = localStorage.getItem("permissions");
  permissions = raw ? JSON.parse(raw) : {};
} catch {
  permissions = {};
}

const companyPerm = permissions?.company_config || {};
const canEditCompanyConfig = companyPerm.edit === true;
const isReadOnly = !canEditCompanyConfig;

  return (
    <div className="w-full h-screen bg-gray-100 flex flex-col overflow-y-auto">
      {/* Header */}
      <div className="sticky top-0 bg-white shadow p-6 border-b">
        <h2 className="text-2xl font-semibold text-gray-700">
          {t("SystemConfig.header.title")}
        </h2>
        <p className="text-sm text-gray-500">
          {t("SystemConfig.header.subtitle")}
        </p>
      </div>

      {/* Content */}
      <div
        className={`flex-grow p-6 flex flex-col lg:flex-row gap-8 transition
          ${isReadOnly ? "opacity-70" : ""}
        `}
      >
        {/* Left Column - Company Info */}
        <div className="w-full lg:w-1/2 bg-white rounded-xl shadow p-6">
          <h3 className="text-lg font-semibold text-gray-700 mb-4">
            {t("SystemConfig.sections.company_info")}
          </h3>

          {/* Company Name */}
          <div className="mb-4">
            <label className="block text-sm text-gray-600 mb-1">
              {t("SystemConfig.fields.company_name")}
            </label>
            <input
              type="text"
              value={companyName}
              onChange={(e) => setCompanyName(e.target.value)}
  disabled={isReadOnly}
  className={`w-full border rounded-md p-2 text-gray-700 outline-none
    ${isReadOnly ? "bg-gray-100 cursor-not-allowed" : "focus:ring-2 focus:ring-[#2f788a]"}
  `}            
  placeholder={t("SystemConfig.placeholders.company_name")}
            />
          </div>

          {/* Company Logo Upload */}
<div
  onDrop={isReadOnly ? undefined : handleDrop}
  onDragOver={isReadOnly ? undefined : (e) => e.preventDefault()}
  onClick={isReadOnly ? undefined : () => fileInputRef.current.click()}
  className={`border-2 border-dashed rounded-lg p-6 text-center transition
    ${isReadOnly
      ? "bg-gray-50 cursor-not-allowed"
      : "cursor-pointer hover:border-[#2f788a]"
    }
  `}
>
            {logo ? (
              <img
                src={logo}
                alt="Company Logo"
                className="mx-auto h-28 object-contain"
              />
            ) : (
              <div className="text-gray-500">
                <p className="text-sm mb-2">
                  Drag & drop your logo here, or click to upload
                </p>
                <p className="text-xs text-gray-400">PNG, JPG, or JPEG only</p>
              </div>
            )}
            <input
              type="file"
              accept="image/*"
              ref={fileInputRef}
              disabled={isReadOnly}
              className="hidden"
              onChange={handleFileChange}
            />
          </div>

          {/* Tax Info */}
          <div className="mt-6 grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-gray-600 mb-1">
                {t("SystemConfig.fields.tax_number")}
              </label>
              <input
                type="text"
                value={taxNumber}
                onChange={(e) => setTaxNumber(e.target.value)}
                disabled={isReadOnly}
                className="w-full border rounded-md p-2 text-gray-700 focus:ring-2 focus:ring-[#2f788a] outline-none"
                placeholder= {t("SystemConfig.placeholders.tax_number")}
              />
            </div>
            <div>
              <label className="block text-sm text-gray-600 mb-1">
                {t("SystemConfig.fields.tax_serial")}
              </label>
              <input
                type="text"
                value={taxSerial}
                onChange={(e) => setTaxSerial(e.target.value)}
                disabled={isReadOnly}
                className="w-full border rounded-md p-2 text-gray-700 focus:ring-2 focus:ring-[#2f788a] outline-none"
                placeholder={t("SystemConfig.placeholders.tax_serial")}
              />
            </div>
          </div>
          <div className="mt-6 grid grid-cols-1 gap-4">
  <div>
    <label className="block text-sm text-gray-600 mb-1">
      {t("SystemConfig.fields.phone")}
    </label>
    <input
      type="text"
      value={phone}
      onChange={(e) => setPhone(e.target.value)}
      disabled={isReadOnly}
      className="w-full border rounded-md p-2 text-gray-700 focus:ring-2 focus:ring-[#2f788a] outline-none"
      placeholder={t("SystemConfig.placeholders.phone")}
    />
  </div>

  <div>
    <label className="block text-sm text-gray-600 mb-1">
      {t("SystemConfig.fields.email")}
    </label>
    <input
      type="email"
      value={email}
      onChange={(e) => setEmail(e.target.value)}
      disabled={isReadOnly}
      className="w-full border rounded-md p-2 text-gray-700 focus:ring-2 focus:ring-[#2f788a] outline-none"
      placeholder={t("SystemConfig.placeholders.email")}
    />
  </div>

  <div>
    <label className="block text-sm text-gray-600 mb-1">
      {t("SystemConfig.fields.location")}
    </label>
    <input
      type="text"
      value={location}
      onChange={(e) => setLocation(e.target.value)}
      disabled={isReadOnly}
      className="w-full border rounded-md p-2 text-gray-700 focus:ring-2 focus:ring-[#2f788a] outline-none"
      placeholder={t("SystemConfig.placeholders.location")}
    />
  </div>

  <div className="mt-6">
  <label className="block text-sm text-gray-600 mb-1">
    {t("SystemConfig.fields.invoice_terms")}
  </label>

  <textarea
    value={invoiceTerms}
    onChange={(e) => setInvoiceTerms(e.target.value)}
    disabled={isReadOnly}
    rows={5}
    className={`w-full border rounded-md p-2 text-gray-700 outline-none resize-none
      ${isReadOnly ? "bg-gray-100 cursor-not-allowed" : "focus:ring-2 focus:ring-[#2f788a]"}
    `}
    placeholder={t("SystemConfig.placeholders.invoice_terms")}
  />
</div>

</div>

        </div>

        {/* Right Column - API Config */}
        <div className="w-full lg:w-1/2 bg-white rounded-xl shadow p-6">
<div className="mb-6">
  <label className="
    cursor-pointer
    flex items-center justify-between
    p-4
    rounded-lg
    border border-gray-200
    bg-white
    hover:border-gray-300
    transition-colors duration-200
  ">
    <div className="flex items-center gap-3 flex-1">
      <svg 
        xmlns="http://www.w3.org/2000/svg" 
        width="20" 
        height="20" 
        viewBox="0 0 24 24" 
        fill="none" 
        stroke="currentColor" 
        strokeWidth="1.75" 
        strokeLinecap="round" 
        strokeLinejoin="round"
        className="text-gray-400"
      >
        <path d="m17 15-5.5 5.5L9 18"/>
        <path d="M5 17.743A7 7 0 1 1 15.71 10h1.79a4.5 4.5 0 0 1 1.5 8.742"/>
      </svg>
      
      <div>
        <span className="font-medium text-gray-800 text-sm">
          {t("SystemConfig.toggles.auto_pos_einvoicing.title")}
        </span>
        <p className="text-xs text-gray-500 mt-0.5">
          {t("SystemConfig.toggles.auto_pos_einvoicing.description")}
        </p>
      </div>
    </div>

    {/* Simple Toggle */}
<div className="ml-4 flex-shrink-0">
  <input
    type="checkbox"
    className="
      w-5 h-5
      rounded
      border-2 border-gray-300
      text-green-500
      focus:ring-2 focus:ring-green-500 focus:ring-offset-2
      disabled:opacity-50 disabled:cursor-not-allowed
      cursor-pointer
      transition-colors
    "
    checked={autoPosEinvoicing}
    disabled={isReadOnly}
    onChange={(e) => setAutoPosEinvoicing(e.target.checked)}
  />
</div>
  </label>
</div>

          <h3 className="text-lg font-semibold text-gray-700 mb-4">
             {t("SystemConfig.sections.api_credentials")}
          </h3>

          <div className="mb-4">
            <label className="block text-sm text-gray-600 mb-1">
              Client ID
            </label>
            <input
              type="text"
              value={clientId}
              onChange={(e) => setClientId(e.target.value)}
              disabled={isReadOnly}
              className="w-full border rounded-md p-2 text-gray-700 focus:ring-2 focus:ring-[#2f788a] outline-none"
              placeholder="Enter client ID"
            />
          </div>

          <div className="mb-6">
            <label className="block text-sm text-gray-600 mb-1">
              Secret Key
            </label>
            <input
              type="text"
              value={secretKey}
              onChange={(e) => setSecretKey(e.target.value)}
              disabled={isReadOnly}
              className="w-full border rounded-md p-2 text-gray-700 focus:ring-2 focus:ring-[#2f788a] outline-none"
              placeholder="Enter secret key"
            />
          </div>

          <div className="mb-6">
            <label className="block text-sm text-gray-600 mb-1">
              {t("SystemConfig.fields.ecr_integrator_name")}
            </label>
            <input
              type="text"
              value={ecrIntegratorName}
              onChange={(e) => setEcrIntegratorName(e.target.value)}
              disabled={isReadOnly}
              className="w-full border rounded-md p-2 text-gray-700 focus:ring-2 focus:ring-[#2f788a] outline-none"
              placeholder={t("SystemConfig.placeholders.ecr_integrator_name")}
            />
          </div>

{canEditCompanyConfig && (
  <button
    onClick={saveCompany}
    disabled={loading}
    className="mt-4 w-full py-2 bg-[#2f788a] text-white rounded hover:bg-[#276472] transition disabled:opacity-50"
  >
    {loading ? t("SystemConfig.actions.saving") : t("SystemConfig.actions.save")}
  </button>
)}
        </div>
      </div>
            {popupMessage && (
        <Popup
          message={popupMessage}
          onClose={closePopup}
        />
      )}
      
    </div>
  );
};

export default CompanyConfig;
