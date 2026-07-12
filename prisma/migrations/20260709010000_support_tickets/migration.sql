-- Support-Ticketsystem

CREATE TYPE "SupportTicketStatus" AS ENUM ('open', 'in_progress', 'waiting_user', 'resolved', 'closed');
CREATE TYPE "SupportTicketPriority" AS ENUM ('normal', 'important', 'urgent');
CREATE TYPE "SupportTicketWaitingOn" AS ENUM ('admin', 'user');
CREATE TYPE "SupportTicketEventType" AS ENUM (
  'created', 'status_changed', 'assigned', 'reassigned', 'public_reply',
  'internal_note', 'user_reply', 'resolved', 'closed', 'reopened', 'rating',
  'attachment_added', 'reminder_sent', 'escalated', 'anonymized'
);
CREATE TYPE "SupportTicketMessageAuthorType" AS ENUM ('user', 'staff');

CREATE TABLE "support_ticket_categories" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "name" TEXT NOT NULL,
  "slug" TEXT NOT NULL,
  "description" TEXT,
  "sort_order" INTEGER NOT NULL DEFAULT 0,
  "is_active" BOOLEAN NOT NULL DEFAULT true,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "support_ticket_categories_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "support_ticket_categories_slug_key" ON "support_ticket_categories"("slug");
CREATE INDEX "support_ticket_categories_is_active_sort_order_idx" ON "support_ticket_categories"("is_active", "sort_order");

CREATE TABLE "support_tickets" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "ticket_number" TEXT NOT NULL,
  "user_id" UUID NOT NULL,
  "category_id" UUID NOT NULL,
  "assigned_to_user_id" UUID,
  "subject" TEXT NOT NULL,
  "status" "SupportTicketStatus" NOT NULL DEFAULT 'open',
  "priority" "SupportTicketPriority" NOT NULL DEFAULT 'normal',
  "waiting_on" "SupportTicketWaitingOn" NOT NULL DEFAULT 'admin',
  "is_overdue" BOOLEAN NOT NULL DEFAULT false,
  "unassigned_alert_sent" BOOLEAN NOT NULL DEFAULT false,
  "last_staff_reply_at" TIMESTAMP(3),
  "last_user_reply_at" TIMESTAMP(3),
  "resolved_at" TIMESTAMP(3),
  "closed_at" TIMESTAMP(3),
  "user_reminder_at" TIMESTAMP(3),
  "auto_close_at" TIMESTAMP(3),
  "user_unread_count" INTEGER NOT NULL DEFAULT 0,
  "user_has_reminder" BOOLEAN NOT NULL DEFAULT false,
  "rating" INTEGER,
  "rating_comment" TEXT,
  "closure_note" TEXT,
  "anonymized_at" TIMESTAMP(3),
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "support_tickets_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "support_tickets_ticket_number_key" ON "support_tickets"("ticket_number");
CREATE INDEX "support_tickets_user_id_status_created_at_idx" ON "support_tickets"("user_id", "status", "created_at");
CREATE INDEX "support_tickets_assigned_to_user_id_status_idx" ON "support_tickets"("assigned_to_user_id", "status");
CREATE INDEX "support_tickets_status_priority_created_at_idx" ON "support_tickets"("status", "priority", "created_at");
CREATE INDEX "support_tickets_is_overdue_status_idx" ON "support_tickets"("is_overdue", "status");

CREATE TABLE "support_ticket_messages" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "ticket_id" UUID NOT NULL,
  "author_user_id" UUID NOT NULL,
  "author_type" "SupportTicketMessageAuthorType" NOT NULL,
  "body" TEXT NOT NULL,
  "is_read_by_user" BOOLEAN NOT NULL DEFAULT false,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "support_ticket_messages_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "support_ticket_messages_ticket_id_created_at_idx" ON "support_ticket_messages"("ticket_id", "created_at");

CREATE TABLE "support_ticket_internal_notes" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "ticket_id" UUID NOT NULL,
  "author_user_id" UUID NOT NULL,
  "body" TEXT NOT NULL,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "support_ticket_internal_notes_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "support_ticket_internal_notes_ticket_id_created_at_idx" ON "support_ticket_internal_notes"("ticket_id", "created_at");

CREATE TABLE "support_ticket_attachments" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "ticket_id" UUID NOT NULL,
  "message_id" UUID,
  "uploaded_by_user_id" UUID NOT NULL,
  "storage_key" TEXT NOT NULL,
  "file_name" TEXT NOT NULL,
  "mime_type" TEXT NOT NULL,
  "size_bytes" INTEGER NOT NULL,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "support_ticket_attachments_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "support_ticket_attachments_ticket_id_idx" ON "support_ticket_attachments"("ticket_id");

CREATE TABLE "support_ticket_events" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "ticket_id" UUID NOT NULL,
  "actor_user_id" UUID,
  "event_type" "SupportTicketEventType" NOT NULL,
  "summary" TEXT NOT NULL,
  "metadata" JSONB,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "support_ticket_events_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "support_ticket_events_ticket_id_created_at_idx" ON "support_ticket_events"("ticket_id", "created_at");

CREATE TABLE "support_reply_templates" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "title" TEXT NOT NULL,
  "body" TEXT NOT NULL,
  "sort_order" INTEGER NOT NULL DEFAULT 0,
  "is_active" BOOLEAN NOT NULL DEFAULT true,
  "category_id" UUID,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "support_reply_templates_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "support_reply_templates_is_active_sort_order_idx" ON "support_reply_templates"("is_active", "sort_order");

CREATE TABLE "support_ticket_counters" (
  "year" INTEGER NOT NULL,
  "last_number" INTEGER NOT NULL DEFAULT 0,
  CONSTRAINT "support_ticket_counters_pkey" PRIMARY KEY ("year")
);

ALTER TABLE "support_tickets" ADD CONSTRAINT "support_tickets_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "support_tickets" ADD CONSTRAINT "support_tickets_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "support_ticket_categories"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "support_tickets" ADD CONSTRAINT "support_tickets_assigned_to_user_id_fkey" FOREIGN KEY ("assigned_to_user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "support_ticket_messages" ADD CONSTRAINT "support_ticket_messages_ticket_id_fkey" FOREIGN KEY ("ticket_id") REFERENCES "support_tickets"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "support_ticket_messages" ADD CONSTRAINT "support_ticket_messages_author_user_id_fkey" FOREIGN KEY ("author_user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "support_ticket_internal_notes" ADD CONSTRAINT "support_ticket_internal_notes_ticket_id_fkey" FOREIGN KEY ("ticket_id") REFERENCES "support_tickets"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "support_ticket_internal_notes" ADD CONSTRAINT "support_ticket_internal_notes_author_user_id_fkey" FOREIGN KEY ("author_user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "support_ticket_attachments" ADD CONSTRAINT "support_ticket_attachments_ticket_id_fkey" FOREIGN KEY ("ticket_id") REFERENCES "support_tickets"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "support_ticket_attachments" ADD CONSTRAINT "support_ticket_attachments_message_id_fkey" FOREIGN KEY ("message_id") REFERENCES "support_ticket_messages"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "support_ticket_attachments" ADD CONSTRAINT "support_ticket_attachments_uploaded_by_user_id_fkey" FOREIGN KEY ("uploaded_by_user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "support_ticket_events" ADD CONSTRAINT "support_ticket_events_ticket_id_fkey" FOREIGN KEY ("ticket_id") REFERENCES "support_tickets"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "support_ticket_events" ADD CONSTRAINT "support_ticket_events_actor_user_id_fkey" FOREIGN KEY ("actor_user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "support_reply_templates" ADD CONSTRAINT "support_reply_templates_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "support_ticket_categories"("id") ON DELETE SET NULL ON UPDATE CASCADE;

INSERT INTO "support_ticket_categories" ("id", "name", "slug", "description", "sort_order", "is_active", "updated_at") VALUES
  (gen_random_uuid(), 'Kurse', 'kurse', 'Fragen zu Kursen und Lektionen', 10, true, CURRENT_TIMESTAMP),
  (gen_random_uuid(), 'Zahlung', 'zahlung', 'Rechnungen, Zahlungsprobleme', 20, true, CURRENT_TIMESTAMP),
  (gen_random_uuid(), 'Mitgliedschaft', 'mitgliedschaft', 'Wurstclub, Meisterclub, Verlängerung', 30, true, CURRENT_TIMESTAMP),
  (gen_random_uuid(), 'Technik', 'technik', 'Login, Seitenfehler, Browser', 40, true, CURRENT_TIMESTAMP),
  (gen_random_uuid(), 'Rezeptgenerator', 'rezeptgenerator', 'Rezeptgenerator und Rezepte', 50, true, CURRENT_TIMESTAMP),
  (gen_random_uuid(), 'Forum/Community', 'forum-community', 'Foren und Community', 60, true, CURRENT_TIMESTAMP),
  (gen_random_uuid(), 'Allgemeine Anfrage', 'allgemein', 'Sonstige Anliegen', 70, true, CURRENT_TIMESTAMP);
