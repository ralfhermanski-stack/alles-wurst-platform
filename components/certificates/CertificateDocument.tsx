import type {
  CertificateFreeTextField,
  CertificatePlaceholderField,
  CertificatePrintData,
} from "@/lib/certificates/certificate-types";

type CertificateDocumentProps = {
  data: CertificatePrintData;
  qrDataUrl?: string;
};

function justifyForAlign(align: CertificatePlaceholderField["textAlign"]): string {
  if (align === "left") {
    return "flex-start";
  }

  if (align === "right") {
    return "flex-end";
  }

  return "center";
}

function renderTextField(field: CertificatePlaceholderField, text: string) {
  if (!field.visible || field.key === "VERIFICATION_QR") {
    return null;
  }

  return (
    <div
      key={field.key}
      className="absolute overflow-hidden"
      style={{
        left: `${field.x}%`,
        top: `${field.y}%`,
        width: `${field.width}%`,
        height: `${field.height}%`,
        fontSize: `${field.fontSize}px`,
        fontWeight: field.fontWeight,
        fontFamily: field.fontFamily,
        color: field.color,
        textAlign: field.textAlign,
        lineHeight: 1.3,
        display: "flex",
        alignItems: "center",
        justifyContent: justifyForAlign(field.textAlign),
      }}
    >
      <span className="w-full break-words">{text}</span>
    </div>
  );
}

function renderFreeTextField(field: CertificateFreeTextField) {
  if (!field.visible) {
    return null;
  }

  return (
    <div
      key={field.id}
      className="absolute overflow-hidden"
      style={{
        left: `${field.x}%`,
        top: `${field.y}%`,
        width: `${field.width}%`,
        height: `${field.height}%`,
        fontSize: `${field.fontSize}px`,
        fontWeight: field.bold ? 700 : 400,
        fontStyle: field.italic ? "italic" : "normal",
        fontFamily: field.fontFamily,
        color: field.color,
        textAlign: field.textAlign,
        lineHeight: 1.3,
        transform: `rotate(${field.rotation}deg)`,
        transformOrigin: "center center",
        display: "flex",
        alignItems: "center",
        justifyContent: justifyForAlign(field.textAlign),
        whiteSpace: "pre-wrap",
      }}
    >
      <span className="w-full break-words">{field.text}</span>
    </div>
  );
}

export default function CertificateDocument({
  data,
  qrDataUrl,
}: CertificateDocumentProps) {
  const qr = qrDataUrl ?? data.verificationQrDataUrl;
  const isPortrait = data.format === "portrait";
  const aspectRatio = isPortrait ? "210 / 297" : "297 / 210";
  const maxWidth = isPortrait ? "210mm" : "297mm";

  return (
    <div
      className="relative mx-auto w-full overflow-hidden bg-white shadow-lg print:shadow-none"
      style={{ aspectRatio, maxWidth }}
    >
      {data.backgroundUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={data.backgroundUrl}
          alt=""
          className="absolute inset-0 h-full w-full object-fill"
        />
      ) : (
        <div className="absolute inset-0 bg-gradient-to-br from-amber-50 via-white to-amber-100" />
      )}

      <div className="absolute inset-0">
        {data.placeholders.map((field) =>
          renderTextField(field, data.values[field.key] ?? ""),
        )}

        {data.textFields.map((field) => renderFreeTextField(field))}

        {data.placeholders.some(
          (field) => field.key === "VERIFICATION_QR" && field.visible,
        ) &&
          qr && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={qr}
              alt="Verifizierungs-QR-Code"
              className="absolute"
              style={{
                left: `${data.qrConfig.x}%`,
                top: `${data.qrConfig.y}%`,
                width: `${data.qrConfig.size}%`,
                height: "auto",
              }}
            />
          )}
      </div>
    </div>
  );
}
