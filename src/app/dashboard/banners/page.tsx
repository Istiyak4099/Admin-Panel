import Image from "next/image";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { DashboardHeader } from "@/components/dashboard-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Upload } from "lucide-react";

export default function BannersPage() {
  return (
    <div className="flex flex-1 flex-col">
      <DashboardHeader title="Mobile App Banners" />
      <main className="flex-1 space-y-4 p-4 pt-6 md:p-8">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          <Card className="col-span-1 lg:col-span-2">
            <CardHeader>
              <CardTitle>Upload New Banner</CardTitle>
              <CardDescription>
                Upload banners and graphics to Cloud Storage for use in the mobile app.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid w-full max-w-sm items-center gap-1.5">
                <Label htmlFor="picture">Banner Image</Label>
                <div className="flex items-center gap-2">
                  <Input id="picture" type="file" className="flex-1"/>
                  <Button size="icon" className="h-10 w-10">
                    <Upload className="h-4 w-4" />
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground">PNG, JPG, GIF up to 5MB.</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Current Banner</CardTitle>
               <CardDescription>
                This is the active banner in the app.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="relative aspect-video w-full">
                <Image
                  src="https://placehold.co/600x337.png"
                  alt="Current app banner"
                  fill
                  className="rounded-md object-cover"
                  data-ai-hint="promotional banner"
                />
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
