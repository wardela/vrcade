import React, { forwardRef } from "react";
import BrandLogo from "../../components/brandlogo";
import RVHeaderDecoration from "./rvheaderdecoration.png";
import { moneyTafqeet } from "../invoices/moneyTafqeet";

const TYPE_AR = {
  cash: "نقداً",
  bank_transfer: "حوالة بنكية",
  cheque: "شيك"
};

const DueBalancePrint = forwardRef(({ company, data }, ref) => {
  if (!data) return null;

  const { due, receipts, totals } = data;

  return (
    <div
      ref={ref}
      dir="rtl"
      className="text-sm text-gray-900 font-sans"
      style={{ lineHeight: "1.8" }}
    >
      <div className="relative min-h-screen">
        {/* Header decoration */}
        <img
          src={RVHeaderDecoration}
          className="absolute top-0 left-0 w-full"
          style={{ height: "50px" }}
        />

        <div className="p-8 pt-[90px]">
          {/* Company header – unchanged */}
        <div className="flex justify-start items-start pb-4 mb-4">
          {/* LEFT: LOGO + COMPANY INFO */}
<div className="flex items-start max-w-[65%] mr-6">
  {/* LOGO */}
  <div className="w-20 h-24 flex items-center justify-center flex-shrink-0">
    {company?.logo_url ? (
      <img
        src={company.logo_url}
        alt="Company Logo"
        className="max-h-full max-w-full object-contain"
      />
    ) : null}
  </div>

  {/* VERTICAL DIVIDER */}
  <div className="mx-4 w-px border border-[#161356] h-24 " />

  {/* COMPANY INFO */}
  <div className="text-right leading-snug">
    <h2 className="text-xl font-bold text-[#161356]">
      {company?.company_name || "—"}
    </h2>

    {company?.company_location ? (
      <p className="text-sm text-gray-700 mt-1">
        {company.company_location}
      </p>
    ) : null}

    {company?.tax_number ? (
      <p className="text-sm text-gray-700 mt-0.5 flex flex-row items-center" dir="rtl">
    <p className="text-sm text-gray-700 ml-1">
     الرقم الضريبي : 
    </p>
        {company.tax_number}
      </p>
    ) : null}

    {company?.phone_number ? (
      <p className="text-sm text-gray-700 mt-0.5" dir="ltr">
        {company.phone_number}
      </p>
    ) : null}
  </div>
</div>

        </div>


          {/* Title */}
          <h1 className="text-2xl font-bold text-[#161356] mb-8 text-center underline">
            كشف ذمة مالية
          </h1>

          {/* === CORE ANSWER BOX === */}
          <div className="border-2 border-black rounded-lg p-6 mb-8">
            <div className="grid grid-cols-3 gap-6 text-center text-sm">
              <div>
                <p className="text-gray-500 mb-1">إجمالي الذمة</p>
                <p className="text-lg font-semibold" dir="ltr">
                  {Number(totals.total_due).toFixed(3)}
                </p>
              </div>

              <div>
                <p className="text-gray-500 mb-1">إجمالي المدفوع</p>
                <p className="text-lg font-semibold" dir="ltr">
                  {Number(totals.total_paid).toFixed(3)}
                </p>
              </div>

              <div>
                <p className="text-gray-500 mb-1">المتبقي</p>
                <p
                  className="text-xl font-bold"
                  dir="ltr"
                  style={{
                    color:
                      totals.total_outstanding > 0
                        ? "#b91c1c"
                        : "#166534"
                  }}
                >
                  {Number(totals.total_outstanding).toFixed(3)}
                </p>
              </div>
            </div>
          </div>

          {/* Due meta (small, secondary info) */}
          <div className="mb-10 text-sm text-gray-700">
            <p><strong>العميل:</strong> {due.client}</p>
            <p><strong> الذمة:</strong> {due.reason}</p>
            <p><strong>تاريخ الإنشاء:</strong> {due.date}</p>
          </div>

          {/* === PAYMENT DETAILS === */}
          <h2 className="text-lg font-semibold mb-4">
            تفاصيل الدفعات
          </h2>

          {receipts.length === 0 ? (
            <p className="text-sm text-gray-500">
              لم يتم تسجيل أي دفعات على هذه الذمة
            </p>
          ) : (
            <table className="w-full border border-gray-300 text-sm mb-14">
              <thead className="bg-gray-100">
                <tr>
                  <th className="border px-3 py-2">رقم السند</th>
                  <th className="border px-3 py-2">التاريخ</th>
                  <th className="border px-3 py-2">طريقة الدفع</th>
                  <th className="border px-3 py-2">البيان</th>
                  <th className="border px-3 py-2">المبلغ</th>
                </tr>
              </thead>
              <tbody>
                {receipts.map((rv, i) => (
                  <tr key={i}>
                    <td className="border px-3 py-2 text-center">
                      {rv.receipt_number}
                    </td>
                    <td className="border px-3 py-2 text-center">
                      {rv.date}
                    </td>
                    <td className="border px-3 py-2 text-center">
                      {TYPE_AR[rv.type]}
                    </td>
                    <td className="border px-3 py-2">
                      {rv.reason || "-"}
                    </td>
                    <td className="border px-3 py-2 text-right" dir="ltr">
                      {Number(rv.amount).toFixed(3)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          {/* Signature */}
          <div className="flex justify-end mt-48">
            <div className="text-center">
              <div className="w-48 border-t border-black mb-2 " />
              <p>قسم المحاسبة</p>
            </div>
          </div>
        </div>

        {/* Footer – unchanged */}
        <div
          className="absolute bottom-0 w-full border-t py-2 text-center text-xs"
          dir="ltr"
        >
          Powered by <BrandLogo size={14} /> INNOVATION ELEMENTS™
        </div>
      </div>
    </div>
  );
});

export default DueBalancePrint;
