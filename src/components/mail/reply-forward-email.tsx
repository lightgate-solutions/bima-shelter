"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Loader2, Send, X } from "lucide-react";
import { toast } from "sonner";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { replyToEmail, forwardEmail } from "@/actions/mail/email";

const replyForwardSchema = z.object({
  recipientIds: z
    .array(z.number())
    .min(1, "At least one recipient is required"),
  subject: z.string().min(1, "Subject is required").max(500),
  body: z.string().min(1, "Body is required"),
});

type ReplyForwardFormData = z.infer<typeof replyForwardSchema>;

interface User {
  id: number;
  name: string;
  email: string;
}

interface OriginalEmail {
  id: number;
  subject: string;
  body: string;
  senderId: number;
  senderName: string;
  senderEmail: string;
  createdAt: Date;
}

interface ReplyForwardEmailProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mode: "reply" | "forward";
  originalEmail: OriginalEmail;
  users: User[];
  onSuccess?: () => void;
}

export function ReplyForwardEmail({
  open,
  onOpenChange,
  mode,
  originalEmail,
  users,
  onSuccess,
}: ReplyForwardEmailProps) {
  const [selectedUsers, setSelectedUsers] = useState<User[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [showUserList, setShowUserList] = useState(false);

  const getDefaultSubject = () => {
    const prefix = mode === "reply" ? "Re: " : "Fwd: ";
    const subject = originalEmail.subject;

    if (mode === "reply" && subject.startsWith("Re: ")) {
      return subject;
    }

    if (mode === "forward" && subject.startsWith("Fwd: ")) {
      return subject;
    }

    return prefix + subject;
  };

  const getDefaultBody = () => {
    const timestamp = new Date(originalEmail.createdAt).toLocaleString();
    const separator = "\n\n------- Original Message -------\n";
    const header = `From: ${originalEmail.senderName} <${originalEmail.senderEmail}>\n`;
    const dateHeader = `Date: ${timestamp}\n`;
    const subjectHeader = `Subject: ${originalEmail.subject}\n\n`;

    return `\n\n${separator}${header}${dateHeader}${subjectHeader}${originalEmail.body}`;
  };

  const form = useForm<ReplyForwardFormData>({
    resolver: zodResolver(replyForwardSchema),
    defaultValues: {
      recipientIds: [originalEmail.senderId],
      subject: getDefaultSubject(),
      body: getDefaultBody(),
    },
  });

  const onSubmit = async (data: ReplyForwardFormData) => {
    const result =
      mode === "reply"
        ? await replyToEmail({
            ...data,
            parentEmailId: originalEmail.id,
          })
        : await forwardEmail({
            ...data,
            parentEmailId: originalEmail.id,
          });

    if (result.success) {
      toast.success(
        `Email ${mode === "reply" ? "sent" : "forwarded"} successfully`,
      );
      form.reset();
      setSelectedUsers([]);
      setSearchQuery("");
      onOpenChange(false);
      onSuccess?.();
    } else {
      toast.error(result.error || `Failed to ${mode} email`);
    }
  };

  const handleUserSelect = (user: User) => {
    if (!selectedUsers.find((u) => u.id === user.id)) {
      const newSelectedUsers = [...selectedUsers, user];
      setSelectedUsers(newSelectedUsers);
      form.setValue(
        "recipientIds",
        newSelectedUsers.map((u) => u.id),
      );
    }
    setSearchQuery("");
    setShowUserList(false);
  };

  const handleUserRemove = (userId: number) => {
    const newSelectedUsers = selectedUsers.filter((u) => u.id !== userId);
    setSelectedUsers(newSelectedUsers);
    form.setValue(
      "recipientIds",
      newSelectedUsers.map((u) => u.id),
    );
  };

  const filteredUsers = users.filter(
    (user) =>
      (user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        user.email.toLowerCase().includes(searchQuery.toLowerCase())) &&
      !selectedUsers.find((u) => u.id === user.id),
  );

  const handleClose = () => {
    form.reset();
    setSelectedUsers([]);
    setSearchQuery("");
    setShowUserList(false);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {mode === "reply" ? "Reply to Email" : "Forward Email"}
          </DialogTitle>
          <DialogDescription>
            {mode === "reply"
              ? "Send a reply to this email"
              : "Forward this email to other users"}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="recipientIds"
              render={() => (
                <FormItem>
                  <FormLabel>To</FormLabel>
                  <FormControl>
                    <div className="space-y-2">
                      <div className="flex flex-wrap gap-2 p-2 border rounded-md min-h-[42px]">
                        {selectedUsers.map((user) => (
                          <Badge
                            key={user.id}
                            variant="secondary"
                            className="gap-1"
                          >
                            {user.name}
                            <button
                              type="button"
                              onClick={() => handleUserRemove(user.id)}
                              className="ml-1 hover:text-destructive"
                            >
                              <X className="h-3 w-3" />
                            </button>
                          </Badge>
                        ))}
                        <div className="relative flex-1 min-w-[200px]">
                          <Input
                            value={searchQuery}
                            onChange={(e) => {
                              setSearchQuery(e.target.value);
                              setShowUserList(true);
                            }}
                            onFocus={() => setShowUserList(true)}
                            placeholder="Search users..."
                            className="border-0 p-0 h-auto focus-visible:ring-0 focus-visible:ring-offset-0"
                          />
                          {showUserList &&
                            searchQuery &&
                            filteredUsers.length > 0 && (
                              <div className="absolute top-full left-0 right-0 mt-1 bg-popover border rounded-md shadow-lg z-50 max-h-48 overflow-y-auto">
                                {filteredUsers.map((user) => (
                                  <button
                                    key={user.id}
                                    type="button"
                                    onClick={() => handleUserSelect(user)}
                                    className="w-full text-left px-3 py-2 hover:bg-muted transition-colors"
                                  >
                                    <div className="font-medium">
                                      {user.name}
                                    </div>
                                    <div className="text-sm text-muted-foreground">
                                      {user.email}
                                    </div>
                                  </button>
                                ))}
                              </div>
                            )}
                        </div>
                      </div>
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="subject"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Subject</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter subject" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="body"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Message</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Write your message..."
                      className="min-h-[300px] resize-none font-mono text-sm"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex justify-end gap-2 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={handleClose}
                disabled={form.formState.isSubmitting}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={form.formState.isSubmitting}
                className="gap-2"
              >
                {form.formState.isSubmitting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Sending...
                  </>
                ) : (
                  <>
                    <Send className="h-4 w-4" />
                    Send
                  </>
                )}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
