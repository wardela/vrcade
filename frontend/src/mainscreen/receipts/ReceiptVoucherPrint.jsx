import React, { forwardRef } from "react";
import BrandLogo from "../../components/brandlogo";
import RVHeaderDecoration from "./rvheaderdecoration.png";
import { moneyTafqeet } from "../invoices/moneyTafqeet"
const TYPE_AR = {
  cash: "نقداً",
  bank_transfer: "حوالة بنكية",
  cheque: "شيك"
};

const ReceiptVoucherPrint = forwardRef(({ company, receipt }, ref) => {
  if (!receipt) return null;

  const cheques = Array.isArray(receipt.cheques) ? receipt.cheques : [];
  const isCheque = receipt.type === "cheque";

    const amount = Number(receipt.amount || 0).toFixed(3);
    const [dinars, filsRaw] = amount.split(".");
    const fils = filsRaw.padEnd(3, "0");

  return (
    <div
      ref={ref}
      dir="rtl"
      className="text-sm text-gray-900 font-sans"
      style={{ lineHeight: "1.8" }}
    >
      <div className="relative" style={{ minHeight: "100vh" }}>
        {/* ================= HEADER DECORATION ================= */}
        <img
        src={RVHeaderDecoration}
        alt="Header Decoration"
        className="absolute top-0 left-0 w-full object-cover"
        style={{ height: "50px" }}
        />
        {/* ================= COMPANY HEADER ================= */}
        <div className="p-8 pt-[90px]">
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

        {/* ================= TITLE ================= */}
        <div className="mb-4 flex justify-center">
          <div className="text-2xl text-[#161356] underline font-bold">
            سند قبض
          </div>
        </div>

        {/* ================= META STRIP ================= */}
        <div className="border border-gray-700 mb-5 w-[90%] mr-auto ml-auto rounded-sm">
        <div className="flex  text-sm">

            {/* Voucher Number */}
            <div className="flex-1 px-4 py-2 text-right w-1/3">
            <span className="font-semibold ml-1">رقم السند :</span>
            <span className="ml-2 font-bold" dir="ltr">
                {receipt.receipt_number || "—"}
            </span>
            </div>

            {/* Date */}
            <div className="flex-1 px-4 py-2 text-center w-1/3">
            <span className="font-semibold ml-1">تاريخ السند :</span>
            <span className="ml-2 font-bold" dir="ltr">
                {receipt.date || "—"}
            </span>
            </div>

            {/* Payment Type */}
            <div className="flex-1 px-4 py-2 text-left w-1/3">
            <span className="font-semibold ml-1">طريقة الدفع :</span>
            <span className="font-bold">
                {TYPE_AR[receipt.type] || "—"}
            </span>
            </div>

        </div>
        </div>

        {/* ================= MAIN RV BODY ================= */}
        <div className="w-[90%] mx-auto text-sm text-gray-900">

        {/* استلمنا من */}
        <div className="mb-4 text-md">
            <span className="font-bold">استلمنا من السيد / السادة :</span>
            <span className="mr-2 font-bold">{receipt.client || "—"}</span>
        </div>

        {/* AMOUNT TABLE */}
        <div className="mb-4 rounded-xl border border-black overflow-hidden ">
        <table className="w-full text-center rounded-lg">
            <thead>
            <tr className="font-bold text-black text-sm ">
                <th className="border-l border-b border-black py-2">المبلغ</th>
                <th className="border-l border-black py-2">فلس</th>
                <th className="border-l border-black py-2">دينار</th>
                <th className="border-b border-black py-2 text-right pr-3">كتابة</th>
            </tr>
            </thead>

            <tbody>
            <tr className="text-sm ">
                {/* المبلغ (dot) */}
                <td className="border-l border-t border-black py-2">●</td>

                {/* فلس */}
                <td className="border-l border-t border-black py-2 font-bold" dir="ltr">
                {fils}
                </td>

                {/* دينار */}
                <td className="border-l border-t border-black py-2 font-bold" dir="ltr">
                {dinars}
                </td>

                {/* كتابة */}
                <td className="border-r border-black py-2 text-right px-3 font-semibold">
                {moneyTafqeet(receipt.amount)} فقط لا غير
                </td>
            </tr>
            </tbody>
        </table>
        </div>
        {/* وذلك مقابل */}
        <div className="mt-4 text-md">
            <span className="font-bold">وذلك مقابل :</span>
            <span className="mr-2 font-bold">{receipt.reason || "—"}</span>
        </div>

        </div>


        {/* ================= CHEQUES (IF ANY) ================= */}
        {isCheque && (
          <div className="mb-8 mt-5 w-[90%] ml-auto mr-auto">
            <div className="mb-2 font-bold text-gray-900">ب شيك / شيكات :</div>

            <div className="border border-gray-300 rounded-md overflow-hidden">
              <table className="w-full text-right border-collapse">
                <thead className="bg-gray-100 border-b border-gray-400">
                  <tr>
                    <th className="py-1 px-3 font-semibold">رقم الشيك</th>
                    <th className="py-1 px-3 font-semibold">قيمة الشيك</th>
                    <th className="py-1 px-3 font-semibold">تاريخ التحصيل</th>
                    <th className="py-1 px-3 font-semibold">اسم البنك</th>
                  </tr>
                </thead>

                <tbody>
                  {cheques.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="py-4 px-3 text-center text-gray-500">
                        لا يوجد شيكات
                      </td>
                    </tr>
                  ) : (
                    cheques.map((ch) => (
                      <tr key={ch.id} className="border-b border-gray-200">
                        <td className="py-1 px-3" dir="ltr">{ch.cheque_number || "—"}</td>
                        <td className="py-1 px-3" dir="ltr">{ch.cheque_amount ?? "—"}</td>
                        <td className="py-1 px-3" dir="ltr">{ch.due_date || "—"}</td>
                        <td className="py-1 px-3">{ch.beneficiary_bank || "—"}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

          <div className="flex justify-end items-start mt-64 mb-20 w-[90%] ml-auto mr-auto">
            <div className="text-center text-black">
                <div className="w-48 border-t border-black mb-3" />
              <p className="text-sm">قسم المحاسبة</p>
            </div>
          </div>

    <h2 className="text-xs text-black w-[90%] ml-auto mr-auto">
    وبهذا نقر نحن  <span className="text-md font-bold text-black"> {company?.company_name || "—"} </span> باستلام المبلغ المذكور أعلاه بالكامل.
    </h2>

        {/* ================= FOOTER ================= */}
        <div
          className="absolute bottom-0 left-0 w-full bg-white border-t border-gray-300 py-2"
          dir="ltr"
        >
          <div className="text-center text-[11px] text-gray-700 flex items-center justify-center gap-2">
            <span className="text-gray-500">Powered by</span>
            <BrandLogo size={16} />
            <span className="font-semibold tracking-wide">INNOVATION ELEMENTS™</span>
          </div>
        </div>
      </div>      
      </div>
    </div>
  );
});

export default ReceiptVoucherPrint;
