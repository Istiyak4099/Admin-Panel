"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { DashboardHeader } from "@/components/dashboard-header";
import { Button } from "@/components/ui/button";
import { 
    Dialog, 
    DialogContent, 
    DialogDescription, 
    DialogHeader, 
    DialogTitle, 
    DialogTrigger 
} from "@/components/ui/dialog";
import { Upload, Info, ImagePlus, ImageIcon } from "lucide-react";

export default function BannersPage() {
  return (
    <div className="flex flex-1 flex-col">
      <DashboardHeader title="Mobile App Banners" />
      <main className="flex-1 space-y-4 p-4 pt-6 md:p-8">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          <Card className="col-span-1 lg:col-span-2">
            <CardHeader>
              <CardTitle>Manage Banners</CardTitle>
              <CardDescription>
                Upload banners and graphics to Cloud Storage for use in the mobile app.
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col items-center justify-center py-12 border-2 border-dashed rounded-lg bg-muted/30">
                <ImagePlus className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">No custom banners uploaded</h3>
                <p className="text-sm text-muted-foreground mb-6 text-center max-w-xs">
                    Personalize your mobile app experience by uploading custom promotional banners.
                </p>
                <Dialog>
                    <DialogTrigger asChild>
                        <Button className="gap-2">
                            <Upload className="h-4 w-4" />
                            Upload Banner
                        </Button>
                    </DialogTrigger>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle className="flex items-center gap-2">
                                <Info className="h-5 w-5 text-primary" />
                                Paid Feature
                            </DialogTitle>
                            <DialogDescription className="pt-4 text-base">
                                You need to upgrade to the paid plan to upload media to Firestore Database Storage.
                            </DialogDescription>
                        </DialogHeader>
                    </DialogContent>
                </Dialog>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>Current Banner</CardTitle>
               <CardDescription>
                Preview of the active app banner.
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col items-center justify-center py-10 border border-dashed rounded-md bg-muted/20">
              <ImageIcon className="h-10 w-10 text-muted-foreground/30 mb-2" />
              <p className="text-sm text-muted-foreground font-medium">No Banner uploaded yet</p>
              <div className="mt-6 w-full p-3 bg-muted rounded-md text-center">
                  <p className="text-xs font-medium text-muted-foreground uppercase">Status</p>
                  <p className="text-sm font-bold text-primary">System Default Active</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
