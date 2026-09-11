import { DailyClosingWorkflow } from "@/components/closing/daily-closing-workflow";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export const metadata = {
  title: "Daily Closing | DineFlow",
};

export default async function DailyClosingPage({ searchParams }: { searchParams: Promise<{ branchId?: string }> }) {
  const params = await searchParams;
  // In a real scenario, this branchId would come from context or selection
  const branchId = params?.branchId || "000000000000000000000000"; // Fallback dummy ID

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Daily Closing</h2>
          <p className="text-muted-foreground">Reconcile cash and finalize the business day.</p>
        </div>
      </div>
      
      {branchId !== "000000000000000000000000" ? (
         <DailyClosingWorkflow branchId={branchId} />
      ) : (
        <Card className="bg-amber-50 border-amber-200">
           <CardContent className="p-6 text-amber-800">
             Please select a branch to perform daily closing.
           </CardContent>
        </Card>
      )}
    </div>
  );
}
