/**
 * @file admin-dashboard-service.ts
 * @purpose Echte Kennzahlen für das Admin-Dashboard.
 */

import { prisma } from "@/lib/db/prisma";

import { isStripeCheckoutEnabled } from "@/lib/stripe/stripe-settings-service";
import { processSupportEscalations } from "@/lib/support/support-escalation-service";
import { getAnalyticsDashboardTiles } from "@/lib/analytics/analytics-query-service";
import type { AnalyticsDashboardTiles } from "@/lib/analytics/analytics-types";

export type AdminDashboardSupportTicketStats = {
  openTotal: number;
  overdue: number;
  unassigned: number;
  waitingUser: number;
};

export type AdminDashboardStats = {
  userCount: number;
  adminCount: number;
  courseCount: number;
  publishedCourseCount: number;
  courseEnrollmentCount: number;
  orderCount: number;
  revenueCents: number | null;
  activeMembershipCount: number;
  reviewCount: number;
  certificateCount: number;
  supportTickets: AdminDashboardSupportTicketStats;
  analytics: AnalyticsDashboardTiles;
  modules: {
    orders: boolean;
    revenue: boolean;
    stripePaypal: boolean;
  };
};

async function getSupportTicketCountsForDashboard(): Promise<AdminDashboardSupportTicketStats> {
  await processSupportEscalations();

  const activeStatuses = ["open", "in_progress", "waiting_user"] as const;

  const [openTotal, overdue, unassigned, waitingUser] = await Promise.all([
    prisma.supportTicket.count({
      where: { status: { in: [...activeStatuses] } },
    }),
    prisma.supportTicket.count({
      where: { isOverdue: true, status: { not: "closed" } },
    }),
    prisma.supportTicket.count({
      where: {
        assignedToUserId: null,
        status: { in: [...activeStatuses] },
      },
    }),
    prisma.supportTicket.count({
      where: { status: "waiting_user" },
    }),
  ]);

  return { openTotal, overdue, unassigned, waitingUser };
}

export async function getAdminDashboardStats(): Promise<AdminDashboardStats> {
  const [
    userCount,
    adminCount,
    courseCount,
    publishedCourseCount,
    courseEnrollmentCount,
    orderCount,
    paidPositions,
    activeMembershipCount,
    reviewCount,
    certificateCount,
    supportTickets,
    stripeEnabled,
    analyticsTiles,
  ] = await Promise.all([
    prisma.user.count({ where: { deletedAt: null } }),
    prisma.user.count({
      where: { deletedAt: null, systemRole: "ADMIN" },
    }),
    prisma.course.count(),
    prisma.course.count({ where: { status: "published" } }),
    prisma.userCourseAccess.count({ where: { revokedAt: null } }),
    prisma.accountingPosition.count(),
    prisma.accountingPosition.findMany({
      where: { paymentStatus: "paid" },
      select: { grossAmount: true },
    }),
    prisma.membership.count({ where: { status: "active" } }),
    prisma.courseReview.count(),
    prisma.userCourseCertificate.count({ where: { status: "issued" } }),
    getSupportTicketCountsForDashboard(),
    isStripeCheckoutEnabled(),
    getAnalyticsDashboardTiles(),
  ]);

  const revenueCents = paidPositions.reduce((sum, position) => {
    const amount = Number(position.grossAmount);

    if (!Number.isFinite(amount)) {
      return sum;
    }

    return sum + Math.round(amount * 100);
  }, 0);

  return {
    userCount,
    adminCount,
    courseCount,
    publishedCourseCount,
    courseEnrollmentCount,
    orderCount,
    revenueCents: orderCount > 0 ? revenueCents : null,
    activeMembershipCount,
    reviewCount,
    certificateCount,
    supportTickets,
    analytics: analyticsTiles,
    modules: {
      orders: true,
      revenue: orderCount > 0,
      stripePaypal: stripeEnabled,
    },
  };
}
