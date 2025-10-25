"use client";

import { Dialog } from "../ui/dialog";
import CreateFolderButton from "./folders/create-folder-button";
import FoldersViewWrapper from "./folders/folders-view-wrapper";
import UploadDocumentButton from "./upload-document-button";
import { ViewToggle } from "./view-toggle/view-toggle";

export function DocumentsOverview({
  usersFolders,
  department,
}: {
  usersFolders: { id: number; name: string; path?: string; updatedAt: Date }[];
  department: string;
}) {
  return (
    <div className="flex w-full flex-col gap-6">
      <div className="w-full flex justify-between pt-2">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">
            All Documents
          </h1>
          <p className="text-muted-foreground">
            Review and manage all folders across the organization
          </p>
        </div>

        <div className="flex items-start gap-3">
          <ViewToggle />
          <div className="space-y-2">
            <Dialog>
              <UploadDocumentButton
                usersFolders={usersFolders}
                department={department}
              />
            </Dialog>

            <Dialog>
              <CreateFolderButton
                usersFolders={usersFolders}
                department={department}
              />
            </Dialog>
          </div>
        </div>
      </div>

      <div>
        <FoldersViewWrapper folders={usersFolders} department={department} />
      </div>
    </div>
  );
}
