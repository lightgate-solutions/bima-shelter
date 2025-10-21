/** biome-ignore-all lint/suspicious/noArrayIndexKey: <> */
// biome-ignore-all lint/style/noNonNullAssertion: <>
"use client";

import {
  Archive,
  ArchiveIcon,
  Calendar,
  CheckCircle,
  Clock,
  Download,
  Edit,
  Edit2,
  Eye,
  FileIcon,
  ImagePlay,
  MoreHorizontalIcon,
  MoreVertical,
  Pencil,
  Settings,
  Share,
  Shield,
  Trash2,
  Trash2Icon,
  User,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { usePathname, useRouter } from "next/navigation";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { ButtonGroup } from "@/components/ui/button-group";
import {
  archiveDocumentAction,
  deleteDocumentAction,
  type getActiveFolderDocuments,
} from "@/actions/documents/documents";
import { Label } from "../ui/label";
import { Separator } from "../ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../ui/card";
import { Badge } from "../ui/badge";
import Link from "next/link";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "../ui/dialog";
import { Dropzone, type FileWithMetadata } from "../ui/dropzone";
import { useState } from "react";
import { uploadNewDocumentVersion } from "@/actions/documents/upload";
import { Spinner } from "../ui/spinner";
import { Progress } from "../ui/progress";

type DocumentType = NonNullable<
  Awaited<ReturnType<typeof getActiveFolderDocuments>>["success"]
>["docs"][number];

export default function DocumentsGrid({
  documents,
}: {
  documents: DocumentType[];
}) {
  const pathname = usePathname();

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      {documents.map((doc, idx) => (
        <div
          key={idx}
          className="bg-card border border-border rounded-lg overflow-hidden hover:shadow-lg transition-shadow"
        >
          <div className={`h-24 flex items-center justify-center`}>
            <FileIcon size={56} className="text-green-600" />
          </div>

          <div className="p-4">
            <h3 className="font-semibold text-foreground mb-1 truncate">
              {doc.title.charAt(0).toUpperCase() + doc.title.slice(1)}
            </h3>
            <p className="text-sm text-muted-foreground mb-3">
              Last Modified: {doc.updatedAt.toLocaleDateString()}
            </p>

            <div className="flex gap-2">
              <DocumentSheet doc={doc} pathname={pathname} />

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
                <DropdownMenuContent align="end" className="space-y-1">
                  <DropdownMenuItem className="hover:cursor-pointer " asChild>
                    <DocumentsActions
                      type="archive"
                      id={doc.id}
                      pathname={pathname}
                    />
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    className="text-red-600 hover:cursor-pointer"
                    asChild
                  >
                    <DocumentsActions
                      type="delete"
                      id={doc.id}
                      pathname={pathname}
                    />
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

function DocumentSheet({
  doc,
  pathname,
}: {
  doc: DocumentType;
  pathname: string;
}) {
  const [files, setFiles] = useState<FileWithMetadata[]>();
  const [progress, setProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const router = useRouter();

  const uploadFile = async (file: File): Promise<string | null | undefined> => {
    setFiles((prevFiles) =>
      prevFiles?.map((f) => (f.file === file ? { ...f, uploading: true } : f)),
    );

    setProgress(30);
    try {
      const endpoint = "/api/r2/upload";
      const presignedResponse = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          filename: file.name,
          contentType: file.type,
          size: file.size,
        }),
      });

      setProgress(40);
      if (!presignedResponse.ok) {
        toast.error("Failed to get presigned URL");
        setFiles((prevFiles) =>
          prevFiles?.map((f) =>
            f.file === file
              ? { ...f, uploading: false, progress: 0, error: true }
              : f,
          ),
        );
        return null;
      }

      setProgress(50);
      const { presignedUrl, key, publicUrl } = await presignedResponse.json();

      await new Promise<void>((resolve, reject) => {
        const xhr = new XMLHttpRequest();

        setProgress(70);
        xhr.upload.onprogress = (event) => {
          if (event.lengthComputable) {
            const percentComplete = (event.loaded / event.total) * 100;
            setFiles((prevFiles) =>
              prevFiles?.map((f) =>
                f.file === file
                  ? {
                      ...f,
                      progress: Math.round(percentComplete),
                      key: key,
                      publicUrl: publicUrl,
                    }
                  : f,
              ),
            );
          }
        };

        setProgress(90);
        xhr.onload = () => {
          if (xhr.status === 200 || xhr.status === 204) {
            setFiles((prevFiles) =>
              prevFiles?.map((f) =>
                f.file === file
                  ? { ...f, progress: 100, uploading: false, error: false }
                  : f,
              ),
            );
            resolve();
          } else {
            reject(new Error(`Upload failed with status: ${xhr.status}`));
          }
        };

        xhr.onerror = () => {
          reject(new Error("Upload failed"));
        };

        xhr.open("PUT", presignedUrl);
        xhr.setRequestHeader("Content-Type", file.type);
        xhr.send(file);
      });
      setProgress(100);
      const url = process.env.CLOUDFLARE_R2_PUBLIC_URL!;
      return publicUrl ?? `${url}/${encodeURIComponent(key)}`;
    } catch (error) {
      console.error(error);
      toast.error("Upload failed");
      setFiles((prevFiles) =>
        prevFiles?.map((f) =>
          f.file === file
            ? { ...f, uploading: false, progress: 0, error: true }
            : f,
        ),
      );
      return null;
    }
  };

  async function onSubmit() {
    setIsUploading(true);
    setProgress(0);

    try {
      if (!files || files?.length <= 0) {
        toast.error("No file selected");
        return;
      }

      setProgress(10);

      setProgress(20);
      const url = await uploadFile(files[0].file);
      if (!url) throw new Error("File upload failed. No URL returned.");
      const fileSizeMB = (files[0].file.size / (1024 * 1024)).toFixed(2);

      const res = await uploadNewDocumentVersion({
        id: doc.id,
        newVersionNumber: doc.currentVersion + 1,
        url: url,
        fileSize: fileSizeMB,
        mimeType: files[0].file.type,
        pathname,
      });
      if (res.success) {
        toast.success("New file version uploaded succesfully");
        router.refresh();
      } else {
        toast.error(res.error?.reason);
      }
    } catch (_error) {
      toast.error("Upload failed. Try again!");
    } finally {
      setIsUploading(false);
    }
  }

  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button
          variant="outline"
          className="flex flex-1 w-full gap-3 hover:cursor-pointer"
        >
          <Eye size={16} />
          Open
        </Button>
      </SheetTrigger>
      <SheetContent className="min-w-3xl 2xl:min-w-4xl">
        <SheetHeader className="space-y-6">
          <div className="flex flex-row gap-3">
            <div className="bg-muted p-4 rounded-xl">
              <FileIcon size={40} />
            </div>
            <div>
              <SheetTitle>
                {doc.title.charAt(0).toUpperCase() + doc.title.slice(1)}
              </SheetTitle>
              <SheetDescription>
                {doc.description ?? "No description available"}
              </SheetDescription>
              <div className="text-muted-foreground text-sm">
                {doc.fileSize} MB • Modified{" "}
                {doc.updatedAt.toLocaleDateString()}
              </div>
            </div>
          </div>

          <div>
            <ButtonGroup>
              <ButtonGroup>
                <Link
                  target="_blank"
                  href={doc.filePath ?? ""}
                  className="hover:cursor-pointer"
                >
                  <Button variant="outline">
                    <Download />
                    Download
                  </Button>
                </Link>
              </ButtonGroup>
              <ButtonGroup>
                <Button variant="outline">
                  <Share />
                  Share
                </Button>
              </ButtonGroup>
              <ButtonGroup>
                <Dialog>
                  <DialogTrigger asChild>
                    <Button>
                      <Edit2 />
                      New Version
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle></DialogTitle>
                    </DialogHeader>
                    <form
                      onSubmit={(e) => {
                        e.preventDefault();
                        onSubmit();
                      }}
                      className="space-y-6"
                    >
                      <Dropzone
                        provider="cloudflare-r2"
                        variant="compact"
                        maxFiles={10}
                        maxSize={1024 * 1024 * 50} // 50MB
                        onFilesChange={(files) => setFiles(files)}
                      />
                      <Button type="submit" disabled={isUploading}>
                        {isUploading && <Spinner />}
                        {!isUploading ? "Submit" : "Uploading..."}
                      </Button>
                      {isUploading && (
                        <div className="space-y-2">
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-muted-foreground">
                              {progress < 100
                                ? "Uploading document.pdf..."
                                : "Upload complete!"}
                            </span>
                            <span className="font-medium">{progress}%</span>
                          </div>
                          <Progress value={progress} className="w-full" />
                          <div className="flex items-center justify-between text-xs text-muted-foreground">
                            {progress > 100 && (
                              <CheckCircle className="h-4 w-4 text-green-500" />
                            )}
                          </div>
                        </div>
                      )}
                    </form>
                  </DialogContent>
                </Dialog>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="outline"
                      size="icon"
                      aria-label="More Options"
                    >
                      <MoreHorizontalIcon />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-52">
                    <DropdownMenuGroup>
                      <DropdownMenuItem>
                        <Edit />
                        Edit
                      </DropdownMenuItem>
                      <DropdownMenuItem>
                        <ArchiveIcon />
                        Archive
                      </DropdownMenuItem>
                    </DropdownMenuGroup>
                    <DropdownMenuSeparator />
                    <DropdownMenuGroup>
                      <DropdownMenuItem variant="destructive">
                        <Trash2Icon />
                        Trash
                      </DropdownMenuItem>
                    </DropdownMenuGroup>
                  </DropdownMenuContent>
                </DropdownMenu>
              </ButtonGroup>
            </ButtonGroup>
          </div>
        </SheetHeader>

        <Separator />

        <div className="flex px-4 overflow-y-auto w-full flex-col gap-6">
          <Tabs defaultValue="overview">
            <TabsList>
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="history">History</TabsTrigger>
              <TabsTrigger value="comment">Comments</TabsTrigger>
            </TabsList>

            <TabsContent value="overview">
              <Card>
                <CardHeader>
                  <CardTitle>Document Information</CardTitle>
                </CardHeader>
                <CardContent className="">
                  <div className="grid grid-cols-2">
                    <div className=" flex flex-col gap-2">
                      <div className="flex gap-3 ">
                        <div className="flex text-muted-foreground justify-center items-center">
                          <Calendar size={18} />
                        </div>
                        <div className="flex flex-col">
                          <span>Created</span>
                          <span className="text-sm text-muted-foreground">
                            {doc.createdAt.toLocaleDateString()}
                          </span>
                        </div>
                      </div>

                      <div className="flex gap-3 ">
                        <div className="flex text-muted-foreground justify-center items-center">
                          <Clock size={18} />
                        </div>
                        <div className="flex flex-col ">
                          <span>Last Modified</span>
                          <span className="text-sm text-muted-foreground">
                            {doc.updatedAt.toLocaleDateString()}
                          </span>
                        </div>
                      </div>

                      <div className="flex gap-3 ">
                        <div className="flex text-muted-foreground justify-center items-center">
                          <User size={18} />
                        </div>
                        <div className="flex flex-col ">
                          <span>Owner</span>
                          <span className="text-sm text-muted-foreground">
                            {doc.uploader}
                          </span>
                        </div>
                      </div>

                      <div className="flex gap-3 ">
                        <div className="flex text-muted-foreground justify-center items-center">
                          <Settings size={18} />
                        </div>
                        <div className="flex flex-col ">
                          <span>Version</span>
                          <span className="text-sm text-muted-foreground">
                            V{doc.currentVersion}
                          </span>
                        </div>
                      </div>

                      <div className="flex gap-3 ">
                        <div className="flex text-muted-foreground justify-center items-center">
                          <ImagePlay size={18} />
                        </div>
                        <div className="flex flex-col ">
                          <span>Document Type</span>
                          <span className="text-sm text-muted-foreground">
                            {doc.mimeType}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className=" flex flex-col gap-4">
                      <div>
                        <div>Tags</div>
                        <div className="flex gap-3">
                          {doc.tags.map((tag, idx) => (
                            <div
                              key={idx}
                              className="rounded-full bg-teal-200 p-1 px-3"
                            >
                              {tag}
                            </div>
                          ))}
                        </div>
                      </div>

                      <div>
                        <div>Permissions</div>
                        {doc.accessRules.map((rule, i) => (
                          <div
                            key={i}
                            className="flex items-center justify-between py-2"
                          >
                            <span className="backdrop-blur-2xl p-2 bg-muted">
                              User can:
                            </span>
                            {rule.accessLevel === "manage" && (
                              <Badge className="bg-purple-100 text-purple-700">
                                <Shield className="w-3 h-3 mr-1" /> Manage
                              </Badge>
                            )}
                            {rule.accessLevel === "edit" && (
                              <Badge className="bg-blue-100 text-blue-700">
                                <Pencil className="w-3 h-3 mr-1" /> Edit
                              </Badge>
                            )}
                            {rule.accessLevel === "view" && (
                              <Badge className="bg-green-100 text-green-700">
                                <Eye className="w-3 h-3 mr-1" /> View
                              </Badge>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="history">
              <Card>
                <CardHeader>
                  <CardTitle>Password</CardTitle>
                  <CardDescription>
                    Change your password here. After saving, you&apos;ll be
                    logged out.
                  </CardDescription>
                </CardHeader>
                <CardContent className="grid gap-6">
                  <div className="grid gap-3">
                    <Label htmlFor="tabs-demo-current">Current password</Label>
                  </div>
                  <div className="grid gap-3">
                    <Label htmlFor="tabs-demo-new">New password</Label>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="comment">
              <Card>
                <CardHeader>
                  <CardTitle>Password</CardTitle>
                  <CardDescription>
                    Change your password here. After saving, you&apos;ll be
                    logged out.
                  </CardDescription>
                </CardHeader>
                <CardContent className="grid gap-6">
                  <div className="grid gap-3">
                    <Label htmlFor="tabs-demo-current">Current password</Label>
                  </div>
                  <div className="grid gap-3">
                    <Label htmlFor="tabs-demo-new">New password</Label>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </SheetContent>
    </Sheet>
  );
}

function DocumentsActions({
  id,
  pathname,
  type,
}: {
  id: number;
  pathname: string;
  type: "delete" | "archive";
}) {
  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        {type === "delete" ? (
          <Button
            className="flex w-full gap-3 hover:cursor-pointer"
            variant="secondary"
          >
            <Trash2 className="mr-2" size={16} />
            Delete
          </Button>
        ) : (
          <Button
            variant="outline"
            className="flex w-full gap-3 hover:cursor-pointer"
          >
            <Archive className="mr-2" size={16} />
            Archive
          </Button>
        )}
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
          {type === "delete" ? (
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the
              file and all its data from our servers.
            </AlertDialogDescription>
          ) : (
            <AlertDialogDescription>
              This action cannot be undone. This will archive the file move all
              its content to the archive page.
            </AlertDialogDescription>
          )}
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          {type === "delete" ? (
            <AlertDialogAction
              onClick={async () => {
                const res = await deleteDocumentAction(id, pathname);
                if (res.error) {
                  toast.error(res.error.reason);
                } else {
                  toast.error(res.success.reason);
                }
              }}
            >
              Continue
            </AlertDialogAction>
          ) : (
            <AlertDialogAction
              onClick={async () => {
                const res = await archiveDocumentAction(id, pathname);
                if (res.error) {
                  toast.error(res.error.reason);
                } else {
                  toast.error(res.success.reason);
                }
              }}
            >
              Continue
            </AlertDialogAction>
          )}
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
