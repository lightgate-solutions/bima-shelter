import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { mockDocuments, type Document } from "./mock-data";
import { useState } from "react";
import { Badge } from "../ui/badge";
import { Ellipsis } from "lucide-react";

export default function DocumentsTable() {
  const [documents, _setDocuments] = useState(mockDocuments);

  const getStatusBadge = (status: Document["status"]) => {
    const variants = {
      draft: "secondary",
      published: "default",
    } as const;

    return (
      <Badge variant={variants[status]} className="capitalize">
        {status}
      </Badge>
    );
  };
  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Title</TableHead>
            <TableHead>Uploader</TableHead>
            <TableHead>Department</TableHead>
            <TableHead>Category</TableHead>
            <TableHead>Upload Date</TableHead>
            <TableHead>Status</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {documents.map((doc) => (
            <TableRow key={doc.id}>
              <TableCell className="font-medium">{doc.title}</TableCell>
              <TableCell>{doc.uploadedBy}</TableCell>
              <TableCell>{doc.department}</TableCell>
              <TableCell>{doc.category}</TableCell>
              <TableCell>
                {new Date(doc.uploadDate).toLocaleDateString()}
              </TableCell>
              <TableCell>{getStatusBadge(doc.status)}</TableCell>
              <TableCell>
                <Ellipsis className="w-6 h-6 font-extralight hover:cursor-pointer" />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
