import type { BankTransferDisplay } from "@/lib/payments/bank-transfer-config";

type BankTransferInstructionsProps = {
  details: BankTransferDisplay;
};

export default function BankTransferInstructions({
  details,
}: BankTransferInstructionsProps) {
  return (
    <div className="rounded-2xl border border-aw-gold/30 bg-aw-gold/5 p-6">
      <h2 className="font-display text-lg font-bold text-aw-cream">
        Überweisungsdaten
      </h2>
      <p className="mt-2 text-sm text-aw-muted">
        Bitte überweise den Betrag mit dem angegebenen Verwendungszweck. Die
        Buchhaltung ordnet deine Zahlung zu und schaltet den Zugang frei.
      </p>
      <dl className="mt-6 space-y-4 text-sm">
        <div>
          <dt className="font-semibold text-aw-cream">Empfänger</dt>
          <dd className="mt-1 text-aw-muted">{details.recipient}</dd>
        </div>
        <div>
          <dt className="font-semibold text-aw-cream">IBAN</dt>
          <dd className="mt-1 font-mono text-aw-gold">{details.iban}</dd>
        </div>
        {details.bic && (
          <div>
            <dt className="font-semibold text-aw-cream">BIC</dt>
            <dd className="mt-1 font-mono text-aw-muted">{details.bic}</dd>
          </div>
        )}
        <div>
          <dt className="font-semibold text-aw-cream">Betrag</dt>
          <dd className="mt-1 text-lg font-bold text-aw-gold">{details.amount}</dd>
        </div>
        <div>
          <dt className="font-semibold text-aw-cream">Verwendungszweck</dt>
          <dd className="mt-1 font-mono text-aw-cream">{details.reference}</dd>
        </div>
      </dl>
    </div>
  );
}
