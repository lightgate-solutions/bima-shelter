"use client";

import { useRouter } from "next/navigation";
import { Mail } from "lucide-react";
import { EmailListSidebar } from "@/components/mail/email-list-sidebar";
import { EmailDetail } from "@/components/mail/email-detail";
import { ScrollArea } from "../ui/scroll-area";

type Folder = "inbox" | "sent" | "archive" | "trash";

interface EmailRecipient {
  id: number;
  name: string;
  email: string;
  isRead: boolean;
  readAt?: Date | null;
}

interface Email {
  id: number;
  subject: string;
  body: string;
  createdAt: Date;
  type: string;
  senderId?: number;
  senderName?: string;
  senderEmail?: string;
  isRead?: boolean;
  readAt?: Date | null;
  hasBeenOpened?: boolean;
  recipients?: EmailRecipient[];
}

interface SelectedRecipient extends EmailRecipient {
  image?: string | null;
}

interface SelectedEmail {
  id: number;
  subject: string;
  body: string;
  createdAt: Date;
  type: string;
  parentEmailId?: number | null;
  senderId: number;
  senderName: string;
  senderEmail: string;
  senderImage?: string | null;
  hasBeenOpened: boolean;
  recipients: SelectedRecipient[];
  isSender: boolean;
  isRecipient: boolean;
  recipientStatus?: {
    isRead: boolean;
    isArchived: boolean;
    isDeleted: boolean;
    readAt?: Date | null;
  } | null;
}

interface MailContentProps {
  emails: Email[];
  selectedEmail: SelectedEmail | null;
  folder: Folder;
}

export function MailContent({
  emails,
  selectedEmail,
  folder,
}: MailContentProps) {
  const router = useRouter();

  const handleBack = () => {
    router.push(`/mail/${folder}`);
  };

  const handleReply = () => {
    document.querySelector<HTMLElement>("[data-reply-trigger]")?.click();
  };

  const handleForward = () => {
    document.querySelector<HTMLElement>("[data-forward-trigger]")?.click();
  };

  const handleUpdate = () => {
    router.refresh();
  };

  const FolderHeader = () => (
    <div className="p-4 border-b flex-shrink-0">
      <h1 className="text-base font-semibold capitalize">{folder}</h1>
      <p className="text-xs text-muted-foreground">
        {emails.length} email{emails.length !== 1 ? "s" : ""}
      </p>
    </div>
  );

  return (
    <div className="h-full w-full">
      <div className="hidden md:grid md:h-full md:grid-cols-3">
        <div className="flex h-full flex-col border-r col-span-1 bg-background">
          <div className="sticky top-0 z-10 bg-background">
            <FolderHeader />
          </div>

          <ScrollArea className="h-screen">
            <EmailListSidebar emails={emails} folder={folder} />
          </ScrollArea>
        </div>

        <div className="flex h-full flex-col bg-background col-span-2">
          {selectedEmail ? (
            <EmailDetail
              email={selectedEmail}
              onBack={handleBack}
              onReply={handleReply}
              onForward={handleForward}
              onUpdate={handleUpdate}
              folder={folder}
            />
          ) : (
            <div className="flex h-full flex-col items-center justify-center text-muted-foreground">
              <Mail className="mb-4 h-16 w-16 opacity-20" />
              <p className="text-sm">Select an email to view its details</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
