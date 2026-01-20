import {
  addDays,
  format,
  getDay,
  isWeekend,
  parseISO,
  startOfDay
} from "date-fns";
import {
  ArrowRight,
  CalendarDays,
  Check,
  Copy,
  Download,
  Edit2,
  MapPin,
  Plane,
  Plus,
  Settings,
  Trash2,
  Users,
} from "lucide-react";
import { useMemo, useState } from "react";
import {
  generateInvitationToken,
  type SuggestedDate,
  type Trip,
  type TripComment,
} from "../utils/storage";
import { CalendarPicker } from "./CalendarPicker";
import { GroupTripCreationDialog } from "./GroupTripCreationDialog";
import { GroupTripView } from "./GroupTripView";
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
import { Label } from "./ui/label";

// Helper function to move weekend holidays to Monday
function adjustHolidayForWeekend(
  date: Date,
  name: string
): { date: Date; name: string } {
  const dayOfWeek = getDay(date);

  if (dayOfWeek === 0) {
    return {
      date: addDays(date, 1),
      name: `${name} (observed)`,
    };
  } else if (dayOfWeek === 6) {
    return {
      date: addDays(date, 2),
      name: `${name} (observed)`,
    };
  }

  return { date, name };
}

// Singapore Public Holidays 2026 (raw dates) - default
const defaultRawHolidays = [
  { date: new Date(2026, 0, 1), name: "New Year's Day" },
  { date: new Date(2026, 1, 17), name: "Chinese New Year" },
  { date: new Date(2026, 1, 18), name: "Chinese New Year" },
  { date: new Date(2026, 2, 21), name: "Hari Raya Puasa" },
  { date: new Date(2026, 3, 3), name: "Good Friday" },
  { date: new Date(2026, 4, 1), name: "Labour Day" },
  { date: new Date(2026, 4, 27), name: "Hari Raya Haji" },
  { date: new Date(2026, 4, 31), name: "Vesak Day" },
  { date: new Date(2026, 7, 9), name: "National Day" },
  { date: new Date(2026, 10, 8), name: "Deepavali" },
  { date: new Date(2026, 11, 25), name: "Christmas Day" },
];

interface Holiday {
  date: Date;
  name: string;
}

// Trip interface is now imported from storage.ts

interface DateOptimization {
  date: Date;
  efficiency: number;
  leaveDaysNeeded: number;
  nearHolidays: string[];
}

const MS_PER_DAY = 24 * 60 * 60 * 1000;

function datesOverlap(
  start1: Date,
  end1: Date,
  start2: Date,
  end2: Date
): boolean {
  return start1 <= end2 && end1 >= start2;
}

export function LeaveOptimizer() {
  const [annualLeave, setAnnualLeave] = useState(18);
  const [rawHolidays, setRawHolidays] = useState<Holiday[]>(defaultRawHolidays);
  const [trips, setTrips] = useState<Trip[]>([]);

  // Online users counter (simulated)
  const [onlineUsers, setOnlineUsers] = useState(0);
  void setOnlineUsers;

  // Step wizard state
  const [currentStep, setCurrentStep] = useState<
    "input" | "choose-path" | "calendar" | "group-plan" | "confirm"
  >("input");
  const [editingTripId, setEditingTripId] = useState<string | null>(null);
  const [tempDestination, setTempDestination] = useState("");
  const [tempDays, setTempDays] = useState(5);
  const [tempStartDate, setTempStartDate] = useState<Date | null>(null);
  const [tempEndDate, setTempEndDate] = useState<Date | null>(null);
  const [tempTripType, setTempTripType] = useState<"personal" | "group" | null>(
    null
  );
  void tempTripType;
  const [createdGroupTripId, setCreatedGroupTripId] = useState<string | null>(
    null
  );

  // Settings panel state
  const [showSettings, setShowSettings] = useState(false);
  const [newHolidayName, setNewHolidayName] = useState("");
  const [newHolidayDate, setNewHolidayDate] = useState("");
  const [editingHolidayId, setEditingHolidayId] = useState<number | null>(null);

  // Group trip state
  const [showGroupTripDialog, setShowGroupTripDialog] = useState(false);

  const holidays = useMemo(() => {
    return rawHolidays.map((h) => adjustHolidayForWeekend(h.date, h.name));
  }, [rawHolidays]);

  const workingDayPrefix = useMemo(() => {
    // Prefix-sum array over the year: prefix[i] = working days in [0, i)
    const year = 2026;
    const yearStart = startOfDay(new Date(year, 0, 1));
    const yearEnd = startOfDay(new Date(year, 11, 31));
    const daysInYear =
      Math.round((yearEnd.getTime() - yearStart.getTime()) / MS_PER_DAY) + 1;

    const holidayIndexToName = new Map<number, string[]>();
    for (const h of holidays) {
      const d = startOfDay(h.date);
      if (d.getFullYear() !== year) continue;
      const idx = Math.round((d.getTime() - yearStart.getTime()) / MS_PER_DAY);
      if (idx < 0 || idx >= daysInYear) continue;
      const existing = holidayIndexToName.get(idx) || [];
      existing.push(h.name);
      holidayIndexToName.set(idx, existing);
    }

    const prefix = new Array<number>(daysInYear + 1);
    prefix[0] = 0;

    for (let i = 0; i < daysInYear; i++) {
      const date = addDays(yearStart, i);
      const isHol = holidayIndexToName.has(i);
      const isWknd = isWeekend(date);
      const isWorking = !isHol && !isWknd;
      prefix[i + 1] = prefix[i] + (isWorking ? 1 : 0);
    }

    return {
      yearStart,
      daysInYear,
      prefix,
      holidayIndexToName,
    };
  }, [holidays]);

  const calculateWorkingDaysNeeded = (startDate: Date, tripDays: number) => {
    const start = startOfDay(startDate);
    const startIdx = Math.round(
      (start.getTime() - workingDayPrefix.yearStart.getTime()) / MS_PER_DAY
    );
    const endIdx = startIdx + tripDays - 1;

    if (startIdx < 0 || endIdx >= workingDayPrefix.daysInYear) return 0;
    return (
      workingDayPrefix.prefix[endIdx + 1] -
      workingDayPrefix.prefix[startIdx]
    );
  };

  const calculateOptimizationScores = (
    tripDays: number
  ): DateOptimization[] => {
    const scores: DateOptimization[] = [];
    const { yearStart, daysInYear, prefix, holidayIndexToName } =
      workingDayPrefix;

    // Only consider start dates where the full trip fits inside the year
    const lastStartIdx = daysInYear - tripDays;
    if (lastStartIdx < 0) return [];

    for (let startIdx = 0; startIdx <= lastStartIdx; startIdx++) {
      const endIdx = startIdx + tripDays - 1;
      const leaveDaysNeeded = prefix[endIdx + 1] - prefix[startIdx];
      if (leaveDaysNeeded <= 0) continue;

      const nearHolidays: string[] = [];
      const nearStart = Math.max(0, startIdx - 3);
      const nearEnd = Math.min(daysInYear - 1, endIdx + 3);
      for (let i = nearStart; i <= nearEnd; i++) {
        const names = holidayIndexToName.get(i);
        if (names) nearHolidays.push(...names);
      }

      scores.push({
        date: addDays(yearStart, startIdx),
        efficiency: tripDays / leaveDaysNeeded,
        leaveDaysNeeded,
        nearHolidays: Array.from(new Set(nearHolidays)),
      });
    }

    return scores;
  };

  const totalLeaveUsed = useMemo(() => {
    let total = 0;
    trips.forEach((trip) => {
      if (trip.startDate && trip.endDate) {
        total += calculateWorkingDaysNeeded(trip.startDate, trip.days);
      }
    });
    return total;
  }, [trips, workingDayPrefix]); // eslint-disable-line react-hooks/exhaustive-deps

  const confirmedTrips = useMemo(() => {
    return trips.filter(
      (t) =>
        (t.startDate && t.endDate) ||
        (t.type === "group" && t.groupTripData?.status === "planning")
    );
  }, [trips]);

  const checkDateConflict = (
    date: Date | null,
    days: number,
    excludeTripId?: string
  ): boolean => {
    if (!date) return false;
    const endDate = addDays(date, days - 1);

    for (const trip of trips) {
      if (trip.id === excludeTripId || !trip.startDate || !trip.endDate) {
        continue;
      }

      if (datesOverlap(date, endDate, trip.startDate, trip.endDate)) {
        return true;
      }
    }

    return false;
  };
  void checkDateConflict;

  const getConflictDates = (excludeTripId?: string): Date[] => {
    const conflictDates: Date[] = [];

    trips.forEach((trip) => {
      if (trip.id === excludeTripId || !trip.startDate || !trip.endDate) {
        return;
      }

      let currentDate = new Date(trip.startDate);
      while (currentDate <= trip.endDate) {
        conflictDates.push(new Date(currentDate));
        currentDate = addDays(currentDate, 1);
      }
    });

    return conflictDates;
  };

  // Step 1: Input destination and days
  const handleStartNewTrip = () => {
    setTempDestination("");
    setTempDays(5);
    setTempStartDate(null);
    setTempEndDate(null);
    setTempTripType(null);
    setCreatedGroupTripId(null);
    setEditingTripId(null);
    setCurrentStep("input");
  };

  const handleEditTrip = (trip: Trip) => {
    setTempDestination(trip.destination);
    setTempDays(trip.days);
    setTempStartDate(trip.startDate);
    setTempEndDate(trip.endDate);
    setEditingTripId(trip.id);
    setCurrentStep("calendar");
  };

  const handleNextToChoosePath = () => {
    if (tempDestination.trim() && tempDays > 0) {
      setCurrentStep("choose-path");
    }
  };

  const handleChoosePersonalTrip = () => {
    setTempTripType("personal");
    setCurrentStep("calendar");
  };

  const handleCreateGroupPlan = () => {
    if (!tempDestination.trim() || tempDays < 1) return;

    // Create group trip immediately
    const invitationToken = generateInvitationToken();
    const invitationExpiresAt = addDays(new Date(), 7);

    const newGroupTrip: Trip = {
      id: Date.now().toString(),
      destination: tempDestination.trim(),
      days: tempDays,
      startDate: null,
      endDate: null,
      type: "group",
      invitationToken,
      invitationExpiresAt,
      groupTripData: {
        members: [
          {
            userId: "current-user",
            email: "you@example.com",
            displayName: "You",
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

    setTrips([...trips, newGroupTrip]);
    setCreatedGroupTripId(newGroupTrip.id);
    setTempTripType("group");
    setCurrentStep("group-plan");
  };

  // Step 2: Select dates on calendar
  const handleDateSelect = (startDate: Date | null, endDate: Date | null) => {
    setTempStartDate(startDate);
    setTempEndDate(endDate);
  };

  // Step 3: Confirm and save trip
  const handleConfirmTrip = () => {
    if (tempDestination.trim() && tempStartDate && tempEndDate) {
      if (editingTripId) {
        // Update existing trip
        setTrips(
          trips.map((t) =>
            t.id === editingTripId
              ? {
                  ...t,
                  destination: tempDestination,
                  days: tempDays,
                  startDate: tempStartDate,
                  endDate: tempEndDate,
                }
              : t
          )
        );
      } else {
        // Add new trip
        const newTrip: Trip = {
          id: Date.now().toString(),
          destination: tempDestination,
          days: tempDays,
          startDate: tempStartDate,
          endDate: tempEndDate,
        };
        setTrips([...trips, newTrip]);
      }

      // Reset for next trip
      handleStartNewTrip();
    }
  };

  const handleCancelTrip = () => {
    setTempDestination("");
    setTempDays(5);
    setTempStartDate(null);
    setTempEndDate(null);
    setTempTripType(null);
    setCreatedGroupTripId(null);
    setEditingTripId(null);
    setCurrentStep("input");
  };

  const removeTrip = (id: string) => {
    setTrips(trips.filter((t) => t.id !== id));
    if (editingTripId === id || createdGroupTripId === id) {
      handleCancelTrip();
    }
  };

  // Group trip handlers
  const handleCreateGroupTrip = (trip: Trip) => {
    setTrips([...trips, trip]);
    // Don't set viewingGroupTripId - it will be shown in the planning section
  };

  const handleRegenerateInvitationLink = (tripId: string) => {
    const trip = trips.find((t) => t.id === tripId);
    if (!trip) return;

    const newToken = generateInvitationToken();
    const newExpiresAt = addDays(new Date(), 7);

    setTrips(
      trips.map((t) =>
        t.id === tripId
          ? {
              ...t,
              invitationToken: newToken,
              invitationExpiresAt: newExpiresAt,
            }
          : t
      )
    );
  };
  void handleRegenerateInvitationLink;

  // Group trip feature handlers
  const handleSuggestDate = (
    tripId: string,
    startDate: Date,
    endDate: Date,
    reason?: string
  ) => {
    const trip = trips.find((t) => t.id === tripId);
    if (!trip?.groupTripData) return;

    const suggestion: SuggestedDate = {
      id: `suggestion-${Date.now()}`,
      suggestedBy: "current-user",
      suggestedByName: "You",
      startDate,
      endDate,
      reason,
      votes: [],
      createdAt: new Date(),
    };

    const updatedGroupData = {
      ...trip.groupTripData,
      suggestedDates: [...trip.groupTripData.suggestedDates, suggestion],
    };

    setTrips(
      trips.map((t) =>
        t.id === tripId ? { ...t, groupTripData: updatedGroupData } : t
      )
    );
  };

  const handleVoteDate = (tripId: string, suggestionId: string) => {
    const trip = trips.find((t) => t.id === tripId);
    if (!trip?.groupTripData) return;

    const updatedSuggestions = trip.groupTripData.suggestedDates.map((sd) => {
      if (sd.id === suggestionId) {
        const hasVoted =
          sd.votes.includes("current-user") ||
          sd.votes.includes("you@example.com");
        return {
          ...sd,
          votes: hasVoted
            ? sd.votes.filter(
                (v) => v !== "current-user" && v !== "you@example.com"
              )
            : [...sd.votes, "current-user"],
        };
      }
      return sd;
    });

    const updatedGroupData = {
      ...trip.groupTripData,
      suggestedDates: updatedSuggestions,
    };

    setTrips(
      trips.map((t) =>
        t.id === tripId ? { ...t, groupTripData: updatedGroupData } : t
      )
    );
  };

  const handleAddComment = (tripId: string, text: string) => {
    const trip = trips.find((t) => t.id === tripId);
    if (!trip?.groupTripData) return;

    const comment: TripComment = {
      id: `comment-${Date.now()}`,
      userId: "current-user",
      userName: "You",
      text,
      createdAt: new Date(),
    };

    const updatedGroupData = {
      ...trip.groupTripData,
      comments: [...trip.groupTripData.comments, comment],
    };

    setTrips(
      trips.map((t) =>
        t.id === tripId ? { ...t, groupTripData: updatedGroupData } : t
      )
    );
  };

  const handleConfirmGroupDates = (
    tripId: string,
    startDate: Date,
    endDate: Date
  ) => {
    const trip = trips.find((t) => t.id === tripId);
    if (!trip?.groupTripData) return;

    const updatedGroupData = {
      ...trip.groupTripData,
      status: "confirmed" as const,
    };

    setTrips(
      trips.map((t) =>
        t.id === tripId
          ? {
              ...t,
              startDate,
              endDate,
              groupTripData: updatedGroupData,
            }
          : t
      )
    );
  };

  // Holiday management
  const addHoliday = () => {
    if (newHolidayName.trim() && newHolidayDate) {
      const holiday: Holiday = {
        name: newHolidayName.trim(),
        date: startOfDay(parseISO(newHolidayDate)),
      };
      setRawHolidays(
        [...rawHolidays, holiday].sort(
          (a, b) => a.date.getTime() - b.date.getTime()
        )
      );
      setNewHolidayName("");
      setNewHolidayDate("");
    }
  };

  const removeHoliday = (index: number) => {
    setRawHolidays(rawHolidays.filter((_, i) => i !== index));
  };

  const updateHoliday = (index: number, name: string, date: string) => {
    const updatedHolidays = [...rawHolidays];
    updatedHolidays[index] = {
      name,
      date: startOfDay(parseISO(date)),
    };
    setRawHolidays(
      updatedHolidays.sort((a, b) => a.date.getTime() - b.date.getTime())
    );
    setEditingHolidayId(null);
  };

  // Export to ICS (Calendar file)
  const exportToCalendar = () => {
    const icsEvents: string[] = [];

    confirmedTrips.forEach((trip) => {
      const dtstart = format(trip.startDate!, "yyyyMMdd");
      const dtend = format(addDays(trip.endDate!, 1), "yyyyMMdd"); // ICS uses exclusive end date
      const summary = `🌴 ${trip.destination}`;
      const description = `Leave trip to ${trip.destination}\\nTotal days: ${
        trip.days
      }\\nLeave days needed: ${calculateWorkingDaysNeeded(
        trip.startDate!,
        trip.days
      )}`;

      icsEvents.push(`BEGIN:VEVENT
UID:${trip.id}@leave-optimizer
DTSTAMP:${format(new Date(), "yyyyMMdd'T'HHmmss'Z'")}
DTSTART;VALUE=DATE:${dtstart}
DTEND;VALUE=DATE:${dtend}
SUMMARY:${summary}
DESCRIPTION:${description}
STATUS:CONFIRMED
END:VEVENT`);
    });

    const icsContent = `BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//Leave Optimizer//Leave Planning//EN
CALSCALE:GREGORIAN
METHOD:PUBLISH
X-WR-CALNAME:Leave Plan 2026
X-WR-TIMEZONE:UTC
${icsEvents.join("\n")}
END:VCALENDAR`;

    const blob = new Blob([icsContent], {
      type: "text/calendar;charset=utf-8",
    });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `leave-plan-${format(new Date(), "yyyy-MM-dd")}.ics`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const optimizationScores = useMemo(() => {
    return calculateOptimizationScores(tempDays);
  }, [tempDays, workingDayPrefix]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6 md:mb-8">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-gray-900 flex items-center gap-2">
                <CalendarDays className="w-7 h-7 md:w-8 md:h-8 text-indigo-600" />
                Leave Optimizer 2026
              </h1>
              <div className="flex items-center gap-4 mt-1">
                <p className="text-sm md:text-base text-gray-600">
                  Plan your trips strategically with {annualLeave} days of
                  annual leave
                </p>
                {onlineUsers > 0 && (
                  <div className="flex items-center gap-1.5 text-sm text-gray-600 bg-white px-3 py-1 rounded-full shadow-sm border border-gray-200">
                    <div className="relative">
                      <Users className="w-4 h-4 text-green-600" />
                      <div className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                    </div>
                    <span className="font-medium text-green-700">
                      {onlineUsers}
                    </span>
                    <span className="text-gray-500">online</span>
                  </div>
                )}
              </div>
            </div>
            <div className="flex items-center gap-2">
              {confirmedTrips.length > 0 && (
                <Button
                  onClick={exportToCalendar}
                  variant="outline"
                  size="sm"
                  className="gap-2"
                >
                  <Download className="w-4 h-4" />
                  <span className="hidden sm:inline">Export to Calendar</span>
                  <span className="sm:hidden">Export</span>
                </Button>
              )}
              <Button
                onClick={() => setShowSettings(!showSettings)}
                variant="outline"
                size="sm"
                className="gap-2"
              >
                <Settings className="w-4 h-4" />
                <span className="hidden sm:inline">Settings</span>
              </Button>
            </div>
          </div>
        </div>

        {/* Perf panel removed */}
        {/* Settings Panel */}
        {showSettings && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Settings</CardTitle>
              <CardDescription>
                Configure your leave balance and public holidays
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Annual Leave */}
              <div className="space-y-2">
                <Label htmlFor="annual-leave">Annual Leave Days</Label>
                <Input
                  id="annual-leave"
                  type="number"
                  min="1"
                  max="50"
                  value={annualLeave}
                  onChange={(e) =>
                    setAnnualLeave(parseInt(e.target.value) || 0)
                  }
                  className="max-w-xs"
                />
              </div>

              {/* Public Holidays */}
              <div className="space-y-4">
                <h3 className="font-semibold">
                  Public Holidays ({holidays.length})
                </h3>

                {/* Add Holiday */}
                <div className="flex flex-col sm:flex-row gap-2">
                  <Input
                    placeholder="Holiday name"
                    value={newHolidayName}
                    onChange={(e) => setNewHolidayName(e.target.value)}
                    className="flex-1"
                  />
                  <Input
                    type="date"
                    value={newHolidayDate}
                    onChange={(e) => setNewHolidayDate(e.target.value)}
                    className="flex-1"
                  />
                  <Button
                    onClick={addHoliday}
                    size="sm"
                    className="whitespace-nowrap"
                  >
                    <Plus className="w-4 h-4 mr-1" />
                    Add
                  </Button>
                </div>

                {/* Holidays List */}
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {rawHolidays.map((holiday, index) => (
                    <div
                      key={index}
                      className="flex flex-col sm:flex-row items-start sm:items-center gap-2 p-3 bg-gray-50 rounded-lg"
                    >
                      {editingHolidayId === index ? (
                        <>
                          <Input
                            defaultValue={holiday.name}
                            id={`edit-name-${index}`}
                            className="flex-1"
                          />
                          <Input
                            type="date"
                            defaultValue={format(holiday.date, "yyyy-MM-dd")}
                            id={`edit-date-${index}`}
                            className="flex-1"
                          />
                          <Button
                            size="sm"
                            onClick={() => {
                              const nameInput = document.getElementById(
                                `edit-name-${index}`
                              ) as HTMLInputElement;
                              const dateInput = document.getElementById(
                                `edit-date-${index}`
                              ) as HTMLInputElement;
                              updateHoliday(
                                index,
                                nameInput.value,
                                dateInput.value
                              );
                            }}
                          >
                            Save
                          </Button>
                        </>
                      ) : (
                        <>
                          <div className="flex-1">
                            <div className="font-medium">{holiday.name}</div>
                            <div className="text-sm text-gray-600">
                              {format(holiday.date, "EEE, MMM d, yyyy")}
                            </div>
                          </div>
                          <div className="flex gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setEditingHolidayId(index)}
                            >
                              <Edit2 className="w-3 h-3" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => removeHoliday(index)}
                            >
                              <Trash2 className="w-3 h-3" />
                            </Button>
                          </div>
                        </>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Left Column - Leave Summary & Booked Trips */}
          <div className="lg:col-span-1 space-y-6">
            {/* Leave Balance Summary */}
            <Card className="bg-gradient-to-br from-indigo-50 to-blue-50 border-indigo-200">
              <CardHeader>
                <CardTitle className="text-base sm:text-lg">
                  Your Leave Balance
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 sm:space-y-4">
                <div className="grid grid-cols-2 gap-2 sm:gap-3">
                  <div className="bg-white p-3 sm:p-4 rounded-lg shadow-sm">
                    <div className="text-xs text-gray-600 mb-1">Used</div>
                    <div
                      className={`text-xl sm:text-2xl font-bold ${
                        totalLeaveUsed > annualLeave
                          ? "text-red-600"
                          : "text-indigo-600"
                      }`}
                    >
                      {totalLeaveUsed}
                    </div>
                    <div className="text-xs text-gray-500">
                      of {annualLeave} days
                    </div>
                  </div>
                  <div className="bg-white p-3 sm:p-4 rounded-lg shadow-sm">
                    <div className="text-xs text-gray-600 mb-1">Remaining</div>
                    <div className="text-xl sm:text-2xl font-bold text-green-600">
                      {Math.max(0, annualLeave - totalLeaveUsed)}
                    </div>
                    <div className="text-xs text-gray-500">days left</div>
                  </div>
                </div>

                {totalLeaveUsed > annualLeave && (
                  <div className="bg-red-100 border border-red-300 text-red-700 p-2 sm:p-3 rounded-lg text-xs sm:text-sm">
                    ⚠️ Exceeded by {totalLeaveUsed - annualLeave} days
                  </div>
                )}

                <div className="pt-2 border-t">
                  <div className="text-xs sm:text-sm text-gray-600">
                    <strong>{confirmedTrips.length}</strong> trip
                    {confirmedTrips.length !== 1 ? "s" : ""} planned
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Booked Trips */}
            {confirmedTrips.length > 0 && (
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Plane className="w-5 h-5" />
                      Your Trips
                    </CardTitle>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setShowGroupTripDialog(true)}
                      className="gap-2"
                    >
                      <Users className="w-4 h-4" />
                      Group Trip
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  {confirmedTrips.map((trip) => {
                    const isGroupTrip = trip.type === "group";
                    const hasDates = trip.startDate && trip.endDate;
                    const leaveDays = hasDates
                      ? calculateWorkingDaysNeeded(trip.startDate!, trip.days)
                      : 0;
                    const efficiency =
                      hasDates && leaveDays > 0 ? trip.days / leaveDays : 0;

                    return (
                      <div
                        key={trip.id}
                        className={`p-4 rounded-lg border space-y-2 ${
                          isGroupTrip
                            ? "bg-gradient-to-r from-blue-50 to-cyan-50 border-blue-100"
                            : "bg-gradient-to-r from-indigo-50 to-purple-50 border-indigo-100"
                        }`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1 min-w-0">
                            <div className="font-semibold text-gray-900 truncate flex items-center gap-2">
                              {trip.destination}
                              {isGroupTrip && (
                                <Badge variant="outline" className="text-xs">
                                  <Users className="w-3 h-3 mr-1" />
                                  Group
                                </Badge>
                              )}
                            </div>
                            {hasDates ? (
                              <div className="text-sm text-gray-600 mt-1">
                                {format(trip.startDate!, "MMM d")} →{" "}
                                {format(trip.endDate!, "MMM d, yyyy")}
                              </div>
                            ) : isGroupTrip ? (
                              <div className="text-sm text-amber-600 mt-1">
                                Dates not set - Planning in progress
                              </div>
                            ) : null}
                          </div>
                          {hasDates && (
                            <Badge variant="secondary" className="shrink-0">
                              {efficiency.toFixed(1)}x
                            </Badge>
                          )}
                        </div>

                        {hasDates && (
                          <div className="flex items-center justify-between text-xs text-gray-600">
                            <span>{trip.days} days total</span>
                            <span>{leaveDays} leave days</span>
                          </div>
                        )}
                        {isGroupTrip && trip.groupTripData && (
                          <div className="flex items-center justify-between text-xs text-gray-600">
                            <span>
                              {trip.groupTripData.members.length} member
                              {trip.groupTripData.members.length !== 1
                                ? "s"
                                : ""}
                            </span>
                            <span>
                              {trip.groupTripData.suggestedDates.length}{" "}
                              suggestion
                              {trip.groupTripData.suggestedDates.length !== 1
                                ? "s"
                                : ""}
                            </span>
                          </div>
                        )}

                        <div className="flex gap-2 pt-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleEditTrip(trip)}
                            className="flex-1"
                          >
                            {isGroupTrip ? (
                              <>
                                <Users className="w-3 h-3 mr-1" />
                                Edit Group
                              </>
                            ) : (
                              <>
                                <Edit2 className="w-3 h-3 mr-1" />
                                Edit
                              </>
                            )}
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => removeTrip(trip.id)}
                            className="text-red-600 hover:text-red-700 hover:bg-red-50"
                          >
                            <Trash2 className="w-3 h-3" />
                          </Button>
                        </div>
                      </div>
                    );
                  })}
                </CardContent>
              </Card>
            )}
          </div>

          {/* Right Column - Trip Planning Wizard */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MapPin className="w-5 h-5" />
                  {editingTripId
                    ? trips.find((t) => t.id === editingTripId)?.type ===
                      "group"
                      ? "Edit Group Trip"
                      : "Edit Trip"
                    : "Plan New Trip"}
                </CardTitle>
                <CardDescription>
                  {currentStep === "input" &&
                    "Step 1: Enter destination and duration"}
                  {currentStep === "choose-path" && "Step 2: Choose trip type"}
                  {currentStep === "calendar" &&
                    "Step 2: Select your travel dates"}
                  {currentStep === "group-plan" &&
                    "Group Plan: Share link and suggest dates"}
                  {currentStep === "confirm" && "Step 3: Review and confirm"}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {/* Step 1: Input */}
                {currentStep === "input" && (
                  <div className="space-y-6">
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="destination">
                          Where are you going?
                        </Label>
                        <Input
                          id="destination"
                          placeholder="e.g., Bangkok, Bali, Vietnam"
                          value={tempDestination}
                          onChange={(e) => setTempDestination(e.target.value)}
                          onKeyPress={(e) =>
                            e.key === "Enter" && handleNextToChoosePath()
                          }
                          autoFocus
                          className="text-lg"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="days">How many days?</Label>
                        <Input
                          id="days"
                          type="number"
                          min="1"
                          max="30"
                          value={tempDays}
                          onChange={(e) =>
                            setTempDays(parseInt(e.target.value) || 5)
                          }
                          className="text-lg max-w-xs"
                        />
                        <p className="text-sm text-gray-500">
                          Total trip duration including travel days
                        </p>
                      </div>
                    </div>

                    <div className="flex gap-3 pt-4">
                      <Button
                        onClick={handleNextToChoosePath}
                        disabled={!tempDestination.trim() || tempDays < 1}
                        className="gap-2"
                        size="lg"
                      >
                        Next
                        <ArrowRight className="w-4 h-4" />
                      </Button>
                      {editingTripId && (
                        <Button
                          variant="outline"
                          onClick={handleCancelTrip}
                          size="lg"
                        >
                          Cancel
                        </Button>
                      )}
                    </div>
                  </div>
                )}

                {/* Step 2: Choose Path (Personal or Group) */}
                {currentStep === "choose-path" && (
                  <div className="space-y-6">
                    <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-4">
                      <div className="font-semibold text-indigo-900">
                        {tempDestination} • {tempDays} days
                      </div>
                      <p className="text-sm text-indigo-700 mt-1">
                        Choose how you want to plan this trip
                      </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* Personal Trip Option */}
                      <Card className="cursor-pointer hover:border-indigo-400 transition-colors">
                        <CardContent className="pt-6">
                          <div className="text-center space-y-4">
                            <div className="mx-auto w-16 h-16 bg-indigo-100 rounded-full flex items-center justify-center">
                              <CalendarDays className="w-8 h-8 text-indigo-600" />
                            </div>
                            <div>
                              <h3 className="font-semibold text-lg mb-2">
                                Choose Dates
                              </h3>
                              <p className="text-sm text-muted-foreground">
                                Plan a personal trip and select your dates now
                              </p>
                            </div>
                            <Button
                              onClick={handleChoosePersonalTrip}
                              className="w-full"
                              size="lg"
                            >
                              Choose Dates
                              <ArrowRight className="w-4 h-4 ml-2" />
                            </Button>
                          </div>
                        </CardContent>
                      </Card>

                      {/* Group Trip Option */}
                      <Card className="cursor-pointer hover:border-blue-400 transition-colors">
                        <CardContent className="pt-6">
                          <div className="text-center space-y-4">
                            <div className="mx-auto w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center">
                              <Users className="w-8 h-8 text-blue-600" />
                            </div>
                            <div>
                              <h3 className="font-semibold text-lg mb-2">
                                Create Group Plan
                              </h3>
                              <p className="text-sm text-muted-foreground">
                                Plan with friends - suggest dates and vote
                                together
                              </p>
                            </div>
                            <Button
                              onClick={handleCreateGroupPlan}
                              variant="outline"
                              className="w-full"
                              size="lg"
                            >
                              Create Group Plan
                              <Users className="w-4 h-4 ml-2" />
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    </div>

                    <div className="flex gap-3 pt-4 border-t">
                      <Button
                        variant="outline"
                        onClick={() => setCurrentStep("input")}
                        size="lg"
                      >
                        Back
                      </Button>
                    </div>
                  </div>
                )}

                {/* Group Plan Step */}
                {currentStep === "group-plan" && createdGroupTripId && (
                  <div className="space-y-6">
                    {(() => {
                      const groupTrip = trips.find(
                        (t) => t.id === createdGroupTripId
                      );
                      if (!groupTrip || groupTrip.type !== "group") return null;

                      return (
                        <>
                          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                            <div className="font-semibold text-blue-900">
                              {groupTrip.destination} • {groupTrip.days} days
                            </div>
                            <p className="text-sm text-blue-700 mt-1">
                              Group plan created! Share the invitation link with
                              friends
                            </p>
                          </div>

                          {/* Invitation Link */}
                          <Card className="border-blue-200 bg-gradient-to-br from-blue-50 to-indigo-50">
                            <CardHeader>
                              <CardTitle className="text-lg flex items-center gap-2">
                                <Users className="w-5 h-5 text-blue-600" />
                                Invitation Link
                              </CardTitle>
                              <CardDescription>
                                Share this link with friends to invite them
                              </CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                              {groupTrip.invitationToken && (
                                <div className="flex gap-2">
                                  <Input
                                    value={`${window.location.origin}/invite/${groupTrip.invitationToken}`}
                                    readOnly
                                    className="font-mono text-sm bg-white"
                                  />
                                  <Button
                                    variant="outline"
                                    size="icon"
                                    onClick={async () => {
                                      const link = `${window.location.origin}/invite/${groupTrip.invitationToken}`;
                                      await navigator.clipboard.writeText(link);
                                    }}
                                  >
                                    <Copy className="w-4 h-4" />
                                  </Button>
                                </div>
                              )}
                              <p className="text-xs text-muted-foreground">
                                Friends will sign in with Google and join
                                automatically
                              </p>
                            </CardContent>
                          </Card>

                          {/* Group Trip View */}
                          <div className="border-t pt-6">
                            <GroupTripView
                              trip={groupTrip}
                              allTrips={trips}
                              holidays={holidays}
                              year={2026}
                              currentUserId="current-user"
                              currentUserEmail="you@example.com"
                              currentUserName="You"
                              onUpdateTrip={(tripId, updates) => {
                                setTrips(
                                  trips.map((t) =>
                                    t.id === tripId ? { ...t, ...updates } : t
                                  )
                                );
                              }}
                              onSuggestDate={handleSuggestDate}
                              onVoteDate={handleVoteDate}
                              onAddComment={handleAddComment}
                              onConfirmDates={(tripId, startDate, endDate) => {
                                handleConfirmGroupDates(
                                  tripId,
                                  startDate,
                                  endDate
                                );
                                // After confirming, stay in group plan view for editing
                              }}
                              onClose={
                                editingTripId
                                  ? undefined
                                  : () => {
                                      // Only allow closing if not editing (i.e., creating new)
                                      handleStartNewTrip();
                                    }
                              }
                            />
                          </div>
                        </>
                      );
                    })()}
                  </div>
                )}

                {/* Step 2: Calendar */}
                {currentStep === "calendar" && (
                  <div className="space-y-6">
                    <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-4">
                      <div className="font-semibold text-indigo-900">
                        {tempDestination} • {tempDays} days
                      </div>
                      <p className="text-sm text-indigo-700 mt-1">
                        Select your departure date below
                      </p>
                    </div>

                    <CalendarPicker
                      tripDays={tempDays}
                      onDateSelect={handleDateSelect}
                      selectedStartDate={tempStartDate}
                      selectedEndDate={tempEndDate}
                      holidays={holidays}
                      optimizationScores={optimizationScores}
                      conflictDates={getConflictDates(editingTripId || undefined)}
                    />

                    <div className="flex gap-3 pt-4 border-t flex-col md:flex-row">
                      <Button
                        onClick={handleConfirmTrip}
                        disabled={!tempStartDate || !tempEndDate}
                        className="gap-2"
                        size="lg"
                      >
                        <Check className="w-4 h-4" />
                        Confirm Trip
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => setCurrentStep("input")}
                        size="lg"
                      >
                        Back
                      </Button>
                      <Button
                        variant="ghost"
                        onClick={handleCancelTrip}
                        size="lg"
                      >
                        Cancel
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Add Another Trip Button */}
            {currentStep === "input" &&
              !editingTripId &&
              confirmedTrips.length > 0 && (
                <div className="mt-4 text-center">
                  <p className="text-sm text-gray-600">
                    Already have {confirmedTrips.length} trip
                    {confirmedTrips.length !== 1 ? "s" : ""} planned
                  </p>
                </div>
              )}

            {currentStep === "input" && confirmedTrips.length === 0 && (
              <div className="mt-4 p-6 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="text-center">
                  <Plane className="w-12 h-12 text-blue-600 mx-auto mb-3" />
                  <h3 className="font-semibold text-blue-900 mb-2">
                    Ready to plan your first trip?
                  </h3>
                  <p className="text-sm text-blue-700">
                    Enter your destination and trip duration above, then we'll
                    help you find the most efficient dates!
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Group Trip Creation Dialog */}
      <GroupTripCreationDialog
        open={showGroupTripDialog}
        onOpenChange={setShowGroupTripDialog}
        onCreate={handleCreateGroupTrip}
        currentUserEmail="you@example.com"
        currentUserName="You"
      />
    </div>
  );
}
