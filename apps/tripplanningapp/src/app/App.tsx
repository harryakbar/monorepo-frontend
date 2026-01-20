import { useEffect, useState } from "react";
import { LeaveOptimizer } from "./components/LeaveOptimizerNew";
import { InvitationPage } from "./components/InvitationPage";
import { loadFromStorage, saveToStorage, type Trip } from "./utils/storage";

export default function App() {
  const [currentView, setCurrentView] = useState<"main" | "invite">("main");
  const [invitationToken, setInvitationToken] = useState<string | null>(null);

  useEffect(() => {
    // Check if we're on an invitation page
    const path = window.location.pathname;
    const inviteMatch = path.match(/^\/invite\/(.+)$/);
    
    if (inviteMatch) {
      setCurrentView("invite");
      setInvitationToken(inviteMatch[1]);
    } else {
      setCurrentView("main");
      setInvitationToken(null);
    }

    // Listen for popstate (back/forward buttons)
    const handlePopState = () => {
      const path = window.location.pathname;
      const inviteMatch = path.match(/^\/invite\/(.+)$/);
      
      if (inviteMatch) {
        setCurrentView("invite");
        setInvitationToken(inviteMatch[1]);
      } else {
        setCurrentView("main");
        setInvitationToken(null);
      }
    };

    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, []);

  const handleJoinTrip = (trip: Trip) => {
    // Load current data
    const stored = loadFromStorage();
    if (!stored) return;

    // Check if user is already a member
    const isAlreadyMember = trip.groupTripData?.members.some(
      (m) => m.userId === "current-user" || m.email === "you@example.com"
    );

    if (isAlreadyMember) {
      alert("You're already a member of this trip!");
      // Navigate to main app
      window.history.pushState({}, "", "/");
      setCurrentView("main");
      return;
    }

    // Add current user as member
    const updatedTrip: Trip = {
      ...trip,
      groupTripData: {
        ...trip.groupTripData!,
        members: [
          ...trip.groupTripData!.members,
          {
            userId: "current-user",
            email: "you@example.com",
            displayName: "You",
            role: "member",
            joinedAt: new Date(),
          },
        ],
      },
    };

    // Update trips in storage
    const updatedTrips = stored.trips.map((t) =>
      t.id === trip.id ? updatedTrip : t
    );

    const updatedData = {
      ...stored,
      trips: updatedTrips,
    };

    // Save to storage
    saveToStorage(updatedData);

    // Navigate to main app
    window.history.pushState({}, "", "/");
    setCurrentView("main");
    
    // Show success message
    alert(`You've joined the trip to ${trip.destination}!`);
    
    // Reload page to show updated data
    window.location.reload();
  };

  if (currentView === "invite" && invitationToken) {
    return <InvitationPage token={invitationToken} onJoin={handleJoinTrip} />;
  }

  return <LeaveOptimizer />;
}