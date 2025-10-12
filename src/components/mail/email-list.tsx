"use client";

import { formatDistanceToNow } from "date-fns";
import { Mail, MailOpen } from "lucide-react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { CardContent } from "../ui/card";

interface Email {
  id: number;
  subject: string;
  body: string;
  createdAt: Date;
  type: string;
  senderId: number;
  senderName: string;
  senderEmail: string;
  isRead?: boolean;
  readAt?: Date | null;
}

interface EmailListProps {
  emails: Email[];
  onEmailClick: (emailId: number) => void;
  selectedEmailId?: string;
}

export function EmailList({
  emails,
  onEmailClick,
  selectedEmailId,
}: EmailListProps) {
  if (emails.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-muted-foreground">
        <Mail className="h-12 w-12 mb-4 opacity-50" />
        <p className="text-lg font-medium">No emails found</p>
        <p className="text-sm">Your mailbox is empty</p>
      </div>
    );
  }

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const truncateText = (text: string, maxLength: number) => {
    if (text.length <= maxLength) return text;
    return `${text.slice(0, maxLength)}...`;
  };

  return (
    <div className="divide-y">
      {emails.map((email) => (
        <CardContent
          key={email.id}
          onClick={() => onEmailClick(Number(email.id))}
          className={cn(
            "flex items-start gap-3 p-4 cursor-pointer transition-colors hover:bg-muted/50",
            Number(selectedEmailId) === email.id && "bg-muted",
            !email.isRead && "bg-blue-50/50 dark:bg-blue-950/20",
          )}
        >
          <div className="flex-shrink-0 mt-1">
            <Avatar className="h-10 w-10">
              <AvatarFallback className="text-xs">
                {getInitials(email.senderName)}
              </AvatarFallback>
            </Avatar>
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2 mb-1">
              <div className="flex items-center gap-2">
                <span
                  className={cn(
                    "font-medium truncate",
                    !email.isRead && "font-semibold",
                  )}
                >
                  {email.senderName}
                </span>
                {!email.isRead && (
                  <div className="flex-shrink-0 h-2 w-2 bg-blue-600 rounded-full" />
                )}
              </div>
              <span className="text-xs text-muted-foreground whitespace-nowrap flex-shrink-0">
                {formatDistanceToNow(new Date(email.createdAt), {
                  addSuffix: true,
                })}
              </span>
            </div>

            <div className="flex items-center gap-2 mb-1">
              <h3
                className={cn(
                  "text-sm truncate",
                  !email.isRead ? "font-semibold" : "font-medium",
                )}
              >
                {email.subject}
              </h3>
              {email.type !== "sent" && (
                <Badge
                  variant="secondary"
                  className="text-xs flex-shrink-0 h-5"
                >
                  {email.type}
                </Badge>
              )}
            </div>

            <p className="text-sm text-muted-foreground line-clamp-2">
              {truncateText(email.body, 120)}
            </p>
          </div>
          <div className="flex-shrink-0 mt-1">
            {email.isRead ? (
              <MailOpen className="h-4 w-4 text-muted-foreground" />
            ) : (
              <Mail className="h-4 w-4 text-blue-600" />
            )}
          </div>
        </CardContent>
      ))}
    </div>
  );
}
