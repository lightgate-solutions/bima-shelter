/** biome-ignore-all lint/suspicious/noArrayIndexKey: <> */
"use client";

import { Archive, Folder, LogIn, MoreVertical, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { usePathname } from "next/navigation";

export default function FoldersGrid({
  folders,
  department,
}: {
  folders: {
    id: number;
    name: string;
    path?: string;
    updatedAt: Date;
  }[];
  department: string;
}) {
  const pathname = usePathname();

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      <div className="bg-card border border-border rounded-lg overflow-hidden hover:shadow-lg transition-shadow">
        <div className={`h-24 flex items-center justify-center`}>
          <Folder size={56} className="text-slate-600" />
        </div>

        <div className="p-4">
          <h3 className="font-semibold text-foreground mb-1 truncate">
            All Documents
          </h3>
          <p className="text-sm text-muted-foreground mb-3">
            Last Modified: This week
          </p>

          <div className="flex gap-2">
            <Button variant="default" size="sm" className="w-full" asChild>
              <Link href={`/documents/all`} className="flex-1 ">
                <LogIn size={16} className="mr-1" />
                Enter
              </Link>
            </Button>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  className="px-2 bg-transparent"
                >
                  <MoreVertical size={16} />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem disabled>
                  <Archive size={16} className="mr-2" />
                  Archive
                </DropdownMenuItem>
                <DropdownMenuItem disabled className="text-red-600">
                  <Trash2 size={16} className="mr-2" />
                  Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>
      {folders.map((folder, idx) => (
        <div
          key={idx}
          className="bg-card border border-border rounded-lg overflow-hidden hover:shadow-lg transition-shadow"
        >
          <div className={`h-24 flex items-center justify-center`}>
            <Folder size={56} className="text-slate-600" />
          </div>

          <div className="p-4">
            <h3 className="font-semibold text-foreground mb-1 truncate">
              {(folder.path ?? folder.name).charAt(0).toUpperCase() +
                (folder.path ?? folder.name).slice(1)}
            </h3>
            <p className="text-sm text-muted-foreground mb-3">
              Last Modified: {folder.updatedAt.toLocaleDateString()}
            </p>

            <div className="flex gap-2">
              <Button variant="default" size="sm" className="w-full" asChild>
                <Link
                  href={
                    pathname === "/documents"
                      ? `${pathname}/f/${folder.id}`
                      : `${pathname}/${folder.id}`
                  }
                  className="flex-1 "
                >
                  <LogIn size={16} className="mr-1" />
                  Enter
                </Link>
              </Button>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    className="px-2 bg-transparent"
                  >
                    <MoreVertical size={16} />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem
                    disabled={
                      folder.name === department || folder.name === "personal"
                    }
                    className="hover:cursor-pointer"
                  >
                    <Archive size={16} className="mr-2" />
                    Archive
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    disabled={
                      folder.name === department || folder.name === "personal"
                    }
                    className="text-red-600 hover:cursor-pointer"
                  >
                    <Trash2 size={16} className="mr-2" />
                    Delete
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
