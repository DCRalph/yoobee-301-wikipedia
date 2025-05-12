import { PendingReviewContent } from "./pending-review-content";

export const metadata = {
  title: "Your Pending Wiki Contributions",
  description:
    "View all your Wiki contributions that are currently under review",
};

export default function PendingPage() {
  return <PendingReviewContent />;
}
