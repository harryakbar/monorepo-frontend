import { format } from "date-fns";
import { Check, Copy, Share2, Users } from "lucide-react";
import { useState } from "react";
import type { Trip } from "../utils/storage";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "./ui/card";
import { Input } from "./ui/input";

interface InvitationLinkProps {
  trip: Trip;
  onRegenerate?: () => void;
}

export function InvitationLink({ trip, onRegenerate }: InvitationLinkProps) {
  const [copied, setCopied] = useState(false);

  if (!trip.invitationToken) return null;

  const invitationLink = `${window.location.origin}/invite/${trip.invitationToken}`;
  const isExpired =
    trip.invitationExpiresAt &&
    trip.invitationExpiresAt < new Date();

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(invitationLink);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy:", err);
    }
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `Join me planning a trip to ${trip.destination}`,
          text: `Let's plan a ${trip.days}-day trip together!`,
          url: invitationLink,
        });
      } catch (err) {
        // User cancelled or error
        console.error("Share failed:", err);
      }
    } else {
      // Fallback to copy
      copyToClipboard();
    }
  };

  return (
    <Card className="border-indigo-200 bg-gradient-to-br from-indigo-50 to-blue-50">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <Users className="w-5 h-5 text-indigo-600" />
          Invite People
        </CardTitle>
        <CardDescription>
          Share this link with friends to invite them to plan together
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-2">
          <Input
            value={invitationLink}
            readOnly
            className="font-mono text-sm bg-white"
          />
          <Button onClick={copyToClipboard} size="icon" variant="outline">
            {copied ? (
              <Check className="w-4 h-4 text-green-600" />
            ) : (
              <Copy className="w-4 h-4" />
            )}
          </Button>
          {typeof navigator.share === "function" && (
            <Button onClick={handleShare} size="icon" variant="outline">
              <Share2 className="w-4 h-4" />
            </Button>
          )}
        </div>

        {copied && (
          <div className="text-sm text-green-600 flex items-center gap-1">
            <Check className="w-4 h-4" />
            Link copied to clipboard!
          </div>
        )}

        <div className="flex items-center justify-between text-xs">
          <div className="flex items-center gap-2">
            <span className="text-muted-foreground">Status:</span>
            {isExpired ? (
              <Badge variant="destructive">Expired</Badge>
            ) : (
              <Badge variant="default" className="bg-green-600">
                Active
              </Badge>
            )}
          </div>
          {trip.invitationExpiresAt && (
            <span className="text-muted-foreground">
              Expires: {format(trip.invitationExpiresAt, "MMM d, yyyy")}
            </span>
          )}
        </div>

        {trip.groupTripData && (
          <div className="text-xs text-muted-foreground">
            {trip.groupTripData.members.length} member
            {trip.groupTripData.members.length !== 1 ? "s" : ""} joined
          </div>
        )}

        {onRegenerate && (
          <Button
            variant="outline"
            size="sm"
            onClick={onRegenerate}
            className="w-full"
          >
            Regenerate Link
          </Button>
        )}
      </CardContent>
    </Card>
  );
}


