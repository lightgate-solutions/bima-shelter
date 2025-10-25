/** biome-ignore-all lint/correctness/useExhaustiveDependencies: <> */
/** biome-ignore-all lint/suspicious/noExplicitAny: <> */
"use client";

import { useState, useEffect } from "react";
import { formatDistanceToNow, format } from "date-fns";
import {
  Archive,
  ArchiveX,
  ArrowLeft,
  Forward,
  Loader2,
  MailCheck,
  Reply,
  Trash2,
  Undo2,
  X,
  FileText,
  Eye,
} from "lucide-react";
import { toast } from "sonner";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  archiveEmail,
  unarchiveEmail,
  moveEmailToTrash,
  restoreEmailFromTrash,
  deleteSentEmail,
  permanentlyDeleteEmail,
  getEmailAttachments,
  removeAttachmentFromEmail,
} from "@/actions/mail/email";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { ScrollArea } from "../ui/scroll-area";

interface Recipient {
  id: number;
  name: string;
  email: string;
  image?: string | null;
  isRead: boolean;
  readAt?: Date | null;
}

interface Attachment {
  id: number;
  emailId: number;
  documentId: number;
  createdAt: Date;
  documentTitle: string;
  documentDescription: string | null;
  documentFileName: string | null;
  documentMimeType: string | null;
  documentFileSize: string | null;
  documentFilePath: string | null;
  documentUploader: string | null;
  documentUploaderEmail: string | null;
}

interface EmailData {
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
  recipients: Recipient[];
  isSender: boolean;
  isRecipient: boolean;
  recipientStatus?: {
    isRead: boolean;
    isArchived: boolean;
    isDeleted: boolean;
    readAt?: Date | null;
  } | null;
}

interface EmailDetailProps {
  email: EmailData;
  onBack: () => void;
  onReply?: () => void;
  onForward?: () => void;
  onUpdate?: () => void;
  folder?: "inbox" | "sent" | "archive" | "trash";
}

export function EmailDetail({
  email,
  onBack,
  onReply,
  onForward,
  onUpdate,
  folder,
}: EmailDetailProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [deleteAction, setDeleteAction] = useState<
    "trash" | "permanent" | "sent"
  >("trash");
  const [attachments, setAttachments] = useState<any>([]);
  const [loadingAttachments, setLoadingAttachments] = useState(false);

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  // Load attachments when component mounts
  useEffect(() => {
    loadAttachments();
  }, [email.id]);

  const loadAttachments = async () => {
    setLoadingAttachments(true);
    const result = await getEmailAttachments(email.id);
    if (result.success) {
      setAttachments(result.data || []);
    } else {
      toast.error(result.error || "Failed to load attachments");
    }
    setLoadingAttachments(false);
  };

  const handleRemoveAttachment = async (attachmentId: number) => {
    setIsLoading(true);
    const result = await removeAttachmentFromEmail(attachmentId);
    if (result.success) {
      toast.success("Attachment removed");
      loadAttachments(); // Reload attachments
      onUpdate?.(); // Refresh the email list
    } else {
      toast.error(result.error || "Failed to remove attachment");
    }
    setIsLoading(false);
  };

  const handleViewAttachment = (attachment: Attachment) => {
    // Open document in new tab
    window.open(`/documents/${attachment.documentId}`, "_blank");
  };

  const handleArchive = async () => {
    setIsLoading(true);
    const result = await archiveEmail(Number(email.id));

    if (result.success) {
      toast.success("Email archived");
      onUpdate?.();
      onBack();
    } else {
      toast.error(result.error || "Failed to archive email");
    }
    setIsLoading(false);
  };

  const handleUnarchive = async () => {
    setIsLoading(true);
    const result = await unarchiveEmail(Number(email.id));

    if (result.success) {
      toast.success("Email moved to inbox");
      onUpdate?.();
      onBack();
    } else {
      toast.error(result.error || "Failed to unarchive email");
    }
    setIsLoading(false);
  };

  const handleMoveToTrash = async () => {
    setIsLoading(true);
    const result = await moveEmailToTrash(Number(email.id));

    if (result.success) {
      toast.success("Email moved to trash");
      onUpdate?.();
      onBack();
    } else {
      toast.error(result.error || "Failed to move email to trash");
    }
    setIsLoading(false);
  };

  const handleRestore = async () => {
    setIsLoading(true);
    const result = await restoreEmailFromTrash(Number(email.id));

    if (result.success) {
      toast.success("Email restored");
      onUpdate?.();
      onBack();
    } else {
      toast.error(result.error || "Failed to restore email");
    }
    setIsLoading(false);
  };

  const handleDeleteSent = async () => {
    setIsLoading(true);
    const result = await deleteSentEmail(Number(email.id));

    if (result.success) {
      toast.success("Email deleted");
      onUpdate?.();
      onBack();
    } else {
      toast.error(result.error || "Failed to delete email");
    }
    setIsLoading(false);
    setShowDeleteDialog(false);
  };

  const handlePermanentDelete = async () => {
    setIsLoading(true);
    const result = await permanentlyDeleteEmail(Number(email.id));

    if (result.success) {
      toast.success("Email permanently deleted");
      onUpdate?.();
      onBack();
    } else {
      toast.error(result.error || "Failed to delete email");
    }
    setIsLoading(false);
    setShowDeleteDialog(false);
  };

  const confirmDelete = (action: "trash" | "permanent" | "sent") => {
    setDeleteAction(action);
    setShowDeleteDialog(true);
  };

  const handleDeleteConfirm = () => {
    if (deleteAction === "sent") {
      handleDeleteSent();
    } else if (deleteAction === "permanent") {
      handlePermanentDelete();
    } else {
      setShowDeleteDialog(false);
      handleMoveToTrash();
    }
  };

  return (
    <>
      <div className="flex flex-col h-full">
        <div className="sticky top-0 z-10 pt-2 border-b bg-background">
          <div className="flex items-center justify-between p-4 ">
            <Button
              variant="ghost"
              size="sm"
              onClick={onBack}
              className="gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Back
            </Button>

            <div className="flex items-center gap-2">
              {email.isRecipient && folder !== "trash" && (
                <div>
                  {folder === "archive" ? (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleUnarchive}
                      disabled={isLoading}
                      className="gap-2"
                    >
                      <ArchiveX className="h-4 w-4" />
                      Unarchive
                    </Button>
                  ) : (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleArchive}
                      disabled={isLoading}
                      className="gap-2"
                    >
                      <Archive className="h-4 w-4" />
                      Archive
                    </Button>
                  )}
                </div>
              )}

              {email.isRecipient && folder === "trash" && (
                <>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleRestore}
                    disabled={isLoading}
                    className="gap-2"
                  >
                    <Undo2 className="h-4 w-4" />
                    Restore
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => confirmDelete("permanent")}
                    disabled={isLoading}
                    className="gap-2 text-destructive hover:text-destructive"
                  >
                    <X className="h-4 w-4" />
                    Delete Forever
                  </Button>
                </>
              )}

              {email.isRecipient && folder !== "trash" && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => confirmDelete("trash")}
                  disabled={isLoading}
                  className="gap-2 text-destructive hover:text-destructive"
                >
                  <Trash2 className="h-4 w-4" />
                  Delete
                </Button>
              )}

              {email.isSender && folder === "sent" && !email.hasBeenOpened && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => confirmDelete("sent")}
                  disabled={isLoading}
                  className="gap-2 text-destructive hover:text-destructive"
                >
                  <Trash2 className="h-4 w-4" />
                  Delete
                </Button>
              )}
            </div>
          </div>
        </div>

        <ScrollArea className="h-screen">
          {/* Email Content */}
          <div className="flex-1 overflow-y-auto p-6">
            <div className="w-full space-y-6">
              {/* Subject */}
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <h1 className="text-2xl font-bold">
                    Subject: {email.subject}
                  </h1>
                  {email.type !== "sent" && (
                    <Badge variant="secondary">{email.type}</Badge>
                  )}
                </div>
              </div>

              {/* Sender Info */}
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-3">
                  <Avatar className="h-12 w-12">
                    <AvatarImage src={email.senderImage || undefined} />
                    <AvatarFallback>
                      {getInitials(email.senderName)}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <div className="font-semibold">{email.senderName}</div>
                    <div className="text-sm text-muted-foreground">
                      {email.senderEmail}
                    </div>
                    <div className="text-xs text-muted-foreground mt-1">
                      {format(new Date(email.createdAt), "PPpp")}
                      {" • "}
                      {formatDistanceToNow(new Date(email.createdAt), {
                        addSuffix: true,
                      })}
                    </div>
                  </div>
                </div>

                {email.isRecipient && folder !== "trash" && (
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={onReply}
                      className="gap-2"
                    >
                      <Reply className="h-4 w-4" />
                      Reply
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={onForward}
                      className="gap-2"
                    >
                      <Forward className="h-4 w-4" />
                      Forward
                    </Button>
                  </div>
                )}
              </div>

              <Accordion
                type="single"
                collapsible
                className="w-full"
                defaultValue="item-1"
              >
                <AccordionItem value="item-1">
                  <AccordionTrigger>Receipients Information</AccordionTrigger>
                  <AccordionContent>
                    {email.isSender && email.recipients.length > 0 && (
                      <div className="bg-muted/50 rounded-lg p-4">
                        <div className="text-sm font-medium mb-2">
                          Recipients:
                        </div>
                        <div className="space-y-2">
                          {email.recipients.map((recipient) => (
                            <div
                              key={recipient.id}
                              className="flex items-center justify-between text-sm"
                            >
                              <div className="flex items-center gap-2">
                                <Avatar className="h-6 w-6">
                                  <AvatarImage
                                    src={recipient.image || undefined}
                                  />
                                  <AvatarFallback className="text-xs">
                                    {getInitials(recipient.name)}
                                  </AvatarFallback>
                                </Avatar>
                                <span>{recipient.name}</span>
                                <span className="text-muted-foreground">
                                  ({recipient.email})
                                </span>
                              </div>
                              <div className="flex items-center gap-2">
                                {recipient.isRead ? (
                                  <>
                                    <MailCheck className="h-4 w-4 text-green-600" />
                                    <span className="text-xs text-muted-foreground">
                                      Opened{" "}
                                      {recipient.readAt &&
                                        formatDistanceToNow(
                                          new Date(recipient.readAt),
                                          {
                                            addSuffix: true,
                                          },
                                        )}
                                    </span>
                                  </>
                                ) : (
                                  <Badge variant="outline" className="text-xs">
                                    Unread
                                  </Badge>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </AccordionContent>
                </AccordionItem>
              </Accordion>

              <Card>
                <CardHeader>
                  <CardTitle>Mail Body</CardTitle>
                </CardHeader>
                <CardContent className="prose prose-sm max-w-none dark:prose-invert">
                  <div className="whitespace-pre-wrap">{email.body}</div>
                </CardContent>
              </Card>

              {/* Attachments Section */}
              {attachments.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <FileText className="h-5 w-5" />
                      Attachments ({attachments.length})
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {attachments.map((attachment: any) => (
                        <div
                          key={attachment.id}
                          className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors"
                        >
                          <div className="flex items-center gap-3 flex-1 min-w-0">
                            <div className="flex-shrink-0">
                              <FileText className="h-8 w-8 text-muted-foreground" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="font-medium truncate">
                                {attachment.documentTitle}
                              </div>
                              <div className="text-sm text-muted-foreground truncate">
                                {attachment.documentFileName ||
                                  attachment.documentDescription ||
                                  "No description"}
                              </div>
                              <div className="text-xs text-muted-foreground">
                                {attachment.documentFileSize &&
                                  `${attachment.documentFileSize} bytes`}
                                {attachment.documentUploader &&
                                  ` • Uploaded by ${attachment.documentUploader}`}
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-2 flex-shrink-0">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleViewAttachment(attachment)}
                              className="gap-1"
                            >
                              <Eye className="h-4 w-4" />
                              View
                            </Button>
                            {email.isSender && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() =>
                                  handleRemoveAttachment(attachment.id)
                                }
                                disabled={isLoading}
                                className="gap-1 text-destructive hover:text-destructive"
                              >
                                <X className="h-4 w-4" />
                                Remove
                              </Button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {loadingAttachments && (
                <Card>
                  <CardContent className="flex items-center justify-center py-8">
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Loading attachments...
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </ScrollArea>
      </div>

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {deleteAction === "permanent"
                ? "Permanently Delete Email"
                : deleteAction === "sent"
                  ? "Delete Sent Email"
                  : "Move to Trash"}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {deleteAction === "permanent"
                ? "This action cannot be undone. This email will be permanently deleted from your account."
                : deleteAction === "sent"
                  ? "This email has not been opened by any recipient yet. Are you sure you want to delete it? This action cannot be undone."
                  : "This email will be moved to trash. You can restore it later if needed."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isLoading}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              disabled={isLoading}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Deleting...
                </>
              ) : (
                "Delete"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
