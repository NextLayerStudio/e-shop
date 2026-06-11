"use client";

import { useState } from "react";
import { COMPANY_CONTACT } from "@/lib/companyContact";

export type InvoiceRecipients = {
  sendToCustomer: boolean;
  sendToSelf: boolean;
  sendToAccountant: boolean;
};

type SendResult = {
  ok?: boolean;
  allSent?: boolean;
  emailSent?: boolean;
  results?: {
    customer?: { sent: boolean; error?: string | null };
    self?: { sent: boolean; error?: string | null };
    accountant?: { sent: boolean; error?: string | null };
  };
  error?: string;
};

export function InvoiceSendModal({
  open,
  customerEmail,
  sending,
  error,
  sendToCustomer,
  sendToSelf,
  sendToAccountant,
  onSendToCustomerChange,
  onSendToSelfChange,
  onSendToAccountantChange,
  onSend,
  onSkip,
  onClose,
  skipLabel = "Preskočiť",
}: {
  open: boolean;
  customerEmail: string;
  sending: boolean;
  error: string | null;
  sendToCustomer: boolean;
  sendToSelf: boolean;
  sendToAccountant: boolean;
  onSendToCustomerChange: (v: boolean) => void;
  onSendToSelfChange: (v: boolean) => void;
  onSendToAccountantChange: (v: boolean) => void;
  onSend: () => void;
  onSkip?: () => void;
  onClose: () => void;
  skipLabel?: string;
}) {
  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-neutral-900/50 p-3 backdrop-blur-sm md:items-center"
      role="dialog"
      aria-modal="true"
      aria-label="Odoslať faktúru"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md overflow-hidden rounded-2xl bg-white shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="h-1.5 bg-gradient-to-r from-brand via-brand to-accent" />
        <div className="px-5 py-5">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-xs font-bold uppercase tracking-widest text-brand">
                Faktúra
              </p>
              <h3 className="mt-1 text-base font-semibold text-neutral-900">
                Chcete poslať faktúru?
              </h3>
              <p className="mt-2 text-sm text-neutral-600">
                Faktúra sa odošle emailom s PDF prílohou v štýle know3D.
              </p>
            </div>
            <button
              type="button"
              onClick={onClose}
              disabled={sending}
              className="-mr-1 -mt-1 rounded-full p-1 text-neutral-400 hover:text-neutral-700 disabled:opacity-50"
              aria-label="Zavrieť"
            >
              ×
            </button>
          </div>

          <div className="mt-4 space-y-3">
            <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-neutral-200 px-4 py-3 transition hover:border-brand hover:bg-brand/5">
              <input
                type="checkbox"
                checked={sendToCustomer}
                onChange={(e) => onSendToCustomerChange(e.target.checked)}
                className="mt-0.5 h-4 w-4 rounded border-neutral-300 text-brand focus:ring-brand/30"
              />
              <span className="text-sm text-neutral-800">
                <span className="font-semibold">Zákazníkovi</span>
                <br />
                <span className="text-neutral-500">{customerEmail}</span>
              </span>
            </label>

            <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-neutral-200 px-4 py-3 transition hover:border-brand hover:bg-brand/5">
              <input
                type="checkbox"
                checked={sendToSelf}
                onChange={(e) => onSendToSelfChange(e.target.checked)}
                className="mt-0.5 h-4 w-4 rounded border-neutral-300 text-brand focus:ring-brand/30"
              />
              <span className="text-sm text-neutral-800">
                <span className="font-semibold">Sebe</span>
                <br />
                <span className="text-neutral-500">{COMPANY_CONTACT.email}</span>
              </span>
            </label>

            <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-neutral-200 px-4 py-3 transition hover:border-brand hover:bg-brand/5">
              <input
                type="checkbox"
                checked={sendToAccountant}
                onChange={(e) => onSendToAccountantChange(e.target.checked)}
                className="mt-0.5 h-4 w-4 rounded border-neutral-300 text-brand focus:ring-brand/30"
              />
              <span className="text-sm text-neutral-800">
                <span className="font-semibold">Účtovníčke</span>
                <br />
                <span className="break-all text-neutral-500">
                  {COMPANY_CONTACT.accountantEmail}
                </span>
              </span>
            </label>
          </div>

          {error && <p className="mt-3 text-xs text-red-600">{error}</p>}

          <div className="mt-5 flex flex-col gap-2 sm:flex-row">
            <button
              type="button"
              onClick={onSend}
              disabled={sending}
              className="flex-1 rounded-full bg-brand px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-dark disabled:opacity-60"
            >
              {sending ? "Odosielam…" : "Poslať faktúru"}
            </button>
            {onSkip && (
              <button
                type="button"
                onClick={onSkip}
                disabled={sending}
                className="rounded-full border border-neutral-200 px-4 py-2.5 text-sm font-semibold text-neutral-700 transition hover:bg-neutral-50 disabled:opacity-60"
              >
                {skipLabel}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function hasAnyRecipient(recipients: InvoiceRecipients): boolean {
  return (
    recipients.sendToCustomer ||
    recipients.sendToSelf ||
    recipients.sendToAccountant
  );
}

export function formatInvoiceSendFeedback(
  data: SendResult,
  recipients: InvoiceRecipients,
  customerEmail: string
): { feedback: string | null; error: string | null } {
  if (!data.ok) {
    return {
      feedback: null,
      error: data.error ?? "Faktúru sa nepodarilo odoslať.",
    };
  }

  const parts: string[] = [];
  if (recipients.sendToCustomer) {
    parts.push(
      data.results?.customer?.sent
        ? `zákazníkovi (${customerEmail})`
        : `zákazníkovi (chyba: ${data.results?.customer?.error ?? "neodoslané"})`
    );
  }
  if (recipients.sendToSelf) {
    parts.push(
      data.results?.self?.sent
        ? `sebe (${COMPANY_CONTACT.email})`
        : `sebe (chyba: ${data.results?.self?.error ?? "neodoslané"})`
    );
  }
  if (recipients.sendToAccountant) {
    parts.push(
      data.results?.accountant?.sent
        ? `účtovníčke (${COMPANY_CONTACT.accountantEmail})`
        : `účtovníčke (chyba: ${data.results?.accountant?.error ?? "neodoslané"})`
    );
  }

  if (data.allSent) {
    return { feedback: `Faktúra odoslaná: ${parts.join(", ")}.`, error: null };
  }
  if (data.emailSent) {
    return {
      feedback: `Čiastočne odoslané: ${parts.join(", ")}.`,
      error: null,
    };
  }
  return {
    feedback: null,
    error:
      data.results?.customer?.error ??
      data.results?.self?.error ??
      data.results?.accountant?.error ??
      "Email sa neodoslal (skontroluj RESEND_API_KEY a EMAIL_FROM).",
  };
}

export async function postSendInvoice(
  orderId: string,
  recipients: InvoiceRecipients
): Promise<{ res: Response; data: SendResult }> {
  const res = await fetch(`/api/admin/orders/${orderId}/send-invoice`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(recipients),
  });
  const data = (await res.json().catch(() => ({}))) as SendResult;
  return { res, data };
}

export const DEFAULT_INVOICE_RECIPIENTS: InvoiceRecipients = {
  sendToCustomer: true,
  sendToSelf: true,
  sendToAccountant: true,
};

export function InvoiceResendButton({
  orderId,
  customerEmail,
}: {
  orderId: string;
  customerEmail: string;
}) {
  const [open, setOpen] = useState(false);
  const [sendToCustomer, setSendToCustomer] = useState(true);
  const [sendToSelf, setSendToSelf] = useState(true);
  const [sendToAccountant, setSendToAccountant] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);

  async function handleSend() {
    const recipients = { sendToCustomer, sendToSelf, sendToAccountant };
    if (!hasAnyRecipient(recipients)) {
      setError("Vyber aspoň jedného príjemcu faktúry.");
      return;
    }

    setSending(true);
    setError(null);
    setFeedback(null);

    const { res, data } = await postSendInvoice(orderId, recipients);

    setSending(false);

    if (!res.ok) {
      setError(data.error ?? "Faktúru sa nepodarilo odoslať.");
      return;
    }

    setOpen(false);
    const result = formatInvoiceSendFeedback(data, recipients, customerEmail);
    setFeedback(result.feedback);
    setError(result.error);
  }

  return (
    <>
      <button
        type="button"
        onClick={() => {
          setOpen(true);
          setSendToCustomer(true);
          setSendToSelf(true);
          setSendToAccountant(true);
          setError(null);
        }}
        className="mt-3 w-full rounded-lg border border-brand/30 bg-brand/5 px-3 py-2 text-sm font-semibold text-brand-dark transition hover:bg-brand/10"
      >
        Odoslať faktúru
      </button>

      {feedback && (
        <p className="mt-2 text-xs text-emerald-700">{feedback}</p>
      )}
      {error && !open && (
        <p className="mt-2 text-xs text-red-600">{error}</p>
      )}

      <InvoiceSendModal
        open={open}
        customerEmail={customerEmail}
        sending={sending}
        error={error}
        sendToCustomer={sendToCustomer}
        sendToSelf={sendToSelf}
        sendToAccountant={sendToAccountant}
        onSendToCustomerChange={setSendToCustomer}
        onSendToSelfChange={setSendToSelf}
        onSendToAccountantChange={setSendToAccountant}
        onSend={handleSend}
        onClose={() => setOpen(false)}
      />
    </>
  );
}
