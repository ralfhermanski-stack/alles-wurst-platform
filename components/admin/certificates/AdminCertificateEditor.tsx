"use client";

import QRCode from "qrcode";
import { useCallback, useEffect, useMemo, useState } from "react";

import CertificateDocument from "@/components/certificates/CertificateDocument";
import {
  CERTIFICATE_PLACEHOLDER_LABELS,
  USER_CERTIFICATE_STATUS_LABELS,
} from "@/lib/certificates/certificate-labels";
import { CERTIFICATE_PREVIEW_TEST_DATA } from "@/lib/certificates/certificate-config";
import {
  certificateKindLabel,
  DEFAULT_LEGAL_TEXT,
  previewNumberForKind,
  proofTitleText,
} from "@/lib/certificates/certificate-defaults";
import {
  CERTIFICATE_PLACEHOLDER_KEYS,
  type CertificateFreeTextField,
  type CertificateKind,
  type CertificatePlaceholderField,
  type CertificateQrConfig,
  type CertificateTemplateEntry,
} from "@/lib/certificates/certificate-types";
import {
  inputClassName,
  labelClassName,
  primaryButtonClassName,
  secondaryButtonClassName,
  selectClassName,
} from "@/components/tools/recipe-generator/recipe-form-classes";

type AdminCertificateListItem = {
  id: string;
  certificateNumber: string | null;
  status: string;
  courseTitle: string;
  studentName: string;
  issuedAt: string | null;
};

const KINDS: CertificateKind[] = ["certificate", "participation"];

const ADMIN_FETCH_INIT: RequestInit = { credentials: "include" };

function detectOrientation(
  file: File,
): Promise<"portrait" | "landscape" | "square"> {
  return new Promise((resolve) => {
    const url = URL.createObjectURL(file);
    const image = new Image();

    image.onload = () => {
      URL.revokeObjectURL(url);
      if (image.width === image.height) {
        resolve("square");
      } else {
        resolve(image.width > image.height ? "landscape" : "portrait");
      }
    };
    image.onerror = () => {
      URL.revokeObjectURL(url);
      resolve("square");
    };
    image.src = url;
  });
}

function createTextField(): CertificateFreeTextField {
  return {
    id:
      typeof crypto !== "undefined" && "randomUUID" in crypto
        ? crypto.randomUUID()
        : `text-${Date.now()}`,
    text: "Neuer Hinweistext",
    x: 15,
    y: 88,
    width: 70,
    height: 6,
    fontSize: 9,
    fontFamily: "Arial, sans-serif",
    color: "#555555",
    textAlign: "center",
    rotation: 0,
    bold: false,
    italic: false,
    visible: true,
  };
}

export default function AdminCertificateEditor() {
  const [kind, setKind] = useState<CertificateKind>("certificate");
  const [template, setTemplate] = useState<CertificateTemplateEntry | null>(null);
  const [certificates, setCertificates] = useState<AdminCertificateListItem[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [warning, setWarning] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [selectedKey, setSelectedKey] = useState<string>("PROOF_TYPE_TEXT");
  const [selectedTextId, setSelectedTextId] = useState<string | null>(null);
  const [previewQr, setPreviewQr] = useState("");

  useEffect(() => {
    void QRCode.toDataURL(CERTIFICATE_PREVIEW_TEST_DATA.VERIFICATION_URL, {
      margin: 1,
      width: 200,
    }).then(setPreviewQr);
  }, []);

  const loadTemplate = useCallback(async (targetKind: CertificateKind) => {
    const response = await fetch(
      `/api/admin/certificates/template?kind=${targetKind}`,
      { ...ADMIN_FETCH_INIT },
    );
    const json = (await response.json()) as {
      success: boolean;
      data?: CertificateTemplateEntry;
      error?: { message: string };
    };

    if (!json.success || !json.data) {
      setError(json.error?.message ?? "Vorlage konnte nicht geladen werden.");
      return;
    }

    setTemplate(json.data);
    setError(null);
  }, []);

  const loadCertificates = useCallback(async () => {
    const response = await fetch("/api/admin/certificates", {
      ...ADMIN_FETCH_INIT,
    });
    const json = (await response.json()) as {
      success: boolean;
      data?: AdminCertificateListItem[];
    };

    setCertificates(json.data ?? []);
  }, []);

  useEffect(() => {
    let cancelled = false;

    void (async () => {
      await loadTemplate(kind);
      if (cancelled) {
        return;
      }
      setWarning(null);
      setSelectedTextId(null);
    })();

    return () => {
      cancelled = true;
    };
  }, [kind, loadTemplate]);

  useEffect(() => {
    let cancelled = false;

    void (async () => {
      await loadCertificates();
      if (cancelled) {
        return;
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [loadCertificates]);

  const previewData = useMemo(() => {
    if (!template) {
      return null;
    }

    const proofText = proofTitleText(kind);
    const number = previewNumberForKind(kind);

    return {
      certificateId: "preview",
      certificateNumber: number,
      status: "issued" as const,
      kind,
      format: template.format,
      courseTitle: CERTIFICATE_PREVIEW_TEST_DATA.COURSE_TITLE,
      studentName: CERTIFICATE_PREVIEW_TEST_DATA.STUDENT_NAME,
      issuedDate: CERTIFICATE_PREVIEW_TEST_DATA.ISSUED_DATE,
      instructorName: template.instructorName,
      instructorTitle: template.instructorTitle,
      verificationUrl: CERTIFICATE_PREVIEW_TEST_DATA.VERIFICATION_URL,
      verificationQrDataUrl: "",
      backgroundUrl: template.hasBackground
        ? `/api/certificates/template/background?kind=${kind}&v=${encodeURIComponent(
            template.updatedAt,
          )}`
        : null,
      placeholders: template.placeholders,
      textFields: template.textFields,
      qrConfig: template.qrConfig,
      values: {
        PROOF_TYPE_TEXT: proofText,
        COURSE_TITLE: CERTIFICATE_PREVIEW_TEST_DATA.COURSE_TITLE,
        STUDENT_NAME: CERTIFICATE_PREVIEW_TEST_DATA.STUDENT_NAME,
        CERTIFICATE_NUMBER: number,
        ISSUED_DATE: CERTIFICATE_PREVIEW_TEST_DATA.ISSUED_DATE,
        INSTRUCTOR_NAME: template.instructorName,
        INSTRUCTOR_TITLE: template.instructorTitle,
        VERIFICATION_URL: CERTIFICATE_PREVIEW_TEST_DATA.VERIFICATION_URL,
        VERIFICATION_QR: CERTIFICATE_PREVIEW_TEST_DATA.VERIFICATION_URL,
      },
    };
  }, [template, kind]);

  const selectedField = template?.placeholders.find(
    (field) => field.key === selectedKey,
  );
  const selectedTextField = template?.textFields.find(
    (field) => field.id === selectedTextId,
  );

  function updateSelectedField(patch: Partial<CertificatePlaceholderField>) {
    if (!template || !selectedField) {
      return;
    }

    setTemplate({
      ...template,
      placeholders: template.placeholders.map((field) =>
        field.key === selectedKey ? { ...field, ...patch } : field,
      ),
    });
  }

  function updateQrConfig(patch: Partial<CertificateQrConfig>) {
    if (!template) {
      return;
    }

    setTemplate({ ...template, qrConfig: { ...template.qrConfig, ...patch } });
  }

  function updateTextField(
    id: string,
    patch: Partial<CertificateFreeTextField>,
  ) {
    if (!template) {
      return;
    }

    setTemplate({
      ...template,
      textFields: template.textFields.map((field) =>
        field.id === id ? { ...field, ...patch } : field,
      ),
    });
  }

  function addTextField() {
    if (!template) {
      return;
    }

    const field = createTextField();
    setTemplate({ ...template, textFields: [...template.textFields, field] });
    setSelectedTextId(field.id);
  }

  function addLegalTextField() {
    if (!template) {
      return;
    }

    const field = { ...createTextField(), text: DEFAULT_LEGAL_TEXT, italic: true };
    setTemplate({ ...template, textFields: [...template.textFields, field] });
    setSelectedTextId(field.id);
  }

  function removeTextField(id: string) {
    if (!template) {
      return;
    }

    setTemplate({
      ...template,
      textFields: template.textFields.filter((field) => field.id !== id),
    });
    if (selectedTextId === id) {
      setSelectedTextId(null);
    }
  }

  async function handleSaveTemplate() {
    if (!template) {
      return;
    }

    setSaving(true);
    setError(null);

    const response = await fetch(`/api/admin/certificates/template?kind=${kind}`, {
      method: "PUT",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        format: template.format,
        instructorName: template.instructorName,
        instructorTitle: template.instructorTitle,
        placeholders: template.placeholders,
        textFields: template.textFields,
        qrConfig: template.qrConfig,
      }),
    });

    const data = (await response.json()) as {
      success: boolean;
      data?: CertificateTemplateEntry;
      error?: { message: string };
    };

    setSaving(false);

    if (!data.success || !data.data) {
      setError(data.error?.message ?? "Speichern fehlgeschlagen.");
      return;
    }

    setTemplate(data.data);
  }

  async function handleBackgroundUpload(file: File) {
    setWarning(null);

    const orientation = await detectOrientation(file);
    const expected = template?.format === "portrait" ? "portrait" : "landscape";

    if (orientation !== "square" && orientation !== expected) {
      setWarning(
        `Achtung: Das Bild ist im ${
          orientation === "portrait" ? "Hochformat" : "Querformat"
        }, die Vorlage ist aber auf ${
          expected === "portrait" ? "Hochformat" : "Querformat"
        } eingestellt. Das Bild wird trotzdem verwendet, kann aber verzerrt wirken.`,
      );
    }

    const formData = new FormData();
    formData.set("file", file);

    const response = await fetch(
      `/api/admin/certificates/template/background?kind=${kind}`,
      { method: "POST", credentials: "include", body: formData },
    );

    const data = (await response.json()) as {
      success: boolean;
      data?: CertificateTemplateEntry;
      error?: { message: string };
    };

    if (!data.success || !data.data) {
      setError(data.error?.message ?? "Hintergrund konnte nicht hochgeladen werden.");
      return;
    }

    setTemplate(data.data);
  }

  async function handleRevoke(certificateId: string) {
    await fetch(`/api/admin/certificates/${certificateId}/revoke`, {
      method: "POST",
      ...ADMIN_FETCH_INIT,
    });
    await loadCertificates();
  }

  async function handleReissue(certificateId: string) {
    await fetch(`/api/admin/certificates/${certificateId}/reissue`, {
      method: "POST",
      ...ADMIN_FETCH_INIT,
    });
    await loadCertificates();
  }

  if (!template || !previewData) {
    return <p className="p-8 text-sm text-aw-muted">Vorlage wird geladen …</p>;
  }

  return (
    <div className="mx-auto max-w-7xl space-y-8 px-4 py-8 sm:px-6">
      <div>
        <h1 className="font-display text-2xl font-bold text-aw-cream">
          Urkunden &amp; Zertifikate
        </h1>
        <p className="mt-1 text-sm text-aw-muted">
          Zwei Vorlagen: Zertifikat (Querformat) und Teilnahmeurkunde (Hochformat).
          Hintergrund hochladen, Felder frei positionieren und Vorschau mit Testdaten
          prüfen.
        </p>
      </div>

      <div className="flex flex-wrap gap-2">
        {KINDS.map((item) => (
          <button
            key={item}
            type="button"
            onClick={() => setKind(item)}
            className={`rounded-lg px-4 py-2 text-sm font-semibold transition ${
              kind === item
                ? "bg-aw-gold text-aw-charcoal"
                : "border border-aw-border text-aw-cream hover:bg-aw-surface/60"
            }`}
          >
            {certificateKindLabel(item)}
          </button>
        ))}
      </div>

      {error && (
        <p className="text-sm text-aw-warning" role="alert">
          {error}
        </p>
      )}
      {warning && (
        <p className="rounded-lg border border-amber-500/40 bg-amber-500/10 px-4 py-3 text-sm text-amber-300">
          {warning}
        </p>
      )}

      <section className="grid gap-8 lg:grid-cols-[1fr_380px]">
        <div className="rounded-xl border border-aw-border bg-aw-bg/40 p-4">
          <h2 className="mb-4 font-semibold text-aw-cream">Live-Vorschau</h2>
          <CertificateDocument data={previewData} qrDataUrl={previewQr} />
        </div>

        <div className="space-y-6">
          <div className="rounded-xl border border-aw-border bg-aw-surface/40 p-4">
            <h3 className="font-semibold text-aw-cream">Format</h3>
            <select
              className={`${selectClassName} mt-3`}
              value={template.format}
              onChange={(e) =>
                setTemplate({
                  ...template,
                  format: e.target.value === "portrait" ? "portrait" : "landscape",
                })
              }
            >
              <option value="landscape">DIN A4 Querformat</option>
              <option value="portrait">DIN A4 Hochformat</option>
            </select>
          </div>

          <div className="rounded-xl border border-aw-border bg-aw-surface/40 p-4">
            <h3 className="font-semibold text-aw-cream">Hintergrund</h3>
            <input
              type="file"
              accept="image/png,image/jpeg,image/webp"
              className="mt-3 text-sm text-aw-muted"
              onChange={(event) => {
                const file = event.target.files?.[0];
                if (file) {
                  void handleBackgroundUpload(file);
                }
              }}
            />
            {template.backgroundFileName && (
              <p className="mt-2 text-xs text-aw-muted">
                Aktuell: {template.backgroundFileName}
              </p>
            )}
            <p className="mt-1 text-xs text-aw-muted">JPG, PNG oder WebP.</p>
          </div>

          <div className="rounded-xl border border-aw-border bg-aw-surface/40 p-4">
            <h3 className="font-semibold text-aw-cream">Dozent / Signatur</h3>
            <label className={`${labelClassName} mt-3 block`}>Name</label>
            <input
              className={`${inputClassName} mt-1`}
              value={template.instructorName}
              onChange={(e) =>
                setTemplate({ ...template, instructorName: e.target.value })
              }
            />
            <label className={`${labelClassName} mt-3 block`}>Titel</label>
            <input
              className={`${inputClassName} mt-1`}
              value={template.instructorTitle}
              onChange={(e) =>
                setTemplate({ ...template, instructorTitle: e.target.value })
              }
            />
          </div>

          <div className="rounded-xl border border-aw-border bg-aw-surface/40 p-4">
            <h3 className="font-semibold text-aw-cream">Automatische Felder</h3>
            <select
              className={`${inputClassName} mt-3`}
              value={selectedKey}
              onChange={(e) => setSelectedKey(e.target.value)}
            >
              {CERTIFICATE_PLACEHOLDER_KEYS.map((key) => (
                <option key={key} value={key}>
                  {CERTIFICATE_PLACEHOLDER_LABELS[key]}
                </option>
              ))}
            </select>

            {selectedField && (
              <label className="mt-3 flex items-center gap-2 text-sm text-aw-cream">
                <input
                  type="checkbox"
                  className="h-4 w-4 accent-aw-gold"
                  checked={selectedField.visible}
                  onChange={(e) =>
                    updateSelectedField({ visible: e.target.checked })
                  }
                />
                Sichtbar
              </label>
            )}

            {selectedField && selectedKey === "VERIFICATION_QR" && (
              <div className="mt-4 grid grid-cols-2 gap-2 text-sm">
                {(
                  [
                    ["x", "X %"],
                    ["y", "Y %"],
                    ["size", "Größe %"],
                  ] as const
                ).map(([key, label]) => (
                  <div key={key}>
                    <label className="text-xs text-aw-muted">{label}</label>
                    <input
                      className={inputClassName}
                      type="number"
                      value={template.qrConfig[key]}
                      onChange={(e) =>
                        updateQrConfig({ [key]: Number(e.target.value) })
                      }
                    />
                  </div>
                ))}
              </div>
            )}

            {selectedField && selectedKey !== "VERIFICATION_QR" && (
              <div className="mt-4 grid grid-cols-2 gap-2 text-sm">
                {(
                  [
                    ["x", "X %"],
                    ["y", "Y %"],
                    ["width", "Breite %"],
                    ["height", "Höhe %"],
                    ["fontSize", "Schriftgröße"],
                    ["fontWeight", "Stärke"],
                  ] as const
                ).map(([key, label]) => (
                  <div key={key}>
                    <label className="text-xs text-aw-muted">{label}</label>
                    <input
                      className={inputClassName}
                      type="number"
                      value={selectedField[key]}
                      onChange={(e) =>
                        updateSelectedField({ [key]: Number(e.target.value) })
                      }
                    />
                  </div>
                ))}
                <div className="col-span-2">
                  <label className="text-xs text-aw-muted">Farbe</label>
                  <input
                    className={inputClassName}
                    value={selectedField.color}
                    onChange={(e) => updateSelectedField({ color: e.target.value })}
                  />
                </div>
                <div className="col-span-2">
                  <label className="text-xs text-aw-muted">Schriftfamilie</label>
                  <input
                    className={inputClassName}
                    value={selectedField.fontFamily}
                    onChange={(e) =>
                      updateSelectedField({ fontFamily: e.target.value })
                    }
                  />
                </div>
                <div className="col-span-2">
                  <label className="text-xs text-aw-muted">Ausrichtung</label>
                  <select
                    className={inputClassName}
                    value={selectedField.textAlign}
                    onChange={(e) =>
                      updateSelectedField({
                        textAlign: e.target
                          .value as CertificatePlaceholderField["textAlign"],
                      })
                    }
                  >
                    <option value="left">Links</option>
                    <option value="center">Zentriert</option>
                    <option value="right">Rechts</option>
                  </select>
                </div>
              </div>
            )}
          </div>

          <div className="rounded-xl border border-aw-border bg-aw-surface/40 p-4">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-aw-cream">Freie Textfelder</h3>
              <span className="text-xs text-aw-muted">
                {template.textFields.length} Feld(er)
              </span>
            </div>
            <div className="mt-3 flex flex-wrap gap-2">
              <button
                type="button"
                className={secondaryButtonClassName}
                onClick={addTextField}
              >
                Textfeld hinzufügen
              </button>
              <button
                type="button"
                className={secondaryButtonClassName}
                onClick={addLegalTextField}
              >
                Rechtshinweis einfügen
              </button>
            </div>

            {template.textFields.length > 0 && (
              <div className="mt-3 space-y-1">
                {template.textFields.map((field) => (
                  <button
                    key={field.id}
                    type="button"
                    onClick={() => setSelectedTextId(field.id)}
                    className={`block w-full truncate rounded px-2 py-1 text-left text-xs ${
                      selectedTextId === field.id
                        ? "bg-aw-gold/20 text-aw-cream"
                        : "text-aw-muted hover:bg-aw-surface/60"
                    }`}
                  >
                    {field.visible ? "" : "(versteckt) "}
                    {field.text || "(leer)"}
                  </button>
                ))}
              </div>
            )}

            {selectedTextField && (
              <div className="mt-4 space-y-3 border-t border-aw-border pt-4">
                <div>
                  <label className="text-xs text-aw-muted">Textinhalt</label>
                  <textarea
                    className={`${inputClassName} min-h-20`}
                    value={selectedTextField.text}
                    onChange={(e) =>
                      updateTextField(selectedTextField.id, { text: e.target.value })
                    }
                  />
                </div>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  {(
                    [
                      ["x", "X %"],
                      ["y", "Y %"],
                      ["width", "Breite %"],
                      ["height", "Höhe %"],
                      ["fontSize", "Schriftgröße"],
                      ["rotation", "Drehung °"],
                    ] as const
                  ).map(([key, label]) => (
                    <div key={key}>
                      <label className="text-xs text-aw-muted">{label}</label>
                      <input
                        className={inputClassName}
                        type="number"
                        value={selectedTextField[key]}
                        onChange={(e) =>
                          updateTextField(selectedTextField.id, {
                            [key]: Number(e.target.value),
                          })
                        }
                      />
                    </div>
                  ))}
                </div>
                <div>
                  <label className="text-xs text-aw-muted">Farbe</label>
                  <input
                    className={inputClassName}
                    value={selectedTextField.color}
                    onChange={(e) =>
                      updateTextField(selectedTextField.id, { color: e.target.value })
                    }
                  />
                </div>
                <div>
                  <label className="text-xs text-aw-muted">Schriftfamilie</label>
                  <input
                    className={inputClassName}
                    value={selectedTextField.fontFamily}
                    onChange={(e) =>
                      updateTextField(selectedTextField.id, {
                        fontFamily: e.target.value,
                      })
                    }
                  />
                </div>
                <div>
                  <label className="text-xs text-aw-muted">Ausrichtung</label>
                  <select
                    className={inputClassName}
                    value={selectedTextField.textAlign}
                    onChange={(e) =>
                      updateTextField(selectedTextField.id, {
                        textAlign: e.target
                          .value as CertificateFreeTextField["textAlign"],
                      })
                    }
                  >
                    <option value="left">Links</option>
                    <option value="center">Zentriert</option>
                    <option value="right">Rechts</option>
                  </select>
                </div>
                <div className="flex flex-wrap gap-4">
                  <label className="flex items-center gap-2 text-sm text-aw-cream">
                    <input
                      type="checkbox"
                      className="h-4 w-4 accent-aw-gold"
                      checked={selectedTextField.bold}
                      onChange={(e) =>
                        updateTextField(selectedTextField.id, {
                          bold: e.target.checked,
                        })
                      }
                    />
                    Fett
                  </label>
                  <label className="flex items-center gap-2 text-sm text-aw-cream">
                    <input
                      type="checkbox"
                      className="h-4 w-4 accent-aw-gold"
                      checked={selectedTextField.italic}
                      onChange={(e) =>
                        updateTextField(selectedTextField.id, {
                          italic: e.target.checked,
                        })
                      }
                    />
                    Kursiv
                  </label>
                  <label className="flex items-center gap-2 text-sm text-aw-cream">
                    <input
                      type="checkbox"
                      className="h-4 w-4 accent-aw-gold"
                      checked={selectedTextField.visible}
                      onChange={(e) =>
                        updateTextField(selectedTextField.id, {
                          visible: e.target.checked,
                        })
                      }
                    />
                    Sichtbar
                  </label>
                </div>
                <button
                  type="button"
                  className="text-sm text-aw-warning hover:underline"
                  onClick={() => removeTextField(selectedTextField.id)}
                >
                  Textfeld löschen
                </button>
              </div>
            )}
          </div>

          <button
            type="button"
            className={primaryButtonClassName}
            disabled={saving}
            onClick={() => void handleSaveTemplate()}
          >
            {saving ? "Wird gespeichert …" : "Vorlage speichern"}
          </button>
        </div>
      </section>

      <section className="rounded-xl border border-aw-border bg-aw-surface/40 p-5">
        <h2 className="font-semibold text-aw-cream">Ausgestellte Nachweise</h2>
        <div className="mt-4 overflow-x-auto">
          <table className="w-full min-w-[720px] text-left text-sm">
            <thead className="text-xs uppercase text-aw-muted">
              <tr>
                <th className="px-2 py-2">Nummer</th>
                <th className="px-2 py-2">Teilnehmer</th>
                <th className="px-2 py-2">Kurs</th>
                <th className="px-2 py-2">Status</th>
                <th className="px-2 py-2">Aktionen</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-aw-border text-aw-cream">
              {certificates.map((item) => (
                <tr key={item.id}>
                  <td className="px-2 py-2 font-mono text-xs">
                    {item.certificateNumber ?? "—"}
                  </td>
                  <td className="px-2 py-2">{item.studentName}</td>
                  <td className="px-2 py-2">{item.courseTitle}</td>
                  <td className="px-2 py-2 text-aw-muted">
                    {USER_CERTIFICATE_STATUS_LABELS[
                      item.status as keyof typeof USER_CERTIFICATE_STATUS_LABELS
                    ] ?? item.status}
                  </td>
                  <td className="px-2 py-2">
                    <div className="flex flex-wrap gap-2">
                      {item.status === "issued" && (
                        <a
                          href={`/mein-bereich/zertifikate/${item.id}`}
                          className="text-aw-gold hover:text-aw-cream"
                          target="_blank"
                          rel="noreferrer"
                        >
                          Anzeigen
                        </a>
                      )}
                      {item.status !== "revoked" && (
                        <button
                          type="button"
                          className={secondaryButtonClassName}
                          onClick={() => void handleRevoke(item.id)}
                        >
                          Widerrufen
                        </button>
                      )}
                      <button
                        type="button"
                        className={secondaryButtonClassName}
                        onClick={() => void handleReissue(item.id)}
                      >
                        Neu ausstellen
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
