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
import { Textarea } from "@/components/ui/textarea";

export default function SupportPage() {
  return (
    <div className="flex flex-1 flex-col">
      <DashboardHeader title="Support Information" />
      <main className="flex-1 space-y-4 p-4 pt-6 md:p-8">
        <Card>
          <CardHeader>
            <CardTitle>Contact & Support Details</CardTitle>
            <CardDescription>
              Update the contact and support information displayed to users in the mobile app.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="support-email">Support Email</Label>
              <Input id="support-email" defaultValue="support@emilocker.com" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="support-phone">Support Phone Number</Label>
              <Input id="support-phone" defaultValue="+1 (800) 555-LOCK" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="support-address">Mailing Address</Label>
              <Textarea id="support-address" defaultValue="123 Locker Lane, Secure City, ST 12345" />
            </div>
             <div className="space-y-2">
              <Label htmlFor="faq-url">FAQ Page URL</Label>
              <Input id="faq-url" defaultValue="https://emilocker.com/faq" />
            </div>
          </CardContent>
          <CardFooter className="border-t px-6 py-4">
            <Button>Save Changes</Button>
          </CardFooter>
        </Card>
      </main>
    </div>
  );
}
