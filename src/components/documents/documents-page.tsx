"use client";

import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Filter } from "lucide-react";
import { useState } from "react";
import DocumentsTable from "./documents-table";
import { Dialog } from "../ui/dialog";
import UploadDocumentButton from "./upload-document-button";

export function DocumentsPage({
  usersFolders,
  department,
}: {
  usersFolders: { name: string }[];
  department: string;
}) {
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");

  return (
    <div className="flex w-full flex-col gap-6">
      <div className="w-full flex justify-between pt-2">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">
            All Documents
          </h1>
          <p className="text-muted-foreground">
            Review and manage all documents across the organization
          </p>
        </div>

        <Dialog>
          <UploadDocumentButton
            usersFolders={usersFolders}
            department={department}
          />
        </Dialog>
      </div>

      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1">
          <Input
            placeholder="Search by title or uploader..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-full sm:w-[180px]">
            <Filter className="h-4 w-4 mr-2" />
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="draft">Draft</SelectItem>
            <SelectItem value="published">Published</SelectItem>
          </SelectContent>
        </Select>
        <Select value={categoryFilter} onValueChange={setCategoryFilter}>
          <SelectTrigger className="w-full sm:w-[180px]">
            <SelectValue placeholder="Category" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Categories</SelectItem>
            <SelectItem value="Finance">Finance</SelectItem>
            <SelectItem value="HR">HR</SelectItem>
            <SelectItem value="Legal">Legal</SelectItem>
            <SelectItem value="Marketing">Marketing</SelectItem>
            <SelectItem value="Engineering">Engineering</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Tabs defaultValue="all">
        <TabsList className="gap-2">
          <TabsTrigger
            value="all"
            className="hover:cursor-pointer hover:bg-primary-foreground"
          >
            All Documents
          </TabsTrigger>
          <TabsTrigger
            value="personal"
            className="hover:cursor-pointer hover:bg-primary-foreground"
          >
            Personal
          </TabsTrigger>
        </TabsList>

        <TabsContent value="all">
          <DocumentsTable />
        </TabsContent>

        <TabsContent value="personal">
          <DocumentsTable />
        </TabsContent>
      </Tabs>
    </div>
  );
}
