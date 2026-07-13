"use client";

import { useCallback, useEffect, useState } from "react";

import {
  fetchMyBetaTasksApi,
  updateMyBetaTaskApi,
} from "@/lib/beta-test/beta-test-client";
import type { BetaTesterTaskItem } from "@/lib/beta-test/beta-test-service";
import {
  primaryButtonClassName,
  secondaryButtonClassName,
} from "@/components/tools/recipe-generator/recipe-form-classes";

function formatDate(iso: string | null): string {
  if (!iso) {
    return "—";
  }

  return new Date(iso).toLocaleDateString("de-DE");
}

export default function BetaTesterTasksPanel() {
  const [tasks, setTasks] = useState<BetaTesterTaskItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [savingTaskId, setSavingTaskId] = useState<string | null>(null);

  const loadTasks = useCallback(async () => {
    setLoading(true);
    const response = await fetchMyBetaTasksApi();
    setLoading(false);

    if (!response.success) {
      setError(response.error?.message ?? "Aufträge konnten nicht geladen werden.");
      return;
    }

    setError(null);
    setTasks(response.data?.tasks ?? []);
  }, []);

  useEffect(() => {
    void loadTasks();
  }, [loadTasks]);

  async function toggleTask(task: BetaTesterTaskItem) {
    setSavingTaskId(task.id);
    setError(null);

    const nextStatus = task.status === "COMPLETED" ? "OPEN" : "COMPLETED";
    const response = await updateMyBetaTaskApi({
      taskId: task.id,
      status: nextStatus,
    });

    setSavingTaskId(null);

    if (!response.success || !response.data) {
      setError(response.error?.message ?? "Status konnte nicht gespeichert werden.");
      return;
    }

    setTasks((current) =>
      current.map((entry) => (entry.id === task.id ? response.data! : entry)),
    );
  }

  const openCount = tasks.filter((task) => task.status === "OPEN").length;

  return (
    <div className="space-y-6">
      <div className="rounded-xl border border-aw-gold/20 bg-aw-gold/5 p-5">
        <h1 className="font-display text-2xl font-bold text-aw-cream">
          Deine Betatest-Aufträge
        </h1>
        <p className="mt-2 text-sm text-aw-muted">
          Hier siehst du, was du für uns testen sollst. Markiere Aufträge als erledigt,
          wenn du fertig bist.
        </p>
        <p className="mt-3 text-sm text-aw-cream">
          Offen: <strong>{openCount}</strong> · Gesamt: <strong>{tasks.length}</strong>
        </p>
      </div>

      {error && (
        <p className="text-sm text-aw-warning" role="alert">
          {error}
        </p>
      )}

      {loading ? (
        <p className="text-sm text-aw-muted">Lädt …</p>
      ) : tasks.length === 0 ? (
        <p className="rounded-xl border border-aw-border bg-aw-surface/40 p-5 text-sm text-aw-muted">
          Aktuell liegen keine Aufträge vor. Du wirst per E-Mail informiert, sobald
          neue Aufgaben für dich bereitstehen.
        </p>
      ) : (
        <ul className="space-y-4">
          {tasks.map((task) => {
            const completed = task.status === "COMPLETED";

            return (
              <li
                key={task.id}
                className="rounded-xl border border-aw-border bg-aw-surface/40 p-5"
              >
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <p
                      className={`font-medium ${completed ? "text-aw-muted line-through" : "text-aw-cream"}`}
                    >
                      {task.title}
                    </p>
                    {task.description && (
                      <p className="mt-2 text-sm text-aw-muted">{task.description}</p>
                    )}
                    <p className="mt-2 text-xs text-aw-muted">
                      Fällig: {formatDate(task.dueAt)}
                      {completed && task.completedAt
                        ? ` · Erledigt am ${formatDate(task.completedAt)}`
                        : ""}
                    </p>
                  </div>

                  <button
                    type="button"
                    className={completed ? secondaryButtonClassName : primaryButtonClassName}
                    disabled={savingTaskId === task.id}
                    onClick={() => void toggleTask(task)}
                  >
                    {savingTaskId === task.id
                      ? "Speichert …"
                      : completed
                        ? "Wieder öffnen"
                        : "Als erledigt markieren"}
                  </button>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
