import { getUser } from "@/actions/auth/dal";
import { getManagerTeamSubmissions } from "@/actions/tasks/taskSubmissions";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { SubmissionReviewDialog } from "@/components/tasks/submission-review-dialog";

function formatDate(val?: unknown) {
  if (!val) return "N/A";
  try {
    const d = typeof val === "string" ? new Date(val) : (val as Date);
    if (!(d instanceof Date) || Number.isNaN(d.getTime())) return String(val);
    return d.toLocaleString();
  } catch {
    return String(val);
  }
}

type ManagerSubmission = {
  id: number;
  taskId: number;
  submittedBy: number;
  submissionNote?: string | null;
  submittedFiles?: { fileUrl: string; fileName: string }[] | null;
  submittedAt: string | Date;
  employeeName?: string | null;
  employeeEmail?: string | null;
  taskTitle?: string | null;
};

const ManagerSubmissionsPage = async () => {
  const employee = await getUser();
  const submissions: ManagerSubmission[] = employee?.id
    ? ((await getManagerTeamSubmissions(employee.id)) as ManagerSubmission[])
    : [];

  return (
    <div className="p-2">
      <div className="mb-4">
        <h2 className="text-lg font-semibold">Team Submissions</h2>
        <p className="text-sm text-muted-foreground">
          Review all submissions from your direct reports. Click file links to
          open attachments in a new tab.
        </p>
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Submitted At</TableHead>
            <TableHead>Employee</TableHead>
            <TableHead>Task</TableHead>
            <TableHead>Note</TableHead>
            <TableHead>Files</TableHead>
            <TableHead className="text-right">Review</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {submissions.map((s) => (
            <TableRow key={s.id}>
              <TableCell>{formatDate(s.submittedAt)}</TableCell>
              <TableCell>
                {s.employeeName || s.employeeEmail ? (
                  <>
                    {s.employeeName ?? s.employeeEmail} {`(#${s.submittedBy})`}
                  </>
                ) : (
                  `#${s.submittedBy}`
                )}
              </TableCell>
              <TableCell>
                {s.taskTitle ? s.taskTitle : `Task #${s.taskId}`}
              </TableCell>
              <TableCell className="max-w-[32rem] truncate">
                {s.submissionNote ?? "—"}
              </TableCell>
              <TableCell>
                {s.submittedFiles && s.submittedFiles.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {s.submittedFiles.map((f) => (
                      <a
                        key={`${f.fileUrl}-${f.fileName}`}
                        href={f.fileUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="underline"
                      >
                        {f.fileName || f.fileUrl}
                      </a>
                    ))}
                  </div>
                ) : (
                  <span className="text-muted-foreground">None</span>
                )}
              </TableCell>
              <TableCell className="text-right">
                <SubmissionReviewDialog taskId={s.taskId} submissionId={s.id} />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
        <TableCaption>
          {submissions.length === 0
            ? "No team submissions yet."
            : `${submissions.length} submission${submissions.length === 1 ? "" : "s"}.`}
        </TableCaption>
      </Table>
    </div>
  );
};

export default ManagerSubmissionsPage;
