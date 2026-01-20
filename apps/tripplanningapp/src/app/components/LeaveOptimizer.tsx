import { useState, useMemo } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "./ui/card";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Badge } from "./ui/badge";
import { Separator } from "./ui/separator";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "./ui/tabs";
import {
  CalendarDays,
  TrendingUp,
  Plane,
  Plus,
  Trash2,
  MapPin,
  Calendar,
  ChartGantt,
  Download,
  Edit2,
} from "lucide-react";
import {
  format,
  addDays,
  isWeekend,
  isSameDay,
  getDay,
} from "date-fns";
import { YearCalendar } from "./YearCalendar";
import { TimelineView } from "./TimelineView";
import { CalendarPicker } from "./CalendarPicker";

// Helper function to move weekend holidays to Monday
function adjustHolidayForWeekend(
  date: Date,
  name: string,
): { date: Date; name: string } {
  const dayOfWeek = getDay(date); // 0 = Sunday, 6 = Saturday

  if (dayOfWeek === 0) {
    // Sunday - move to Monday
    return {
      date: addDays(date, 1),
      name: `${name} (observed)`,
    };
  } else if (dayOfWeek === 6) {
    // Saturday - move to Monday
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

interface Trip {
  id: string;
  destination: string;
  days: number;
  startDate: Date | null;
  endDate: Date | null;
}

interface DateOptimization {
  date: Date;
  efficiency: number;
  leaveDaysNeeded: number;
  nearHolidays: string[];
}

function datesOverlap(
  start1: Date,
  end1: Date,
  start2: Date,
  end2: Date,
): boolean {
  return start1 <= end2 && start2 <= end1;
}

export function LeaveOptimizer() {
  const [annualLeave, setAnnualLeave] = useState(18);
  const [trips, setTrips] = useState<Trip[]>([]);
  const [newTripDestination, setNewTripDestination] =
    useState("");
  const [newTripDays, setNewTripDays] = useState(5);
  const [selectedTripId, setSelectedTripId] = useState<
    string | null
  >(null);

  // Holidays state
  const [rawHolidays, setRawHolidays] = useState<Holiday[]>(
    defaultRawHolidays,
  );
  const [newHolidayName, setNewHolidayName] = useState("");
  const [newHolidayDate, setNewHolidayDate] = useState("");
  const [editingHolidayId, setEditingHolidayId] = useState<
    number | null
  >(null);

  // Adjust holidays for weekends
  const holidays = useMemo(() => {
    return rawHolidays.map((holiday) =>
      adjustHolidayForWeekend(holiday.date, holiday.name),
    );
  }, [rawHolidays]);

  // Helper functions that depend on holidays
  const isPublicHoliday = (date: Date): boolean => {
    return holidays.some((holiday) =>
      isSameDay(holiday.date, date),
    );
  };

  const isWorkingDay = (date: Date): boolean => {
    return !isWeekend(date) && !isPublicHoliday(date);
  };

  const getPublicHolidayName = (date: Date): string | null => {
    const holiday = holidays.find((h) =>
      isSameDay(h.date, date),
    );
    return holiday ? holiday.name : null;
  };

  const calculateWorkingDaysNeeded = (
    startDate: Date,
    totalDays: number,
  ): number => {
    let workingDays = 0;
    for (let i = 0; i < totalDays; i++) {
      const currentDate = addDays(startDate, i);
      if (isWorkingDay(currentDate)) {
        workingDays++;
      }
    }
    return workingDays;
  };

  const calculateOptimizationScores = (
    tripDays: number,
  ): DateOptimization[] => {
    const scores: DateOptimization[] = [];

    // Try all possible start dates in 2026
    let currentDate = new Date(2026, 0, 1);
    const endYear = new Date(2026, 11, 31);

    while (currentDate <= endYear) {
      const tripEndDate = addDays(currentDate, tripDays - 1);

      if (tripEndDate <= endYear) {
        const leaveDaysNeeded = calculateWorkingDaysNeeded(
          currentDate,
          tripDays,
        );
        const nearHolidays: string[] = [];

        // Check holidays within the trip
        for (let i = 0; i < tripDays; i++) {
          const checkDate = addDays(currentDate, i);
          const holidayName = getPublicHolidayName(checkDate);
          if (
            holidayName &&
            !nearHolidays.includes(holidayName)
          ) {
            nearHolidays.push(holidayName);
          }
        }

        const efficiency =
          leaveDaysNeeded > 0
            ? tripDays / leaveDaysNeeded
            : 999;

        scores.push({
          date: new Date(currentDate),
          efficiency,
          leaveDaysNeeded,
          nearHolidays,
        });
      }

      currentDate = addDays(currentDate, 1); // Check every day
    }

    return scores;
  };

  // Holiday management functions
  const addHoliday = () => {
    if (newHolidayName.trim() && newHolidayDate) {
      const holiday: Holiday = {
        name: newHolidayName.trim(),
        date: new Date(newHolidayDate),
      };
      setRawHolidays(
        [...rawHolidays, holiday].sort(
          (a, b) => a.date.getTime() - b.date.getTime(),
        ),
      );
      setNewHolidayName("");
      setNewHolidayDate("");
    }
  };

  const removeHoliday = (index: number) => {
    setRawHolidays(rawHolidays.filter((_, i) => i !== index));
  };

  const updateHoliday = (
    index: number,
    name: string,
    date: string,
  ) => {
    const updatedHolidays = [...rawHolidays];
    updatedHolidays[index] = {
      name,
      date: new Date(date),
    };
    setRawHolidays(
      updatedHolidays.sort(
        (a, b) => a.date.getTime() - b.date.getTime(),
      ),
    );
    setEditingHolidayId(null);
  };

  // Trip management functions
  const addTrip = () => {
    if (newTripDestination.trim()) {
      const trip: Trip = {
        id: Date.now().toString(),
        destination: newTripDestination.trim(),
        days: newTripDays,
        startDate: null,
        endDate: null,
      };
      setTrips([...trips, trip]);
      setNewTripDestination("");
      setNewTripDays(5);
      setSelectedTripId(trip.id);
    }
  };

  const removeTrip = (id: string) => {
    setTrips(trips.filter((t) => t.id !== id));
    if (selectedTripId === id) {
      const remainingTrips = trips.filter((t) => t.id !== id);
      setSelectedTripId(
        remainingTrips.length > 0 ? remainingTrips[0].id : null,
      );
    }
  };

  const updateTripDates = (
    id: string,
    startDate: Date | null,
    endDate: Date | null,
  ) => {
    setTrips(
      trips.map((t) =>
        t.id === id ? { ...t, startDate, endDate } : t,
      ),
    );
  };

  const optimizationScores = useMemo(() => {
    const scoresMap = new Map<string, DateOptimization[]>();
    trips.forEach((trip) => {
      scoresMap.set(
        trip.id,
        calculateOptimizationScores(trip.days),
      );
    });
    return scoresMap;
  }, [trips, holidays]);

  const totalLeaveUsed = useMemo(() => {
    let total = 0;
    trips.forEach((trip) => {
      if (trip.startDate && trip.endDate) {
        total += calculateWorkingDaysNeeded(
          trip.startDate,
          trip.days,
        );
      }
    });
    return total;
  }, [trips, holidays]);

  const selectedTrips = useMemo(() => {
    return trips.filter((t) => t.startDate && t.endDate);
  }, [trips]);

  const checkDateConflict = (
    currentTripId: string,
    date: Date | null,
  ): boolean => {
    if (!date) return false;

    const currentTrip = trips.find(
      (t) => t.id === currentTripId,
    );
    if (!currentTrip) return false;

    const endDate = addDays(date, currentTrip.days - 1);

    for (const trip of trips) {
      if (
        trip.id === currentTripId ||
        !trip.startDate ||
        !trip.endDate
      ) {
        continue;
      }

      if (
        datesOverlap(
          date,
          endDate,
          trip.startDate,
          trip.endDate,
        )
      ) {
        return true;
      }
    }

    return false;
  };

  // Export functions
  const exportToCSV = () => {
    const csvRows = [];

    // Header
    csvRows.push("Trip Summary Report");
    csvRows.push(`Generated on: ${format(new Date(), "PPP")}`);
    csvRows.push(`Annual Leave: ${annualLeave} days`);
    csvRows.push(`Total Leave Used: ${totalLeaveUsed} days`);
    csvRows.push(
      `Remaining Leave: ${annualLeave - totalLeaveUsed} days`,
    );
    csvRows.push("");

    // Trips
    csvRows.push(
      "Destination,Start Date,End Date,Total Days,Leave Days,Efficiency",
    );
    selectedTrips.forEach((trip) => {
      const leaveDays = calculateWorkingDaysNeeded(
        trip.startDate!,
        trip.days,
      );
      const efficiency = trip.days / leaveDays;
      csvRows.push(
        `"${trip.destination}","${format(trip.startDate!, "yyyy-MM-dd")}","${format(trip.endDate!, "yyyy-MM-dd")}",${trip.days},${leaveDays},${efficiency.toFixed(2)}`,
      );
    });

    csvRows.push("");
    csvRows.push("Public Holidays");
    csvRows.push("Name,Date");
    holidays.forEach((holiday) => {
      csvRows.push(
        `"${holiday.name}","${format(holiday.date, "yyyy-MM-dd")}"`,
      );
    });

    const csvContent = csvRows.join("\n");
    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `leave-plan-${format(new Date(), "yyyy-MM-dd")}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  // Prepare data for visualizations
  const TRIP_COLORS = [
    "bg-blue-500",
    "bg-purple-500",
    "bg-pink-500",
    "bg-green-500",
    "bg-orange-500",
    "bg-teal-500",
    "bg-red-500",
    "bg-indigo-500",
  ];

  const visualizationTrips = selectedTrips.map(
    (trip, index) => ({
      id: trip.id,
      destination: trip.destination,
      startDate: trip.startDate!,
      endDate: trip.endDate!,
      color: TRIP_COLORS[index % TRIP_COLORS.length],
      leaveDays: calculateWorkingDaysNeeded(
        trip.startDate!,
        trip.days,
      ),
      totalDays: trip.days,
    }),
  );

  return (
    <>
      {/* Export Button */}
      {selectedTrips.length > 0 && (
        <div className="mb-6 flex justify-end">
          <Button
            onClick={exportToCSV}
            variant="outline"
            className="gap-2"
          >
            <Download className="w-4 h-4" />
            Export to CSV
          </Button>
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Left column - Settings and Summary */}
        <div className="lg:col-span-1 space-y-6">
          {/* Settings Card */}
          <Card>
            <CardHeader>
              <CardTitle>Your Leave Balance</CardTitle>
              <CardDescription>
                Configure your available annual leave days
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="annual-leave">
                    Annual Leave Days
                  </Label>
                  <Input
                    id="annual-leave"
                    type="number"
                    min="1"
                    max="50"
                    value={annualLeave}
                    onChange={(e) =>
                      setAnnualLeave(
                        parseInt(e.target.value) || 0,
                      )
                    }
                  />
                </div>
              </div>
            </CardContent>

            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5" />
                Your Plan Summary
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-white p-4 rounded-lg">
                  <div className="text-sm text-gray-600 mb-1">
                    Leave Days Used
                  </div>
                  <div
                    className={`text-2xl font-bold ${totalLeaveUsed > annualLeave ? "text-red-600" : "text-indigo-600"}`}
                  >
                    {totalLeaveUsed}
                  </div>
                  <div className="text-xs text-gray-500">
                    of {annualLeave} available
                  </div>
                </div>
                <div className="bg-white p-4 rounded-lg">
                  <div className="text-sm text-gray-600 mb-1">
                    Trips Planned
                  </div>
                  <div className="text-2xl font-bold text-green-600">
                    {selectedTrips.length}
                  </div>
                  <div className="text-xs text-gray-500">
                    of {trips.length} total
                  </div>
                </div>
              </div>

              {totalLeaveUsed > annualLeave && (
                <div className="bg-red-100 border border-red-300 text-red-700 p-3 rounded-lg text-sm">
                  ⚠️ You've exceeded your leave balance by{" "}
                  {totalLeaveUsed - annualLeave} days
                </div>
              )}
            </CardContent>
          </Card>

          {/* Add Trip Card */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="w-5 h-5" />
                Plan Your Trips
              </CardTitle>
              <CardDescription>
                Add trips you want to take in 2026
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="destination">
                    Destination
                  </Label>
                  <Input
                    id="destination"
                    placeholder="e.g., Bangkok, Vietnam"
                    value={newTripDestination}
                    onChange={(e) =>
                      setNewTripDestination(e.target.value)
                    }
                    onKeyPress={(e) =>
                      e.key === "Enter" && addTrip()
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="days">Number of Days</Label>
                  <Input
                    id="days"
                    type="number"
                    min="1"
                    max="30"
                    value={newTripDays}
                    onChange={(e) =>
                      setNewTripDays(
                        parseInt(e.target.value) || 1,
                      )
                    }
                  />
                </div>
                <Button onClick={addTrip} className="w-full">
                  <Plus className="w-4 h-4 mr-2" />
                  Add Trip
                </Button>

                {trips.length > 0 && (
                  <>
                    <Separator />
                    <div className="space-y-2">
                      <div className="text-sm font-medium">
                        Your Trips:
                      </div>
                      {trips.map((trip) => (
                        <div
                          key={trip.id}
                          onClick={() =>
                            setSelectedTripId(trip.id)
                          }
                          className={`flex items-center justify-between p-2 rounded cursor-pointer transition-colors ${
                            selectedTripId === trip.id
                              ? "bg-indigo-100 border-2 border-indigo-500"
                              : "bg-gray-50 hover:bg-gray-100"
                          }`}
                        >
                          <div className="flex-1">
                            <div className="font-medium text-sm flex items-center gap-2">
                              {trip.destination}
                              {trip.startDate &&
                                trip.endDate && (
                                  <span className="text-green-600 text-xs">
                                    ✓
                                  </span>
                                )}
                            </div>
                            <div className="text-xs text-gray-600">
                              {trip.days} days
                              {trip.startDate &&
                                trip.endDate && (
                                  <span className="ml-1">
                                    •{" "}
                                    {format(
                                      trip.startDate,
                                      "MMM d",
                                    )}{" "}
                                    -{" "}
                                    {format(
                                      trip.endDate,
                                      "MMM d",
                                    )}
                                  </span>
                                )}
                            </div>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              removeTrip(trip.id);
                            }}
                          >
                            <Trash2 className="w-4 h-4 text-red-500" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  </>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Public Holidays Card */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <CalendarDays className="w-5 h-5" />
                  Public Holidays
                </CardTitle>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() =>
                    setEditingHolidayId(
                      editingHolidayId === -1 ? null : -1,
                    )
                  }
                >
                  <Edit2 className="w-4 h-4" />
                </Button>
              </div>
              <CardDescription>
                {editingHolidayId === -1
                  ? "Add a new holiday"
                  : "Manage your holidays"}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {editingHolidayId === -1 && (
                <div className="space-y-3 mb-4 p-3 bg-gray-50 rounded-lg">
                  <div className="space-y-2">
                    <Label htmlFor="holiday-name">
                      Holiday Name
                    </Label>
                    <Input
                      id="holiday-name"
                      placeholder="e.g., New Year's Day"
                      value={newHolidayName}
                      onChange={(e) =>
                        setNewHolidayName(e.target.value)
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="holiday-date">Date</Label>
                    <Input
                      id="holiday-date"
                      type="date"
                      value={newHolidayDate}
                      onChange={(e) =>
                        setNewHolidayDate(e.target.value)
                      }
                    />
                  </div>
                  <div className="flex gap-2">
                    <Button
                      onClick={addHoliday}
                      size="sm"
                      className="flex-1"
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Add
                    </Button>
                    <Button
                      onClick={() => {
                        setEditingHolidayId(null);
                        setNewHolidayName("");
                        setNewHolidayDate("");
                      }}
                      size="sm"
                      variant="outline"
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              )}

              <div className="space-y-2 max-h-80 overflow-y-auto">
                {rawHolidays.map((holiday, index) => (
                  <div
                    key={index}
                    className="flex justify-between items-center text-sm py-2 px-2 rounded hover:bg-gray-50"
                  >
                    {editingHolidayId === index ? (
                      <div className="flex-1 space-y-2">
                        <Input
                          defaultValue={holiday.name}
                          id={`edit-name-${index}`}
                        />
                        <Input
                          type="date"
                          defaultValue={format(
                            holiday.date,
                            "yyyy-MM-dd",
                          )}
                          id={`edit-date-${index}`}
                        />
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            onClick={() => {
                              const nameInput =
                                document.getElementById(
                                  `edit-name-${index}`,
                                ) as HTMLInputElement;
                              const dateInput =
                                document.getElementById(
                                  `edit-date-${index}`,
                                ) as HTMLInputElement;
                              updateHoliday(
                                index,
                                nameInput.value,
                                dateInput.value,
                              );
                            }}
                          >
                            Save
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() =>
                              setEditingHolidayId(null)
                            }
                          >
                            Cancel
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <>
                        <div className="flex-1">
                          <div className="text-gray-700">
                            {holiday.name}
                          </div>
                          <div className="text-xs text-gray-500">
                            {format(
                              holiday.date,
                              "EEEE, MMM d, yyyy",
                            )}
                          </div>
                        </div>
                        <div className="flex gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() =>
                              setEditingHolidayId(index)
                            }
                          >
                            <Edit2 className="w-3 h-3" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => removeHoliday(index)}
                          >
                            <Trash2 className="w-3 h-3 text-red-500" />
                          </Button>
                        </div>
                      </>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right column - Calendar Pickers */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Plane className="w-5 h-5" />
                Select Trip Dates
              </CardTitle>
              <CardDescription>
                Choose your departure date on the calendar.
                Optimal dates are marked with dots.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {trips.length === 0 ? (
                <div className="text-center py-12 text-gray-500">
                  <Plane className="w-16 h-16 mx-auto mb-4 opacity-30" />
                  <p className="text-lg mb-2">
                    No trips added yet
                  </p>
                  <p className="text-sm">
                    Add your trips in the left panel to select
                    dates
                  </p>
                </div>
              ) : selectedTripId ? (
                (() => {
                  const trip = trips.find(
                    (t) => t.id === selectedTripId,
                  );
                  if (!trip) return null;

                  const scores =
                    optimizationScores.get(trip.id) || [];
                  const otherTripsLeave =
                    totalLeaveUsed -
                    (trip.startDate
                      ? calculateWorkingDaysNeeded(
                          trip.startDate,
                          trip.days,
                        )
                      : 0);

                  const isDateDisabled = (date: Date) => {
                    const leaveDaysNeeded =
                      calculateWorkingDaysNeeded(
                        date,
                        trip.days,
                      );
                    const wouldExceedLeave =
                      otherTripsLeave + leaveDaysNeeded >
                      annualLeave;
                    const hasConflict = checkDateConflict(
                      trip.id,
                      date,
                    );
                    return wouldExceedLeave || hasConflict;
                  };

                  // Get all dates that are booked by other trips
                  const conflictDates: Date[] = [];
                  trips.forEach((otherTrip) => {
                    if (
                      otherTrip.id !== trip.id &&
                      otherTrip.startDate &&
                      otherTrip.endDate
                    ) {
                      let currentDate = new Date(
                        otherTrip.startDate,
                      );
                      const endDate = new Date(
                        otherTrip.endDate,
                      );
                      while (currentDate <= endDate) {
                        conflictDates.push(
                          new Date(currentDate),
                        );
                        currentDate = addDays(currentDate, 1);
                      }
                    }
                  });

                  return (
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="font-semibold text-lg text-gray-900">
                            {trip.destination}
                          </h3>
                          <p className="text-sm text-gray-600 mt-1">
                            Select departure date for your{" "}
                            {trip.days}-day trip
                          </p>
                        </div>
                        <Badge variant="outline">
                          {trip.days} days trip
                        </Badge>
                      </div>

                      <CalendarPicker
                        tripDays={trip.days}
                        onDateSelect={(start, end) =>
                          updateTripDates(trip.id, start, end)
                        }
                        selectedStartDate={trip.startDate}
                        selectedEndDate={trip.endDate}
                        holidays={holidays}
                        optimizationScores={scores}
                        isDateDisabled={isDateDisabled}
                        conflictDates={conflictDates}
                      />
                    </div>
                  );
                })()
              ) : (
                <div className="text-center py-12 text-gray-500">
                  <MapPin className="w-16 h-16 mx-auto mb-4 opacity-30" />
                  <p className="text-lg mb-2">
                    Select a trip to plan
                  </p>
                  <p className="text-sm">
                    Click on a trip in the left panel to start
                    planning
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Visualization Section */}
      {selectedTrips.length > 0 && (
        <Card className="mt-6">
          <CardContent className="pt-6">
            <Tabs defaultValue="timeline" className="w-full">
              <TabsList className="grid w-full grid-cols-2 max-w-md mx-auto mb-6">
                <TabsTrigger
                  value="timeline"
                  className="flex items-center gap-2"
                >
                  <ChartGantt className="w-4 h-4" />
                  Timeline
                </TabsTrigger>
                <TabsTrigger
                  value="calendar"
                  className="flex items-center gap-2"
                >
                  <Calendar className="w-4 h-4" />
                  Calendar
                </TabsTrigger>
              </TabsList>
              <TabsContent value="timeline">
                <TimelineView
                  holidays={holidays}
                  trips={visualizationTrips}
                />
              </TabsContent>
              <TabsContent value="calendar">
                <YearCalendar
                  year={2026}
                  holidays={holidays}
                  trips={visualizationTrips}
                />
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      )}
    </>
  );
}