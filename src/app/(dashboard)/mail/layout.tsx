/** biome-ignore-all lint/correctness/useExhaustiveDependencies: <> */
"use client";

import { useEffect, useMemo, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Pencil, RefreshCw, Reply, Forward } from "lucide-react";
import { Button } from "@/components/ui/button";
import { MailSearch } from "@/components/mail/mail-search";
import { InboxWrapper } from "@/components/mail/inbox-wrapper";
import { getEmailById, getEmailStats } from "@/actions/mail/email";
import { getAllEmployees } from "@/actions/hr/employees";

type Folder = "inbox" | "sent" | "archive" | "trash";

interface User {
  id: number;
  name: string;
  email: string;
  role: string;
  department: string | null;
}

interface Stats {
  unreadCount: number;
  inboxCount: number;
  archivedCount: number;
  sentCount: number;
  trashCount: number;
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [users, setUsers] = useState<User[]>([]);
  const [_stats, setStats] = useState<Stats>({
    unreadCount: 0,
    inboxCount: 0,
    archivedCount: 0,
    sentCount: 0,
    trashCount: 0,
  });
  const [selectedEmail, setSelectedEmail] = useState<{
    id: number;
    subject: string;
    body: string;
    senderName: string;
    senderId: number;
    senderEmail: string;
    createdAt: Date;
  } | null>(null);

  const _currentFolder: Folder = useMemo(() => {
    const path = pathname || "";
    if (path.includes("/mail/sent")) return "sent";
    if (path.includes("/mail/archive")) return "archive";
    if (path.includes("/mail/trash")) return "trash";
    return "inbox";
  }, [pathname]);

  const emailId = searchParams.get("id");

  // Fetch sidebar stats and users once and refresh when route changes
  useEffect(() => {
    let mounted = true;

    const load = async () => {
      const [statsRes, usersRes] = await Promise.all([
        getEmailStats(),
        getAllEmployees(),
      ]);

      if (!mounted) return;

      if (statsRes.success && statsRes.data) {
        setStats(statsRes.data);
      }
      setUsers(usersRes);
    };

    load();
    return () => {
      mounted = false;
    };
  }, [pathname]);

  // Fetch selected email for global reply/forward dialog support
  useEffect(() => {
    let mounted = true;

    const loadSelected = async () => {
      if (!emailId) {
        if (mounted) setSelectedEmail(null);
        return;
      }
      const res = await getEmailById(Number(emailId));
      if (!mounted) return;

      if (res.success && res.data) {
        setSelectedEmail({
          id: res.data.id,
          subject: res.data.subject,
          body: res.data.body,
          senderId: res.data.senderId,
          senderName: res.data.senderName,
          senderEmail: res.data.senderEmail,
          createdAt: res.data.createdAt,
        });
      } else {
        setSelectedEmail(null);
      }
    };

    loadSelected();
    return () => {
      mounted = false;
    };
  }, [emailId]);

  const triggerCompose = () => {
    document.querySelector<HTMLElement>("[data-compose-trigger]")?.click();
  };

  const triggerReply = () => {
    document.querySelector<HTMLElement>("[data-reply-trigger]")?.click();
  };

  const triggerForward = () => {
    document.querySelector<HTMLElement>("[data-forward-trigger]")?.click();
  };

  const handleRefresh = () => {
    router.refresh();
  };

  const handleSearchResultClick = (id: string, folder: string) => {
    if (folder === "inbox") {
      router.push(`/mail/inbox?id=${id}`);
    } else {
      router.push(`/mail/${folder}?id=${id}`);
    }
  };

  return (
    <div className="flex h-full w-full relative gap-4">
      <div className="flex-1 min-w-0 sticky top-0 rounded-lg border bg-background">
        <div className="rounded-t-lg border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
          <div className="flex flex-col gap-2 p-3">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="gap-2"
                  onClick={handleRefresh}
                >
                  <RefreshCw className="h-4 w-4" />
                  Refresh
                </Button>

                {selectedEmail && (
                  <div className="hidden sm:flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="gap-2"
                      onClick={triggerReply}
                    >
                      <Reply className="h-4 w-4" />
                      Reply
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="gap-2"
                      onClick={triggerForward}
                    >
                      <Forward className="h-4 w-4" />
                      Forward
                    </Button>
                  </div>
                )}
              </div>

              <div className="flex items-center gap-2">
                <Button className="gap-2" onClick={triggerCompose}>
                  <Pencil className="h-4 w-4" />
                  Compose
                </Button>
              </div>
            </div>

            {/* Global search */}
            <div className="pt-1">
              <MailSearch onResultClick={handleSearchResultClick} />
            </div>
          </div>
        </div>

        <InboxWrapper users={users} selectedEmail={selectedEmail}>
          <div className="relative">{children}</div>
        </InboxWrapper>
      </div>
    </div>
  );
}
