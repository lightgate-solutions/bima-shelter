"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Mail } from "lucide-react";

import { EmailListSidebar } from "./email-list-sidebar";
import { EmailDetail } from "./email-detail";
import { ComposeEmail } from "./compose-email";
import { ReplyForwardEmail } from "./reply-forward-email";
import { ScrollArea } from "../ui/scroll-area";

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
  recipients?: Array<{
    id: number;
    name: string;
    email: string;
    isRead: boolean;
    readAt?: Date | null;
  }>;
}

interface User {
  id: number;
  name: string;
  email: string;
  role: string;
  department: string | null;
}

interface _Stats {
  unreadCount: number;
  inboxCount: number;
  archivedCount: number;
  sentCount: number;
  trashCount: number;
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
  recipients: Array<{
    id: number;
    name: string;
    email: string;
    image?: string | null;
    isRead: boolean;
    readAt?: Date | null;
  }>;
  isSender: boolean;
  isRecipient: boolean;
  recipientStatus?: {
    isRead: boolean;
    isArchived: boolean;
    isDeleted: boolean;
    readAt?: Date | null;
  } | null;
}

interface InboxClientProps {
  emails: Email[];
  selectedEmail: SelectedEmail | null;
  users: User[];
  folder: "inbox" | "sent" | "archive" | "trash";
}

export function InboxClient({
  emails,
  selectedEmail,
  users,
  folder,
}: InboxClientProps) {
  const router = useRouter();
  const [showCompose, setShowCompose] = useState(false);
  const [showReplyForward, setShowReplyForward] = useState(false);
  const [replyForwardMode, setReplyForwardMode] = useState<"reply" | "forward">(
    "reply",
  );

  const _handleCompose = () => {
    setShowCompose(true);
  };

  const handleReply = () => {
    setReplyForwardMode("reply");
    setShowReplyForward(true);
  };

  const handleForward = () => {
    setReplyForwardMode("forward");
    setShowReplyForward(true);
  };

  const handleBack = () => {
    router.push(`/mail/${folder}`);
  };

  const handleUpdate = () => {
    router.refresh();
  };

  return (
    <div className="grid grid-cols-3 h-full">
      <ScrollArea className="w-80 border-r col-span-1 flex flex-col h-full overflow-hidden">
        <div className="p-4 border-b flex-shrink-0">
          <h1 className="text-xl font-bold capitalize">{folder}</h1>
          <p className="text-xs text-muted-foreground">
            {emails.length} email{emails.length !== 1 ? "s" : ""}
          </p>
        </div>
        <div className="flex-1 overflow-y-auto">
          <EmailListSidebar emails={emails} folder={folder} />
        </div>
      </ScrollArea>

      <ScrollArea className="flex-1 col-span-2 h-full overflow-hidden">
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
          <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
            <Mail className="h-16 w-16 mb-4 opacity-20" />
            <p className="text-lg font-medium">Select an email to read</p>
            <p className="text-sm">
              Choose an email from the list to view its contents
            </p>
          </div>
        )}
      </ScrollArea>

      <ComposeEmail
        open={showCompose}
        onOpenChange={setShowCompose}
        users={users}
        onSuccess={handleUpdate}
      />

      {selectedEmail && (
        <ReplyForwardEmail
          open={showReplyForward}
          onOpenChange={setShowReplyForward}
          mode={replyForwardMode}
          originalEmail={{
            id: Number(selectedEmail.id),
            subject: selectedEmail.subject,
            body: selectedEmail.body,
            senderId: selectedEmail.senderId,
            senderName: selectedEmail.senderName,
            senderEmail: selectedEmail.senderEmail,
            createdAt: selectedEmail.createdAt,
          }}
          users={users}
          onSuccess={handleUpdate}
        />
      )}
    </div>
  );
}
