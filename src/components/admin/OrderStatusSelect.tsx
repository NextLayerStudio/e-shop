"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import {
  DEFAULT_INVOICE_RECIPIENTS,
  formatInvoiceSendFeedback,
  InvoiceSendModal,
  postSendInvoice,
} from "./InvoiceSendModal";
import { ORDER_STATUS_OPTIONS } from "./OrderStatusBadge";

export function OrderStatusSelect({
  orderId,
  status,
  customerEmail,
}: {
  orderId: string;
  status: string;
  customerEmail: string;
}) {
  const router = useRouter();
  const [value, setValue] = useState(status);
  const [isPending, startTransition] = useTransition();
  const [invoiceModalOpen, setInvoiceModalOpen] = useState(false);
  const [sendToCustomer, setSendToCustomer] = useState(
    DEFAULT_INVOICE_RECIPIENTS.sendToCustomer
  );
  const [sendToSelf, setSendToSelf] = useState(
    DEFAULT_INVOICE_RECIPIENTS.sendToSelf
  );
  const [sendToAccountant, setSendToAccountant] = useState(
    DEFAULT_INVOICE_RECIPIENTS.sendToAccountant
  );
  const [sendingInvoice, setSendingInvoice] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  function resetRecipients() {
    setSendToCustomer(DEFAULT_INVOICE_RECIPIENTS.sendToCustomer);
    setSendToSelf(DEFAULT_INVOICE_RECIPIENTS.sendToSelf);
    setSendToAccountant(DEFAULT_INVOICE_RECIPIENTS.sendToAccountant);
  }

  async function patchStatus(next: string): Promise<boolean> {
    const res = await fetch(`/api/admin/orders/${orderId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: next }),
    });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError((data as { error?: string }).error ?? "Nepodarilo sa zmeniť stav.");
      setValue(status);
      return false;
    }
    setValue(next);
    router.refresh();
    return true;
  }

  function onChange(next: string) {
    setFeedback(null);
    setError(null);

    if (next === "PAID" && status !== "PAID") {
      setValue(next);
      resetRecipients();
      setInvoiceModalOpen(true);
      return;
    }

    setValue(next);
    startTransition(async () => {
      await patchStatus(next);
    });
  }

  async function confirmPaidWithInvoice() {
    const recipients = { sendToCustomer, sendToSelf, sendToAccountant };
    if (!sendToCustomer && !sendToSelf && !sendToAccountant) {
      setError("Vyber aspoň jedného príjemcu faktúry.");
      return;
    }

    setSendingInvoice(true);
    setError(null);
    setFeedback(null);

    const statusOk = await patchStatus("PAID");
    if (!statusOk) {
      setSendingInvoice(false);
      return;
    }

    const { res, data } = await postSendInvoice(orderId, recipients);

    setSendingInvoice(false);
    setInvoiceModalOpen(false);

    if (!res.ok) {
      setError(
        data.error ??
          "Stav bol nastavený na Zaplatená, ale faktúru sa nepodarilo odoslať."
      );
      return;
    }

    const result = formatInvoiceSendFeedback(data, recipients, customerEmail);
    setFeedback(result.feedback);
    setError(result.error);
  }

  function skipInvoiceAndClose() {
    setInvoiceModalOpen(false);
    startTransition(async () => {
      await patchStatus("PAID");
    });
  }

  function cancelInvoiceModal() {
    setInvoiceModalOpen(false);
    setValue(status);
  }

  return (
    <>
      <select
        value={value}
        disabled={isPending || sendingInvoice}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-lg border border-neutral-200 bg-white px-3 py-2 text-sm focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20"
      >
        {ORDER_STATUS_OPTIONS.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>

      {feedback && (
        <p className="mt-2 text-xs text-emerald-700">{feedback}</p>
      )}
      {error && <p className="mt-2 text-xs text-red-600">{error}</p>}

      <InvoiceSendModal
        open={invoiceModalOpen}
        customerEmail={customerEmail}
        sending={sendingInvoice || isPending}
        error={error}
        sendToCustomer={sendToCustomer}
        sendToSelf={sendToSelf}
        sendToAccountant={sendToAccountant}
        onSendToCustomerChange={setSendToCustomer}
        onSendToSelfChange={setSendToSelf}
        onSendToAccountantChange={setSendToAccountant}
        onSend={confirmPaidWithInvoice}
        onSkip={skipInvoiceAndClose}
        onClose={cancelInvoiceModal}
      />
    </>
  );
}
