import React, { forwardRef } from "react";
import BrandLogo from "../../components/brandlogo";

const FIRST_PAGE_LIMIT = 16;
const OTHER_PAGES_LIMIT = 20;

const paginateRows = (rows) => {
  const allRows = Array.isArray(rows) ? rows : [];
  const pages = [];
  let index = 0;

  pages.push(allRows.slice(0, FIRST_PAGE_LIMIT));
  index = FIRST_PAGE_LIMIT;

  while (index < allRows.length) {
    pages.push(allRows.slice(index, index + OTHER_PAGES_LIMIT));
    index += OTHER_PAGES_LIMIT;
  }

  return pages.length > 0 ? pages : [[]];
};

const formatCurrency = (value) =>
  Number(value || 0).toLocaleString(undefined, {
    minimumFractionDigits: 3,
    maximumFractionDigits: 3,
  });

const formatDate = (value) => {
  if (!value) return "—";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return value;

  return new Intl.DateTimeFormat(undefined, {
    year: "numeric",
    month: "short",
    day: "2-digit",
  }).format(parsed);
};

const formatTime = (value) => {
  if (!value) return "—";
  return String(value).slice(0, 5);
};

const InfoField = ({ label, value }) => (
  <div className="rounded-md border border-gray-300 bg-white px-3 py-2">
    <div className="text-[11px] uppercase tracking-wide text-gray-500">{label}</div>
    <div className="mt-1 whitespace-pre-wrap text-sm font-medium text-gray-900">{value || "—"}</div>
  </div>
);

const EventDetailsPrint = forwardRef(({ company, event }, ref) => {
  const payments = event?.payments || [];
  const pages = paginateRows(payments);
  const totalPages = pages.length || 1;

  return (
    <div ref={ref} dir="ltr" className="text-sm text-gray-900 font-sans" style={{ lineHeight: "1.6" }}>
      {pages.map((pageRows, pageIndex) => (
        <div
          key={pageIndex}
          className="relative p-8"
          style={{
            pageBreakAfter: pageIndex < totalPages - 1 ? "always" : "auto",
            minHeight: "100vh",
          }}
        >
          <div className="flex justify-between items-start pb-4 mb-3 border-b border-gray-400">
            <div className="flex gap-4 items-start max-w-[65%]">
              <div className="w-20 h-20 flex items-center justify-center flex-shrink-0">
                {company?.logo_url && (
                  <img
                    src={company.logo_url}
                    alt="Company Logo"
                    className="max-h-full max-w-full object-contain"
                  />
                )}
              </div>

              <div className="leading-snug">
                <h2 className="text-xl font-bold text-black">{company?.company_name || "Company"}</h2>

                {company?.company_location && (
                  <p className="text-sm text-gray-700 mt-1">{company.company_location}</p>
                )}

                {company?.phone_number && (
                  <p className="text-sm text-gray-700 mt-0.5" dir="ltr">
                    {company.phone_number}
                  </p>
                )}
              </div>
            </div>

            {company?.tax_number && (
              <div className="border border-gray-300 rounded-md px-5 py-3 text-right">
                <p className="text-xs text-gray-600 mb-1">Tax Number</p>
                <p className="text-lg font-semibold tracking-wide" dir="ltr">
                  {company.tax_number}
                </p>
              </div>
            )}
          </div>

          {pageIndex === 0 && (
            <>
              <div className="mb-4 flex justify-center">
                <div className="flex items-center gap-4 px-4 py-1.5 border border-gray-500 rounded-md text-[12px] text-gray-800 tracking-wide">
                  <span className="font-bold whitespace-nowrap">Event Details</span>
                  <span className="h-3 w-px bg-gray-300" />
                  <div className="flex items-center gap-2 text-gray-700">
                    <span className="text-gray-500 whitespace-nowrap">Event</span>
                    <span className="font-semibold whitespace-nowrap">{event?.name || "—"}</span>
                  </div>
                  <span className="h-3 w-px bg-gray-300" />
                  <div className="flex items-center gap-2 text-gray-700">
                    <span className="text-gray-500 whitespace-nowrap">Date</span>
                    <span className="font-mono text-gray-900">{event?.event_date || "—"}</span>
                  </div>
                </div>
              </div>

              <section className="mb-5">
                <h3 className="text-base font-bold border-b border-gray-300 pb-2 mb-3">
                  Operational Details
                </h3>
                <div className="grid grid-cols-2 gap-3">
                  <InfoField label="Event Name" value={event?.name} />
                  <InfoField label="Type" value={event?.type} />
                  <InfoField label="Client" value={event?.client_name} />
                  <InfoField label="Location" value={event?.location} />
                  <InfoField label="Event Date" value={formatDate(event?.event_date)} />
                  <InfoField label="Event Time" value={formatTime(event?.event_time)} />
                  <div className="col-span-2">
                    <InfoField label="Details" value={event?.details} />
                  </div>
                  <div className="col-span-2">
                    <InfoField label="Notes" value={event?.notes} />
                  </div>
                </div>
              </section>

              <section className="mb-5">
                <h3 className="text-base font-bold border-b border-gray-300 pb-2 mb-3">
                  Financial Summary
                </h3>
                <div className="grid grid-cols-3 gap-3">
                  <div className="rounded-md border border-gray-300 bg-gray-50 px-4 py-4">
                    <div className="text-[11px] uppercase tracking-wide text-gray-500">Total Amount</div>
                    <div className="mt-2 text-xl font-bold text-gray-900">
                      {formatCurrency(event?.total_amount)} JOD
                    </div>
                  </div>
                  <div className="rounded-md border border-gray-300 bg-gray-50 px-4 py-4">
                    <div className="text-[11px] uppercase tracking-wide text-gray-500">Total Paid</div>
                    <div className="mt-2 text-xl font-bold text-gray-900">
                      {formatCurrency(event?.total_paid)} JOD
                    </div>
                  </div>
                  <div className="rounded-md border border-gray-300 bg-gray-50 px-4 py-4">
                    <div className="text-[11px] uppercase tracking-wide text-gray-500">
                      Remaining Amount
                    </div>
                    <div className="mt-2 text-xl font-bold text-gray-900">
                      {formatCurrency(event?.remaining_balance)} JOD
                    </div>
                  </div>
                </div>
              </section>
            </>
          )}

          <section>
            <h3 className="text-base font-bold border-b border-gray-300 pb-2 mb-3">
              Payment Tracking
            </h3>
            <div className="border border-gray-300 rounded-sm overflow-hidden">
              <table className="w-full text-left border-collapse">
                <thead className="bg-gray-100 border-b border-gray-400">
                  <tr>
                    <th className="py-2 px-3 font-semibold">Payment Date</th>
                    <th className="py-2 px-3 font-semibold">Payment Type</th>
                    <th className="py-2 px-3 font-semibold">Amount</th>
                    <th className="py-2 px-3 font-semibold">Invoice Number</th>
                    <th className="py-2 px-3 font-semibold">Notes</th>
                  </tr>
                </thead>
                <tbody>
                  {pageRows.map((payment, index) => (
                    <tr
                      key={payment?.id || index}
                      className={`border-b border-gray-200 ${index % 2 === 0 ? "bg-white" : "bg-gray-50"}`}
                    >
                      <td className="py-2 px-3">{formatDate(payment?.payment_date)}</td>
                      <td className="py-2 px-3 capitalize">{payment?.payment_type || "—"}</td>
                      <td className="py-2 px-3 font-medium" dir="ltr">
                        {formatCurrency(payment?.amount)} JOD
                      </td>
                      <td className="py-2 px-3" dir="ltr">
                        {payment?.invoice_number || "—"}
                      </td>
                      <td className="py-2 px-3">{payment?.notes || "—"}</td>
                    </tr>
                  ))}

                  {pageRows.length === 0 && (
                    <tr>
                      <td colSpan={5} className="py-10 text-center text-gray-400">
                        No payments recorded for this event.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </section>

          <div className="mt-3 text-center text-xs text-gray-500">
            Page {pageIndex + 1} of {totalPages}
          </div>

          <div className="absolute bottom-0 left-0 w-full bg-white border-t border-gray-300 py-2" dir="ltr">
            <div className="text-center text-[11px] text-gray-700 flex items-center justify-center gap-2">
              <span className="text-gray-500">Powered by</span>
              <BrandLogo size={16} />
              <span className="font-semibold tracking-wide">INNOVATION ELEMENTS™</span>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
});

export default EventDetailsPrint;
