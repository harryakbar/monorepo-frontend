import { addDays } from "date-fns";
import { Users } from "lucide-react";
import { useState } from "react";
import { generateInvitationToken, type Trip } from "../utils/storage";
import { InvitationLink } from "./InvitationLink";
import { Button } from "./ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "./ui/dialog";
import { Input } from "./ui/input";
import { Label } from "./ui/label";

interface GroupTripCreationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreate: (trip: Trip) => void;
  currentUserEmail?: string;
  currentUserName?: string;
}

export function GroupTripCreationDialog({
  open,
  onOpenChange,
  onCreate,
  currentUserEmail = "you@example.com",
  currentUserName = "You",
}: GroupTripCreationDialogProps) {
  const [destination, setDestination] = useState("");
  const [days, setDays] = useState(5);
  const [notes, setNotes] = useState("");
  const [createdTrip, setCreatedTrip] = useState<Trip | null>(null);

  const handleCreate = () => {
    if (destination.trim() && days > 0) {
      const invitationToken = generateInvitationToken();
      const invitationExpiresAt = addDays(new Date(), 7);

      const newTrip: Trip = {
        id: Date.now().toString(),
        destination: destination.trim(),
        days,
        notes: notes.trim() || undefined,
        startDate: null,
        endDate: null,
        type: "group",
        invitationToken,
        invitationExpiresAt,
        groupTripData: {
          members: [
            {
              userId: "current-user",
              email: currentUserEmail,
              displayName: currentUserName,
              role: "owner",
              joinedAt: new Date(),
            },
          ],
          createdBy: "current-user",
          createdAt: new Date(),
          suggestedDates: [],
          comments: [],
          status: "planning",
        },
      };

      setCreatedTrip(newTrip);
      onCreate(newTrip);
      // Don't close - show invitation link
    }
  };

  const handleClose = () => {
    setDestination("");
    setDays(5);
    setNotes("");
    setCreatedTrip(null);
    onOpenChange(false);
  };

  const handleDone = () => {
    handleClose();
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        {!createdTrip ? (
          <>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Users className="w-5 h-5" />
                Plan Group Trip
              </DialogTitle>
              <DialogDescription>
                Create a trip that multiple people can plan together
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-6 py-4">
              {/* Destination */}
              <div className="space-y-2">
                <Label htmlFor="destination">Destination</Label>
                <Input
                  id="destination"
                  placeholder="e.g., Bangkok, Thailand"
                  value={destination}
                  onChange={(e) => setDestination(e.target.value)}
                  className="text-lg"
                />
              </div>

              {/* Duration */}
              <div className="space-y-2">
                <Label htmlFor="days">Duration (days)</Label>
                <Input
                  id="days"
                  type="number"
                  min="1"
                  max="30"
                  value={days}
                  onChange={(e) => setDays(parseInt(e.target.value) || 5)}
                  className="max-w-xs"
                />
              </div>

              {/* Notes */}
              <div className="space-y-2">
                <Label htmlFor="notes">Notes (optional)</Label>
                <textarea
                  id="notes"
                  placeholder="Add any notes about this group trip..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={3}
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 resize-none"
                />
              </div>
            </div>

            <div className="flex justify-end gap-3">
              <Button variant="outline" onClick={handleClose}>
                Cancel
              </Button>
              <Button
                onClick={handleCreate}
                disabled={!destination.trim() || days < 1}
              >
                Create Group Trip
              </Button>
            </div>
          </>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Users className="w-5 h-5" />
                Group Trip Created!
              </DialogTitle>
              <DialogDescription>
                Share the invitation link below with friends
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4">
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <div className="font-semibold text-green-900">
                  {createdTrip.destination} • {createdTrip.days} days
                </div>
                {createdTrip.notes && (
                  <div className="text-sm text-green-700 mt-1">
                    {createdTrip.notes}
                  </div>
                )}
              </div>

              <InvitationLink trip={createdTrip} />

              <div className="text-sm text-muted-foreground space-y-1">
                <p>
                  • Share this link via WhatsApp, Email, or any messaging app
                </p>
                <p>• Friends will sign in with Google and join automatically</p>
                <p>• Link expires in 7 days</p>
              </div>
            </div>

            <div className="flex justify-end">
              <Button onClick={handleDone}>Done</Button>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
