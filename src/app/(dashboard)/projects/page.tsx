import { ProjectsTable } from "@/components/projects/projects-table";
import { ProjectsCards } from "@/components/projects/projects-cards";

export default function ProjectsPage() {
  return (
    <div className="p-2">
      <div className="mb-4">
        <ProjectsCards />
      </div>
      <ProjectsTable />
    </div>
  );
}
