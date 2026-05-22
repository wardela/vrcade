import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  createPortalInvoice,
  fetchPortalInvoiceCompany,
  fetchPortalInvoiceDetail,
  fetchPortalInvoiceStorages,
  fetchPortalNextInvoiceNumber,
  sharePortalInvoice,
} from "../../api/portalApi";
import { prepareCompanyWithLogo } from "../../utils/companyLogo";
import { useReactToPrint } from "../reports/usePortalReactToPrint";
import PrintableInvoice from "../invoices/PrintableInvoice";
import AdvancedDataModal from "./AdvancedDataModal";
import ClientPickerModal from "./ClientPickerModal";
import CreateInvoiceHeaderCard from "./CreateInvoiceHeaderCard";
import InvoiceLineEditModal from "./InvoiceLineEditModal";
import ItemBrowserModal from "./ItemBrowserModal";
import QuantityModal from "./QuantityModal";
import ShareConfirmModal from "./ShareConfirmModal";
import TotalsBar from "./TotalsBar";
import { ActionButton, Banner, EmptyState } from "./CreateInvoiceUi";
import {
  buildInvoicePayload,
  buildPrintableInvoiceData,
  calculateInvoiceLineValues,
  calculateInvoiceTotals,
  createInvoiceItemFromCatalog,
  format3,
  getLocalDate,
  nextLineId,
  resequenceInvoiceItems,
} from "./invoiceMath";

function NoAccess() {
  const { t } = useTranslation();

  return (
    <div className="rounded-[28px] border border-[#f1d4d4] bg-[#fff7f7] px-5 py-6 text-center shadow-[0_18px_36px_rgba(166,74,74,0.08)]">
      <p className="portal-eyebrow">{t("portalShell.modules.create_invoice")}</p>
      <h3 className="text-lg font-semibold text-[#8e3d3d]">
        {t("portalCreateInvoice.no_access")}
      </h3>
    </div>
  );
}

function InvoiceItemRow({ item, onEdit, onRemove }) {
  const { t } = useTranslation();
  const line = calculateInvoiceLineValues(item);

  return (
    <div className="flex items-center gap-3 border-b border-[#edf2f4] last:border-b-0">
      <button
        type="button"
        onClick={onEdit}
        className="flex min-w-0 flex-1 items-center justify-between gap-3 py-4 text-start"
      >
        <div className="min-w-0">
          <div className="truncate text-sm font-semibold text-slate-800">
            {item.desc || t("portalCreateInvoice.items.unnamed_item")}
          </div>
          <div className="mt-1 flex flex-wrap gap-x-3 gap-y-1 text-xs text-slate-500">
            <span>{format3(item.price)}</span>
            <span>
              {t("portalCreateInvoice.items.quantity_short")} {format3(item.qty)}
            </span>
            <span>{item.unit_name || t("portalCommon.empty.value")}</span>
          </div>
        </div>

        <div className="shrink-0 text-end">
          <div className="text-sm font-bold text-[#2f788a]">{format3(line.totalIncl)}</div>
        </div>
      </button>

      <button
        type="button"
        onClick={onRemove}
        className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-[#f0d0d0] bg-[#fff1f1] text-[#c04848] transition hover:-translate-y-[1px]"
        aria-label={t("portalCreateInvoice.items.remove_item", {
          item: item.desc || t("portalCreateInvoice.items.unnamed_item"),
        })}
      >
        <svg className="h-4 w-4" viewBox="0 0 24 24" aria-hidden="true">
          <path
            d="M6 7h12M9 7V5h6v2m-7 3v7m4-7v7m4-7v7M8 21h8a1 1 0 0 0 1-1V7H7v13a1 1 0 0 0 1 1Z"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </button>
    </div>
  );
}

export default function CreateInvoiceScreen({ session }) {
  const { t } = useTranslation();
  const salesPerm = session?.permissions?.sales || {};
  const einvPerm = session?.permissions?.einvoicing || {};
  const canAdd = salesPerm.add === true;
  const canShare = einvPerm.view === true;

  const [bootLoading, setBootLoading] = useState(true);
  const [bootError, setBootError] = useState("");
  const [banner, setBanner] = useState(null);
  const [saving, setSaving] = useState(false);
  const [company, setCompany] = useState(null);
  const [storages, setStorages] = useState([]);
  const [invoiceNumber, setInvoiceNumber] = useState("");
  const [clientId, setClientId] = useState(null);
  const [clientName, setClientName] = useState("");
  const [invoiceDate, setInvoiceDate] = useState(getLocalDate());
  const [paymentType, setPaymentType] = useState("credit");
  const [notes, setNotes] = useState("");
  const [type2, setType2] = useState("local");
  const [currency, setCurrency] = useState("JOD");
  const [clientPhone, setClientPhone] = useState("");
  const [clientDetailType, setClientDetailType] = useState("TN");
  const [clientDetailValue, setClientDetailValue] = useState("");
  const [reference, setReference] = useState("");
  const [createDueBalance, setCreateDueBalance] = useState(true);
  const [invoiceItems, setInvoiceItems] = useState([]);

  const [clientModalOpen, setClientModalOpen] = useState(false);
  const [advancedModalOpen, setAdvancedModalOpen] = useState(false);
  const [itemBrowserOpen, setItemBrowserOpen] = useState(false);
  const [quantityModalOpen, setQuantityModalOpen] = useState(false);
  const [lineEditOpen, setLineEditOpen] = useState(false);
  const [shareConfirmOpen, setShareConfirmOpen] = useState(false);

  const [pendingCatalogItem, setPendingCatalogItem] = useState(null);
  const [editingIndex, setEditingIndex] = useState(null);
  const [replaceTargetIndex, setReplaceTargetIndex] = useState(null);

  const [printablePayload, setPrintablePayload] = useState(null);
  const [pendingPrint, setPendingPrint] = useState(false);
  const [resetAfterPrint, setResetAfterPrint] = useState(false);
  const printRef = useRef(null);

  const totals = calculateInvoiceTotals(invoiceItems);
  const exemptAllowed = clientDetailType === "TN" && String(clientDetailValue || "").trim() !== "";

  const loadBootstrap = async () => {
    try {
      setBootLoading(true);
      setBootError("");

      const [companyPayload, storagesPayload, nextNumberPayload] = await Promise.all([
        fetchPortalInvoiceCompany(),
        fetchPortalInvoiceStorages(),
        fetchPortalNextInvoiceNumber(),
      ]);

      const preparedCompany = await prepareCompanyWithLogo(companyPayload || null);

      setCompany(preparedCompany);
      setStorages(storagesPayload || []);
      setInvoiceNumber(nextNumberPayload?.next_invoice_number || "");
      setClientId(null);
      setClientName("");
      setInvoiceDate(getLocalDate());
      setPaymentType("credit");
      setNotes("");
      setType2("local");
      setCurrency("JOD");
      setClientPhone("");
      setClientDetailType("TN");
      setClientDetailValue("");
      setReference("");
      setCreateDueBalance(true);
      setInvoiceItems([]);
      setEditingIndex(null);
      setReplaceTargetIndex(null);
      setPendingCatalogItem(null);
    } catch (error) {
      setBootError(error.message || t("portalCreateInvoice.errors.load_failed"));
    } finally {
      setBootLoading(false);
    }
  };

  useEffect(() => {
    if (!canAdd) return;
    loadBootstrap();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [canAdd]);

  useEffect(() => {
    if (paymentType === "credit") {
      setCreateDueBalance(true);
    } else if (paymentType === "cash") {
      setCreateDueBalance(false);
    }
  }, [paymentType]);

  useEffect(() => {
    if (exemptAllowed) return;

    setInvoiceItems((current) =>
      current.map((item) => (item.exempt ? { ...item, exempt: false } : item))
    );
  }, [clientDetailType, clientDetailValue, exemptAllowed]);

  const handlePrint = useReactToPrint({
    content: () => printRef.current,
    documentTitle: printablePayload?.invoiceNumber
      ? `invoice-${printablePayload.invoiceNumber}`
      : "invoice",
    pageStyle: `
      @page { size: A4; margin: 6mm; }
      body { -webkit-print-color-adjust: exact; }
    `,
    onAfterPrint: async () => {
      if (resetAfterPrint) {
        setResetAfterPrint(false);
        await loadBootstrap();
      }
    },
  });

  useEffect(() => {
    if (!pendingPrint || !printablePayload || !printRef.current) return;

    const timerId = window.setTimeout(() => {
      setPendingPrint(false);
      handlePrint();
    }, 60);

    return () => window.clearTimeout(timerId);
  }, [handlePrint, pendingPrint, printablePayload]);

  if (!canAdd) {
    return <NoAccess />;
  }

  const openReplaceItemFlow = () => {
    setReplaceTargetIndex(editingIndex);
    setLineEditOpen(false);
    setItemBrowserOpen(true);
  };

  const handleClientSelect = (client) => {
    setClientId(client.id);
    setClientName(client.name || "");
    setClientPhone(client.phone || "");
    setClientDetailType(client.detail_type || "TN");
    setClientDetailValue(client.detail_value || "");
    setClientModalOpen(false);
  };

  const handleItemSelected = (item) => {
    setPendingCatalogItem(item);
    setItemBrowserOpen(false);
    setQuantityModalOpen(true);
  };

  const handleQuantityConfirm = (quantity) => {
    const targetIndex = replaceTargetIndex;
    const nextItemId = targetIndex == null ? nextLineId(invoiceItems) : invoiceItems[targetIndex]?.id;
    const nextItem = createInvoiceItemFromCatalog(pendingCatalogItem, nextItemId, quantity);

    setInvoiceItems((current) => {
      if (targetIndex == null) {
        return [...current, nextItem];
      }

      return current.map((item, index) => (index === targetIndex ? nextItem : item));
    });

    setPendingCatalogItem(null);
    setQuantityModalOpen(false);
    setReplaceTargetIndex(null);
    setBanner(null);
  };

  const handleSaveLine = (nextItem) => {
    setInvoiceItems((current) =>
      current.map((item, index) => (index === editingIndex ? nextItem : item))
    );
    setLineEditOpen(false);
    setEditingIndex(null);
  };

  const validateInvoice = () => {
    if (paymentType === "credit" && !clientId) {
      return t("portalCreateInvoice.errors.client_required_for_credit");
    }

    const hasInvalidExemptItems = invoiceItems.some((item) => item.exempt && !exemptAllowed);
    if (hasInvalidExemptItems) {
      return t("portalCreateInvoice.errors.exempt_requires_client_detail");
    }

    if (invoiceItems.length === 0) {
      return t("portalCreateInvoice.errors.add_item_before_save");
    }

    const hasInvalidItems = invoiceItems.some((item) => item._isValidItem !== true);
    if (hasInvalidItems) {
      return t("portalCreateInvoice.errors.invalid_items");
    }

    const hasMissingStorage = invoiceItems.some(
      (item) => item.is_stocked === true && !item.storage_id
    );
    if (hasMissingStorage) {
      return t("portalCreateInvoice.errors.missing_storage");
    }

    return "";
  };

  const saveCurrentInvoice = async () => {
    const validationError = validateInvoice();
    if (validationError) {
      setBanner({
        tone: "error",
        message: validationError,
      });
      return null;
    }

    const payload = buildInvoicePayload({
      invoiceNumber,
      invoiceDate,
      paymentType,
      type2,
      currency,
      clientPhone,
      clientDetailType,
      clientDetailValue,
      clientId,
      clientName,
      notes,
      reference,
      createDueBalance,
      invoiceItems,
    });

    setSaving(true);
    setBanner(null);

    try {
      const created = await createPortalInvoice(payload);
      return created;
    } catch (error) {
      setBanner({
        tone: "error",
        message: error.message || t("portalCreateInvoice.errors.save_failed"),
      });
      return null;
    } finally {
      setSaving(false);
    }
  };

  const handleSave = async () => {
    const created = await saveCurrentInvoice();
    if (!created) return;

    setBanner({
      tone: "success",
      message: t("portalCreateInvoice.messages.saved", {
        invoiceNumber: created.header.invoice_number,
      }),
    });
    await loadBootstrap();
  };

  const handleSaveAndShare = async () => {
    const created = await saveCurrentInvoice();
    if (!created) return;

    setSaving(true);

    try {
      const shared = await sharePortalInvoice(created.header.invoice_number);
      setBanner({
        tone: "success",
        message: shared?.already_shared
          ? t("portalCreateInvoice.messages.already_shared", {
              invoiceNumber: created.header.invoice_number,
            })
          : t("portalCreateInvoice.messages.shared", {
              invoiceNumber: created.header.invoice_number,
            }),
      });
      await loadBootstrap();
    } catch (error) {
      setBanner({
        tone: "error",
        message:
          error.message
            ? t("portalCreateInvoice.messages.share_failed_with_reason", {
                invoiceNumber: created.header.invoice_number,
                reason: error.message,
              })
            : t("portalCreateInvoice.messages.share_failed", {
                invoiceNumber: created.header.invoice_number,
              }),
      });
      await loadBootstrap();
    } finally {
      setSaving(false);
    }
  };

  const handleSaveAndPrint = async () => {
    const created = await saveCurrentInvoice();
    if (!created) return;

    try {
      const detail = created.detail || (await fetchPortalInvoiceDetail(created.header.invoice_number));
      setPrintablePayload(
        buildPrintableInvoiceData({
          detail,
          company,
        })
      );
      setResetAfterPrint(true);
      setPendingPrint(true);
      setBanner({
        tone: "success",
        message: t("portalCreateInvoice.messages.saved_and_ready_to_print", {
          invoiceNumber: created.header.invoice_number,
        }),
      });
    } catch (error) {
      setBanner({
        tone: "error",
        message:
          error.message
            ? t("portalCreateInvoice.messages.print_prep_failed_with_reason", {
                invoiceNumber: created.header.invoice_number,
                reason: error.message,
              })
            : t("portalCreateInvoice.messages.print_prep_failed", {
                invoiceNumber: created.header.invoice_number,
              }),
      });
      await loadBootstrap();
    }
  };

  return (
    <>
      <div className="grid gap-5 pb-8 md:pb-72">
        <section className="rounded-[28px] border border-[#dbe7ec] bg-[#fbfdfe] p-5 shadow-[0_18px_36px_rgba(39,89,104,0.08)]">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <p className="portal-eyebrow">{t("portalShell.modules.create_invoice")}</p>
              <h1 className="text-3xl font-semibold text-slate-800">
                {t("portalCreateInvoice.title")}
              </h1>
            </div>

            <div className="rounded-[22px] border border-[#dbe7ec] bg-white px-4 py-3 shadow-[0_12px_24px_rgba(39,89,104,0.07)]">
              <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-slate-500">
                {t("portalCreateInvoice.invoice_number")}
              </p>
              <div className="mt-2 text-xl font-semibold text-slate-800">
                {invoiceNumber || t("portalCommon.empty.value")}
              </div>
            </div>
          </div>
        </section>

        {bootLoading ? (
          <EmptyState title={t("portalCommon.states.loading")} copy="" />
        ) : bootError ? (
          <Banner tone="error">{bootError}</Banner>
        ) : (
          <>
            {banner ? <Banner tone={banner.tone}>{banner.message}</Banner> : null}

            <CreateInvoiceHeaderCard
              invoiceNumber={invoiceNumber}
              clientName={clientName}
              invoiceDate={invoiceDate}
              paymentType={paymentType}
              notes={notes}
              canEdit={!saving}
              onOpenClientPicker={() => setClientModalOpen(true)}
              onInvoiceDateChange={setInvoiceDate}
              onPaymentTypeChange={setPaymentType}
              onNotesChange={setNotes}
              onOpenAdvancedData={() => setAdvancedModalOpen(true)}
            />

            <section className="rounded-[28px] border border-[#dbe7ec] bg-white p-5 shadow-[0_18px_36px_rgba(39,89,104,0.08)]">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <p className="portal-eyebrow">{t("portalCreateInvoice.items.eyebrow")}</p>
                  <h2 className="text-2xl font-semibold text-slate-800">
                    {t("portalCreateInvoice.items.title")}
                  </h2>
                </div>

                <ActionButton
                  type="button"
                  tone="primary"
                  className="w-full sm:w-auto"
                  onClick={() => {
                    setReplaceTargetIndex(null);
                    setItemBrowserOpen(true);
                  }}
                  disabled={saving}
                >
                  {t("portalCreateInvoice.actions.add_item")}
                </ActionButton>
              </div>

              <div className="mt-5 rounded-[24px] border border-[#dbe7ec] bg-[#fbfdfe] px-4">
                {invoiceItems.length === 0 ? (
                  <div className="py-8 text-center text-sm text-slate-500">
                    {t("portalCreateInvoice.items.empty")}
                  </div>
                ) : (
                  invoiceItems.map((item, index) => (
                    <InvoiceItemRow
                      key={`${item.id}-${item.item_id || "empty"}`}
                      item={item}
                      onEdit={() => {
                        setEditingIndex(index);
                        setLineEditOpen(true);
                      }}
                      onRemove={() =>
                        setInvoiceItems((current) =>
                          resequenceInvoiceItems(current.filter((_, currentIndex) => currentIndex !== index))
                        )
                      }
                    />
                  ))
                )}
              </div>
            </section>

            <TotalsBar
              totalBeforeTax={totals.totalBeforeTax}
              totalTax={totals.totalTax}
              grandTotal={totals.grandTotal}
              onSave={handleSave}
              onSaveAndShare={() => setShareConfirmOpen(true)}
              onSaveAndPrint={handleSaveAndPrint}
              saving={saving || bootLoading}
              canSave={!bootLoading && !saving}
              canShare={canShare}
            />
          </>
        )}
      </div>

      <ClientPickerModal
        open={clientModalOpen}
        onClose={() => setClientModalOpen(false)}
        onSelect={handleClientSelect}
      />

      <AdvancedDataModal
        open={advancedModalOpen}
        onClose={() => setAdvancedModalOpen(false)}
        canEdit={!saving}
        draft={{
          currency,
          type2,
          clientDetailType,
          clientDetailValue,
          clientPhone,
          reference,
          createDueBalance,
        }}
        onChange={(field, value) => {
          if (field === "currency") setCurrency(value);
          if (field === "type2") setType2(value);
          if (field === "clientDetailType") setClientDetailType(value);
          if (field === "clientDetailValue") setClientDetailValue(value);
          if (field === "clientPhone") setClientPhone(value);
          if (field === "reference") setReference(value);
          if (field === "createDueBalance") setCreateDueBalance(Boolean(value));
        }}
      />

      <ItemBrowserModal
        open={itemBrowserOpen}
        onClose={() => {
          setItemBrowserOpen(false);
          if (replaceTargetIndex != null) {
            setReplaceTargetIndex(null);
          }
        }}
        onSelect={handleItemSelected}
      />

      <QuantityModal
        open={quantityModalOpen}
        item={pendingCatalogItem}
        onClose={() => {
          setQuantityModalOpen(false);
          setPendingCatalogItem(null);
          setReplaceTargetIndex(null);
        }}
        onConfirm={handleQuantityConfirm}
      />

      <InvoiceLineEditModal
        open={lineEditOpen}
        item={editingIndex != null ? invoiceItems[editingIndex] : null}
        storages={storages}
        exemptAllowed={exemptAllowed}
        onClose={() => {
          setLineEditOpen(false);
          setEditingIndex(null);
        }}
        onSave={handleSaveLine}
        onReplaceItem={openReplaceItemFlow}
      />

      <ShareConfirmModal
        open={shareConfirmOpen}
        onClose={() => setShareConfirmOpen(false)}
        onConfirm={async () => {
          setShareConfirmOpen(false);
          await handleSaveAndShare();
        }}
      />

      <div className="hidden">
        {printablePayload ? (
          <PrintableInvoice
            ref={printRef}
            company={printablePayload.company}
            invoiceNumber={printablePayload.invoiceNumber}
            clientName={printablePayload.clientName}
            invoiceDate={printablePayload.invoiceDate}
            paymentType={printablePayload.paymentType}
            notes={printablePayload.notes}
            reference={printablePayload.reference}
            invoiceItems={printablePayload.invoiceItems}
            totalBeforeTax={printablePayload.totalBeforeTax}
            totalTax={printablePayload.totalTax}
            grandTotal={printablePayload.grandTotal}
            qr={printablePayload.qr}
          />
        ) : null}
      </div>
    </>
  );
}
