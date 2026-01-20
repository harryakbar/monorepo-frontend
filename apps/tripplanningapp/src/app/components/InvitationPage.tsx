import { useState, useEffect } from "react";
import { format } from "date-fns";
import { Plane, Users, Loader2, AlertCircle } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "./ui/card";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { Alert, AlertDescription, AlertTitle } from "./ui/alert";
import { findTripByInvitationToken, type Trip } from "../utils/storage";
import { loadFromStorage } from "../utils/storage";

interface InvitationPageProps {
  token: string;
  onJoin: (trip: Trip) => void;
}

export function InvitationPage({ token, onJoin }: InvitationPageProps) {
  const [trip, setTrip] = useState<Trip | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Load trips from storage
    const stored = loadFromStorage();
    if (!stored) {
      setError("No trips found");
      setLoading(false);
      return;
    }

    // Find trip by invitation token
    const foundTrip = findTripByInvitationToken(stored.trips, token);

    if (!foundTrip) {
      setError("Invalid or expired invitation link");
      setLoading(false);
      return;
    }

    // Check if expired
    if (
      foundTrip.invitationExpiresAt &&
      foundTrip.invitationExpiresAt < new Date()
    ) {
      setError("This invitation link has expired");
      setLoading(false);
      return;
    }

    setTrip(foundTrip);
    setLoading(false);
  }, [token]);

  const handleGoogleSignIn = () => {
    // Store invitation token for after OAuth
    sessionStorage.setItem("pendingInvitation", token);

    // In a real app, this would redirect to Google OAuth
    // For now, we'll simulate it by calling onJoin directly
    // In production: window.location.href = `/auth/google?redirect=/invite/${token}`;

    // Simulate OAuth callback - in real app this happens after OAuth
    if (trip) {
      // For demo: auto-join without OAuth
      onJoin(trip);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-indigo-600 mx-auto mb-4" />
          <p className="text-gray-600">Loading invitation...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-red-600">
              <AlertCircle className="w-5 h-5" />
              Invalid Invitation
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
            <Button
              variant="outline"
              className="w-full mt-4"
              onClick={() => (window.location.href = "/")}
            >
              Go to Home
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!trip) return null;

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto w-16 h-16 bg-indigo-100 rounded-full flex items-center justify-center mb-4">
            <Plane className="w-8 h-8 text-indigo-600" />
          </div>
          <CardTitle className="text-2xl">You're Invited!</CardTitle>
          <CardDescription>
            Join the trip planning
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Trip Details */}
          <div className="text-center space-y-2">
            <div className="text-xl font-semibold text-gray-900">
              {trip.destination}
            </div>
            <div className="text-sm text-muted-foreground">
              {trip.days} days
            </div>
          </div>

          {/* Current Members */}
          {trip.groupTripData && trip.groupTripData.members.length > 0 && (
            <div>
              <div className="text-sm font-medium mb-2">Current members:</div>
              <div className="flex flex-wrap gap-2">
                {trip.groupTripData.members.map((member) => (
                  <Badge key={member.userId} variant="outline">
                    {member.displayName || member.email}
                    {member.role === "owner" && " (Owner)"}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {/* Google Sign In Button */}
          <Button
            onClick={handleGoogleSignIn}
            className="w-full"
            size="lg"
          >
            <svg
              className="w-5 h-5 mr-2"
              viewBox="0 0 24 24"
              fill="currentColor"
            >
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
            </svg>
            Sign in with Google to Join
          </Button>

          <p className="text-xs text-center text-muted-foreground">
            By joining, you'll be able to suggest dates, vote, and chat with the
            group
          </p>

          {trip.invitationExpiresAt && (
            <div className="text-xs text-center text-muted-foreground border-t pt-4">
              Link expires: {format(trip.invitationExpiresAt, "MMM d, yyyy")}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}


