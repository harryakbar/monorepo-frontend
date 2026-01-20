// LocalStorage utility functions
export interface StoredData {
  annualLeave: number;
  trips: Trip[];
  holidays: Holiday[];
  selectedYear: number;
}

export interface Trip {
  id: string;
  destination: string;
  days: number;
  startDate: Date | null;
  endDate: Date | null;
  notes?: string;
  type?: "personal" | "group";
  // Group trip specific fields
  invitationToken?: string;
  invitationExpiresAt?: Date;
  groupTripData?: GroupTripData;
}

export interface GroupTripData {
  members: GroupTripMember[];
  createdBy: string;
  createdAt: Date;
  suggestedDates: SuggestedDate[];
  comments: TripComment[];
  status: "planning" | "confirmed" | "cancelled";
}

export interface GroupTripMember {
  userId: string;
  email: string;
  displayName?: string;
  role: "owner" | "member";
  joinedAt: Date;
  personalLeaveImpact?: {
    leaveDaysNeeded: number;
    efficiency: number;
    conflicts: string[];
  };
}

export interface SuggestedDate {
  id: string;
  suggestedBy: string;
  suggestedByName?: string;
  startDate: Date;
  endDate: Date;
  reason?: string;
  votes: string[];
  createdAt: Date;
}

export interface TripComment {
  id: string;
  userId: string;
  userName?: string;
  text: string;
  createdAt: Date;
  replies?: TripComment[];
}

export interface Holiday {
  date: Date;
  name: string;
}

const STORAGE_KEY = "leave-optimizer-data";

// Generate secure invitation token
export function generateInvitationToken(): string {
  // Use crypto API if available, otherwise fallback
  if (typeof crypto !== "undefined" && crypto.getRandomValues) {
    const array = new Uint8Array(32);
    crypto.getRandomValues(array);
    return Array.from(array, (byte) => byte.toString(16).padStart(2, "0")).join(
      ""
    );
  }
  // Fallback for environments without crypto
  return (
    Math.random().toString(36).substring(2, 15) +
    Math.random().toString(36).substring(2, 15) +
    Date.now().toString(36)
  );
}

// Convert Date objects to ISO strings for storage
function serializeData(data: StoredData): string {
  return JSON.stringify({
    ...data,
    trips: data.trips.map((trip) => ({
      ...trip,
      startDate: trip.startDate?.toISOString() || null,
      endDate: trip.endDate?.toISOString() || null,
      invitationExpiresAt: trip.invitationExpiresAt?.toISOString() || undefined,
      groupTripData: trip.groupTripData
        ? {
            ...trip.groupTripData,
            createdAt: trip.groupTripData.createdAt.toISOString(),
            suggestedDates: trip.groupTripData.suggestedDates.map((sd) => ({
              ...sd,
              startDate: sd.startDate.toISOString(),
              endDate: sd.endDate.toISOString(),
              createdAt: sd.createdAt.toISOString(),
            })),
            comments: trip.groupTripData.comments.map((c) => ({
              ...c,
              createdAt: c.createdAt.toISOString(),
              replies:
                c.replies?.map((r) => ({
                  ...r,
                  createdAt: r.createdAt.toISOString(),
                })) || [],
            })),
          }
        : undefined,
    })),
    holidays: data.holidays.map((holiday) => ({
      ...holiday,
      date: holiday.date.toISOString(),
    })),
  });
}

// Convert ISO strings back to Date objects
function deserializeData(json: string): StoredData | null {
  try {
    const data = JSON.parse(json);
    return {
      ...data,
      trips: data.trips.map((trip: any) => ({
        ...trip,
        startDate: trip.startDate ? new Date(trip.startDate) : null,
        endDate: trip.endDate ? new Date(trip.endDate) : null,
        type: trip.type || "personal",
        invitationExpiresAt: trip.invitationExpiresAt
          ? new Date(trip.invitationExpiresAt)
          : undefined,
        groupTripData: trip.groupTripData
          ? {
              ...trip.groupTripData,
              createdAt: new Date(trip.groupTripData.createdAt),
              suggestedDates:
                trip.groupTripData.suggestedDates?.map((sd: any) => ({
                  ...sd,
                  startDate: new Date(sd.startDate),
                  endDate: new Date(sd.endDate),
                  createdAt: new Date(sd.createdAt),
                })) || [],
              comments:
                trip.groupTripData.comments?.map((c: any) => ({
                  ...c,
                  createdAt: new Date(c.createdAt),
                  replies:
                    c.replies?.map((r: any) => ({
                      ...r,
                      createdAt: new Date(r.createdAt),
                    })) || [],
                })) || [],
            }
          : undefined,
      })),
      holidays: data.holidays.map((holiday: any) => ({
        ...holiday,
        date: new Date(holiday.date),
      })),
    };
  } catch (error) {
    console.error("Error deserializing data:", error);
    return null;
  }
}

export function saveToStorage(data: StoredData): void {
  try {
    localStorage.setItem(STORAGE_KEY, serializeData(data));
  } catch (error) {
    console.error("Error saving to localStorage:", error);
    if (error instanceof Error && error.name === "QuotaExceededError") {
      alert(
        "Storage quota exceeded. Please clear some data or use a different browser."
      );
    }
  }
}

export function loadFromStorage(): StoredData | null {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return null;
    return deserializeData(stored);
  } catch (error) {
    console.error("Error loading from localStorage:", error);
    return null;
  }
}

export function clearStorage(): void {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch (error) {
    console.error("Error clearing localStorage:", error);
  }
}

// Find trip by invitation token
export function findTripByInvitationToken(
  trips: Trip[],
  token: string
): Trip | null {
  return (
    trips.find(
      (trip) =>
        trip.type === "group" &&
        trip.invitationToken === token &&
        trip.invitationExpiresAt &&
        trip.invitationExpiresAt > new Date()
    ) || null
  );
}
