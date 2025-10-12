import { type Metadata } from "next";
import { RevisionsPageContent } from "./revisions-page-content";

export const metadata: Metadata = {
  title: "Revision History - Admin",
  description: "View and manage article revisions",
};

export default function RevisionsPage() {
  return <RevisionsPageContent />;
} 