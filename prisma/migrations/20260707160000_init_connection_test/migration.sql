-- =============================================================================
-- Migration: init_connection_test
-- =============================================================================
-- Zweck: Minimale technische Tabelle für Verbindungstests (Schritt 1).
-- Keine Fachdaten — Rezept-Tabellen folgen in späteren Migrationen.
-- =============================================================================

-- CreateTable
CREATE TABLE "connection_test" (
    "id" UUID NOT NULL,
    "message" TEXT NOT NULL DEFAULT 'ok',
    "checked_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "connection_test_pkey" PRIMARY KEY ("id")
);
