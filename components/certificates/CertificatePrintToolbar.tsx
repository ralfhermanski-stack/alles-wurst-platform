"use client";

import { ShareButton } from "@/components/sharing/ShareModal";
import { secondaryButtonClassName } from "@/components/tools/recipe-generator/recipe-form-classes";

type CertificatePrintToolbarProps = {
  certificateId: string;
  certificateNumber: string;
  courseTitle: string;
  kind: "certificate" | "participation";
};

export default function CertificatePrintToolbar({
  certificateId,
  certificateNumber,
  courseTitle,
  kind,
}: CertificatePrintToolbarProps) {
  return (
    <div className="print:hidden sticky top-0 z-10 border-b border-aw-border bg-aw-surface/95 px-4 py-3 backdrop-blur-sm">
      <div className="mx-auto flex max-w-[297mm] flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-aw-muted">
          {kind === "participation" ? "Urkunde" : "Zertifikat"} {certificateNumber} — im Druckdialog
          „Als PDF speichern“ wählen.
        </p>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            className={secondaryButtonClassName}
            onClick={() => window.print()}
          >
            Als PDF speichern / Drucken
          </button>
          <ShareButton
            label={kind === "participation" ? "Urkunde teilen" : "Zertifikat teilen"}
            mode={kind === "participation" ? "diploma" : "certificate"}
            certificateId={certificateId}
            title={courseTitle}
          />
          <button
            type="button"
            className={secondaryButtonClassName}
            onClick={() => window.close()}
          >
            Schließen
          </button>
        </div>
      </div>
    </div>
  );
}
