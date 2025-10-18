export interface Document {
  id: string;
  title: string;
  fileName: string;
  fileType: string;
  fileSize: string;
  category: string;
  description: string;
  status: "published" | "draft";
  uploadedBy: string;
  uploadedById: string;
  uploadDate: string;
  sharedWith?: string[];
  department?: string;
  lastModified?: string;
  approvedBy?: string;
  approvedDate?: string;
  rejectedBy?: string;
  rejectedDate?: string;
  rejectionReason?: string;
}

export interface Employee {
  id: string;
  name: string;
  email: string;
  department: string;
  role: string;
  documentsCount: number;
  joinDate: string;
}

export const mockDocuments: Document[] = [
  {
    id: "1",
    title: "Q4 Financial Report",
    fileName: "Q4_Financial_Report.pdf",
    fileType: "PDF",
    fileSize: "2.4 MB",
    category: "Finance",
    description: "Quarterly financial report for Q4 2024",
    status: "draft",
    uploadedBy: "John Doe",
    uploadedById: "user1",
    uploadDate: "2025-10-01",
    department: "Finance",
    approvedBy: "Admin",
    approvedDate: "2025-10-02",
  },
  {
    id: "2",
    title: "Employee Handbook",
    fileName: "Employee_Handbook_2025.pdf",
    fileType: "PDF",
    fileSize: "1.8 MB",
    category: "HR",
    description: "Updated employee handbook for 2025",
    status: "published",
    uploadedBy: "Jane Smith",
    uploadedById: "user2",
    uploadDate: "2025-10-10",
    department: "HR",
  },
  {
    id: "3",
    title: "Marketing Strategy",
    fileName: "Marketing_Strategy_2025.docx",
    fileType: "DOCX",
    fileSize: "856 KB",
    category: "Marketing",
    description: "Marketing strategy and roadmap for 2025",
    status: "draft",
    uploadedBy: "Mike Johnson",
    uploadedById: "user3",
    uploadDate: "2025-10-08",
    department: "Marketing",
    rejectedBy: "Admin",
    rejectedDate: "2025-10-09",
    rejectionReason: "Needs more detailed budget breakdown",
  },
  {
    id: "4",
    title: "Legal Contract Template",
    fileName: "Contract_Template_v2.pdf",
    fileType: "PDF",
    fileSize: "645 KB",
    category: "Legal",
    description: "Standard contract template for vendors",
    status: "draft",
    uploadedBy: "Sarah Williams",
    uploadedById: "user4",
    uploadDate: "2025-09-28",
    department: "Legal",
    sharedWith: ["user1", "user2"],
    approvedBy: "Admin",
    approvedDate: "2025-09-29",
  },
  {
    id: "5",
    title: "Engineering Roadmap",
    fileName: "Engineering_Roadmap_Q1.xlsx",
    fileType: "XLSX",
    fileSize: "1.2 MB",
    category: "Engineering",
    description: "Q1 engineering roadmap and milestones",
    status: "published",
    uploadedBy: "David Brown",
    uploadedById: "user5",
    uploadDate: "2025-10-11",
    department: "Engineering",
  },
];

// Mock employees data
export const mockEmployees: Employee[] = [
  {
    id: "user1",
    name: "John Doe",
    email: "john.doe@company.com",
    department: "Finance",
    role: "Financial Analyst",
    documentsCount: 12,
    joinDate: "2023-01-15",
  },
  {
    id: "user2",
    name: "Jane Smith",
    email: "jane.smith@company.com",
    department: "HR",
    role: "HR Manager",
    documentsCount: 8,
    joinDate: "2022-06-20",
  },
  {
    id: "user3",
    name: "Mike Johnson",
    email: "mike.johnson@company.com",
    department: "Marketing",
    role: "Marketing Director",
    documentsCount: 15,
    joinDate: "2021-03-10",
  },
  {
    id: "user4",
    name: "Sarah Williams",
    email: "sarah.williams@company.com",
    department: "Legal",
    role: "Legal Counsel",
    documentsCount: 6,
    joinDate: "2023-08-05",
  },
  {
    id: "user5",
    name: "David Brown",
    email: "david.brown@company.com",
    department: "Engineering",
    role: "Engineering Lead",
    documentsCount: 20,
    joinDate: "2020-11-12",
  },
];
