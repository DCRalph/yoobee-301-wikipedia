// import { useState } from "react";
// import { Brain, RefreshCw, AlertCircle, X } from "lucide-react";
// import ReactMarkdown from "react-markdown";
// import { toast } from "sonner";
// import { api } from "~/trpc/react";
// import { handleTRPCMutation } from "~/lib/toast";
// import {
//   Dialog,
//   DialogContent,
//   DialogHeader,
//   DialogTitle,
//   DialogTrigger,
//   DialogFooter,
//   DialogClose,
// } from "~/components/ui/dialog";
// import {
//   AlertDialog,
//   AlertDialogCancel,
//   AlertDialogContent,
//   AlertDialogDescription,
//   AlertDialogFooter,
//   AlertDialogHeader,
//   AlertDialogTitle,
// } from "~/components/ui/alert-dialog";
// import { Button } from "~/components/ui/button";
// import { Card, CardContent } from "~/components/ui/card";
// import { Tabs, TabsContent, TabsList, TabsTrigger } from "~/components/ui/tabs";
// import { ScrollArea } from "~/components/ui/scroll-area";

// interface AISummaryDialogProps {
//   articleId: string;
// }

// export function AISummaryDialog({ articleId }: AISummaryDialogProps) {
//   const [summary, setSummary] = useState<string | null>(null);
//   const [isSummarizing, setIsSummarizing] = useState(false);
//   const [isSavingSummary, setIsSavingSummary] = useState(false);
//   const [isSavedSummary, setIsSavedSummary] = useState(false);
//   const [level, setLevel] = useState<"novice" | "intermediate" | "advanced">(
//     "intermediate",
//   );
//   const [isDialogOpen, setIsDialogOpen] = useState(false);
//   const [showConfirmation, setShowConfirmation] = useState(false);

//   const summarizeArticle = api.user.articles.summarize.useMutation({
//     onSuccess: (data) => {
//       setSummary(data.summary);
//       setIsSummarizing(false);
//       setIsSavedSummary(false);
//       toast.success("Summary generated successfully!");
//     },
//     onError: (error) => {
//       setIsSummarizing(false);
//       toast.error(`Failed to generate summary: ${error.message}`);
//     },
//   });

//   const saveSummary = api.user.articles.saveSummary.useMutation({
//     onError: () => {
//       setIsSavingSummary(false);
//     },
//   });

//   const handleSummarize = () => {
//     setIsSummarizing(true);
//     setIsSavedSummary(false);
//     summarizeArticle.mutate({
//       articleId,
//       level,
//     });
//   };

//   const handleSaveSummary = async () => {
//     if (!summary) return;

//     setIsSavingSummary(true);
//     const result = await handleTRPCMutation(
//       () =>
//         saveSummary.mutateAsync({
//           articleId,
//           summary,
//           level,
//         }),
//       "Summary saved successfully!",
//       "Failed to save summary!",
//     );
//     setIsSavingSummary(false);
//     if (result.result) {
//       setIsSavedSummary(true);
//     }
//   };

//   // Function to handle confirmed close
//   const handleConfirmedClose = () => {
//     setShowConfirmation(false);
//     setIsDialogOpen(false);
//     // Reset summary state
//     setSummary(null);
//     setIsSavedSummary(false);
//   };

//   return (
//     <>
//       {/* Main AI Summary Dialog */}
//       <Dialog
//         open={isDialogOpen}
//         onOpenChange={(open) => {
//           if (!open && summary && !isSavedSummary && !isSavingSummary) {
//             // Intercept the close action
//             setShowConfirmation(true);
//           } else if (!open) {
//             setIsDialogOpen(false);
//           } else {
//             setIsDialogOpen(open);
//           }
//         }}
//       >
//         <DialogTrigger asChild>
//           <Button
//             variant="outline"
//             size="sm"
//             onClick={() => setIsDialogOpen(true)}
//           >
//             <Brain className="mr-2 h-4 w-4" />
//             AI Summarize
//           </Button>
//         </DialogTrigger>
//         <DialogContent className="sm:max-w-lg">
//           <DialogHeader>
//             <DialogTitle className="flex items-center gap-2">
//               <Brain className="h-5 w-5" />
//               AI Article Summary
//             </DialogTitle>
//           </DialogHeader>

//           {isSummarizing ? (
//             <div className="flex flex-col items-center justify-center py-8">
//               <RefreshCw className="text-primary mb-4 h-8 w-8 animate-spin" />
//               <p className="text-muted-foreground">
//                 Generating your summary...
//               </p>
//             </div>
//           ) : summary ? (
//             <div className="space-y-6">
//               <Card className="border-primary/20">
//                 <CardContent className="pt-6">
//                   <ScrollArea className="max-h-[50vh] overflow-y-auto">
//                     <div className={`prose max-w-none`}>
//                       <ReactMarkdown>{summary}</ReactMarkdown>
//                     </div>
//                   </ScrollArea>
//                 </CardContent>
//               </Card>

//               <DialogFooter className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-between">
//                 <Button
//                   variant="outline"
//                   onClick={() => {
//                     setSummary(null);
//                     setIsSavedSummary(false);
//                   }}
//                 >
//                   Generate New Summary
//                 </Button>
//                 <Button
//                   onClick={handleSaveSummary}
//                   disabled={isSavingSummary || isSavedSummary}
//                 >
//                   {isSavingSummary ? (
//                     <>
//                       <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
//                       Saving...
//                     </>
//                   ) : isSavedSummary ? (
//                     <>Summary Saved</>
//                   ) : (
//                     <>Save Summary</>
//                   )}
//                 </Button>
//               </DialogFooter>
//             </div>
//           ) : (
//             <div className="space-y-6">
//               <p className="text-muted-foreground">
//                 Generate an AI-powered summary of this article customized to
//                 your knowledge level.
//               </p>

//               <Tabs
//                 defaultValue="intermediate"
//                 className="w-full"
//                 onValueChange={(value) =>
//                   setLevel(value as "novice" | "intermediate" | "advanced")
//                 }
//               >
//                 <TabsList className="grid w-full grid-cols-3">
//                   <TabsTrigger value="novice">Novice</TabsTrigger>
//                   <TabsTrigger value="intermediate">Intermediate</TabsTrigger>
//                   <TabsTrigger value="advanced">Advanced</TabsTrigger>
//                 </TabsList>
//                 <TabsContent
//                   value="novice"
//                   className="text-muted-foreground mt-3 text-sm"
//                 >
//                   Simple explanations using basic terminology, perfect for
//                   beginners.
//                 </TabsContent>
//                 <TabsContent
//                   value="intermediate"
//                   className="text-muted-foreground mt-3 text-sm"
//                 >
//                   Balanced complexity with some field-specific terminology.
//                 </TabsContent>
//                 <TabsContent
//                   value="advanced"
//                   className="text-muted-foreground mt-3 text-sm"
//                 >
//                   In-depth analysis using specialized terminology and concepts.
//                 </TabsContent>
//               </Tabs>

//               <div className="flex justify-center pt-2">
//                 <Button className="w-full sm:w-auto" onClick={handleSummarize}>
//                   <Brain className="mr-2 h-4 w-4" />
//                   Generate Summary
//                 </Button>
//               </div>
//             </div>
//           )}

//           <DialogClose
//             className="ring-offset-background focus:ring-ring data-[state=open]:bg-accent data-[state=open]:text-muted-foreground absolute top-4 right-4 rounded-sm opacity-70 transition-opacity hover:opacity-100 focus:ring-2 focus:ring-offset-2 focus:outline-none disabled:pointer-events-none"
//             onClick={(e) => {
//               if (summary && !isSavedSummary && !isSavingSummary) {
//                 e.preventDefault();
//                 setShowConfirmation(true);
//               }
//             }}
//           >
//             <X className="h-4 w-4" />
//             <span className="sr-only">Close</span>
//           </DialogClose>
//         </DialogContent>
//       </Dialog>

//       {/* Confirmation Alert Dialog */}
//       <AlertDialog open={showConfirmation} onOpenChange={setShowConfirmation}>
//         <AlertDialogContent>
//           <AlertDialogHeader>
//             <AlertDialogTitle className="flex items-center gap-2">
//               <AlertCircle className="h-5 w-5 text-red-600" />
//               Unsaved Summary
//             </AlertDialogTitle>
//             <AlertDialogDescription>
//               You have a generated summary that hasn&apos;t been saved. If you
//               close now, it will be lost forever.
//             </AlertDialogDescription>
//           </AlertDialogHeader>
//           <AlertDialogFooter>
//             <AlertDialogCancel
//               onClick={() => {
//                 setShowConfirmation(false);
//                 setIsDialogOpen(true);
//               }}
//             >
//               Cancel
//             </AlertDialogCancel>
//             {/* <AlertDialogAction asChild> */}
//             <Button variant="destructive" onClick={handleConfirmedClose}>
//               Close Without Saving
//             </Button>
//             {/* </AlertDialogAction> */}
//           </AlertDialogFooter>
//         </AlertDialogContent>
//       </AlertDialog>
//     </>
//   );
// }
