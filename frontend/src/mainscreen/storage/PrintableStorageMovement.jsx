import React, { forwardRef } from "react";
import logo from "../invoices/jingoslogo.png";
import BrandLogo from "../../components/brandlogo";
const PrintableStorageMovement = forwardRef(
  ({ data, company }, ref) => {
  const isIn = data.direction === "IN";

  const formatDate = (d) => {
    const dt = new Date(d);
    return dt.toLocaleString("ar-JO");
  };

  return (
    <div
      ref={ref}
      dir="rtl"
      className="p-10 bg-white text-black w-[210mm] min-h-[297mm] font-sans text-[14px]"
    >
      {/* HEADER */}
      <div className="flex justify-between items-start pb-4 mb-3 border-b border-gray-400">

  {/* LEFT — LOGO + COMPANY INFO */}
  <div className="flex gap-4 items-start max-w-[65%]">

    {/* LOGO */}
    <div className="w-20 h-20 flex items-center justify-center flex-shrink-0">
      {company?.logo_url && (
        <img
          src={company.logo_url}
          alt="Company Logo"
          className="max-h-full max-w-full object-contain"
        />
      )}
    </div>

    {/* COMPANY DETAILS */}
    <div className="text-right leading-snug">
      <h2 className="text-xl font-bold text-black">
        {company?.company_name}
      </h2>

      {company?.company_location && (
        <p className="text-sm text-gray-700 mt-1">
          {company.company_location}
        </p>
      )}

      {company?.phone_number && (
        <p className="text-sm text-gray-700 mt-0.5" dir="ltr">
          {company.phone_number}
        </p>
      )}
    </div>
  </div>

  {/* RIGHT — TAX INFO */}
  {company?.tax_number && (
    <div className="text-right border border-gray-300 rounded-md px-5 py-3">
      <p className="text-xs text-gray-600 mb-1">
        الرقم الضريبي
      </p>
      <p className="text-lg font-semibold tracking-wide" dir="ltr">
        {company.tax_number}
      </p>
    </div>
  )}
</div>

      {/* INFO */}
      <div className="grid grid-cols-2 gap-6 mb-6 text-sm">
        <div>
          <p><strong>الصنف:</strong> {data.item_name}</p>
          <p><strong>كود الصنف:</strong> {data.item_code}</p>
          <p><strong>وحدة القياس:</strong> {data.unit_name}</p>
        </div>

        <div>
          <p><strong>المخزن:</strong> {data.storage_name}</p>
          {data.storage_location && (
            <p><strong>الموقع:</strong> {data.storage_location}</p>
          )}
          <p>
            <strong>النوع:</strong>{" "}
            {isIn ? "إدخال" : "إخراج"}
          </p>
        </div>
      </div>

      {/* QTY BOX */}
      <div className="border rounded-lg p-6 mb-6 bg-gray-50 text-center">
        <p className="text-sm mb-2">الكمية</p>
        <p className="text-3xl font-bold text-[#2f788a]">
          {data.qty}
        </p>
      </div>

      {/* NOTES */}
      {data.notes && (
        <div className="mb-10">
          <p className="font-semibold mb-1">ملاحظات:</p>
          <div className="border rounded p-3 min-h-[60px]">
            {data.notes}
          </div>
        </div>
      )}

      {/* SIGNATURES */}
      <div className="flex justify-between mt-20">
        <div className="text-center">
          <p className="mb-6">____________________</p>
          <p>المستلم</p>
        </div>
        <div className="text-center">
          <p className="mb-6">____________________</p>
          <p>أمين المستودع</p>
        </div>
      </div>

{/* ===================== BOTTOM FOOTER ====================== */}
<div
  className="absolute bottom-0 left-0 w-full bg-white border-t border-gray-300 py-2"
  dir="ltr"
>
<div className="text-center text-[11px] text-gray-700 flex items-center justify-center gap-2">
  <span className="text-gray-500">
    Powered by 
  </span>

  <BrandLogo size={16} />

  <span className="font-semibold tracking-wide">
    INNOVATION ELEMENTS™
  </span>
</div>

</div>
    </div>
  );
});

export default PrintableStorageMovement;
