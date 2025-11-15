import LeaveApplicationForm from "@/components/hr/leave-application-form";
import { BackButton } from "@/components/ui/back-button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default async function Page() {
  return (
    <div className="space-y-4">
      <div className="flex items-start gap-4">
        <BackButton />
        <div>
          <h1 className="text-2xl font-bold">Apply for Leave</h1>
          <p className="text-sm text-muted-foreground">
            Submit a new leave application
          </p>
        </div>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Leave Application Form</CardTitle>
          <CardDescription>
            Fill in the details below to apply for leave
          </CardDescription>
        </CardHeader>
        <CardContent>
          <LeaveApplicationForm />
        </CardContent>
      </Card>
    </div>
  );
}
