import { assertAccountingAccessFromRequest } from "@/lib/accounting/accounting-auth";
import { jsonFromAccountingResult } from "@/lib/accounting/accounting-api-utils";
import { prisma } from "@/lib/db/prisma";
import { buildStudentDisplayName } from "@/lib/certificates/certificate-render";

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(
  request: Request,
  context: RouteContext,
): Promise<Response> {
  const access = await assertAccountingAccessFromRequest(request);

  if (!access.success) {
    return jsonFromAccountingResult(access);
  }

  const { id: userId } = await context.params;

  const rows = await prisma.userCourseCertificate.findMany({
    where: {
      userId,
      course: { courseType: "zertifikatskurs" },
    },
    include: {
      course: { select: { title: true } },
      user: { include: { profile: true } },
    },
    orderBy: { updatedAt: "desc" },
  });

  const entries = rows.map((row) => {
    const profile = row.user.profile;
    const studentName = profile
      ? buildStudentDisplayName({
          firstName: profile.firstName,
          lastName: profile.lastName,
          company: profile.company,
        })
      : row.user.email;

    return {
      id: row.id,
      certificateNumber: row.certificateNumber,
      status: row.status,
      courseTitle: row.course.title,
      issuedAt: row.issuedAt?.toISOString() ?? null,
      studentName,
    };
  });

  return jsonFromAccountingResult({ success: true, data: entries });
}
