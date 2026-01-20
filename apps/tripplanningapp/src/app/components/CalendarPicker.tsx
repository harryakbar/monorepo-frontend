import {
  addDays,
  addMonths,
  endOfMonth,
  endOfWeek,
  format,
  isBefore,
  isSameDay,
  isSameMonth,
  isWeekend,
  startOfMonth,
  startOfWeek
} from "date-fns";
import {
  ChevronLeft,
  ChevronRight,
  Info,
  Lightbulb,
  X,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";

interface Holiday {
  date: Date;
  name: string;
}

interface DateOptimization {
  date: Date;
  efficiency: number;
  leaveDaysNeeded: number;
  nearHolidays: string[];
}

interface BetterDateSuggestion {
  suggestedDate: Date;
  suggestedEndDate: Date;
  currentEfficiency: number;
  suggestedEfficiency: number;
  currentLeaveDaysNeeded: number;
  suggestedScore: DateOptimization;
}

interface CalendarPickerProps {
  tripDays: number;
  onDateSelect: (
    startDate: Date | null,
    endDate: Date | null,
  ) => void;
  selectedStartDate: Date | null;
  selectedEndDate: Date | null;
  holidays: Holiday[];
  optimizationScores: DateOptimization[];
  isDateDisabled?: (date: Date) => boolean;
  conflictDates?: Date[]; // Dates booked by other trips
}

export function CalendarPicker({
  tripDays,
  onDateSelect,
  selectedStartDate,
  selectedEndDate,
  holidays,
  optimizationScores,
  isDateDisabled,
  conflictDates,
}: CalendarPickerProps) {
  const [currentMonth, setCurrentMonth] = useState(
    new Date(2026, 0, 1),
  );
  const [suggestion, setSuggestion] =
    useState<BetterDateSuggestion | null>(null);

  const holidayByDay = useMemo(() => {
    const map = new Map<string, Holiday>();
    for (const h of holidays) {
      map.set(format(h.date, "yyyy-MM-dd"), h);
    }
    return map;
  }, [holidays]);

  const scoreByDay = useMemo(() => {
    const map = new Map<string, DateOptimization>();
    for (const s of optimizationScores) {
      map.set(format(s.date, "yyyy-MM-dd"), s);
    }
    return map;
  }, [optimizationScores]);

  const conflictDaySet = useMemo(() => {
    const set = new Set<string>();
    for (const d of conflictDates || []) {
      set.add(format(d, "yyyy-MM-dd"));
    }
    return set;
  }, [conflictDates]);

  const isHoliday = (date: Date): Holiday | undefined => {
    return holidayByDay.get(format(date, "yyyy-MM-dd"));
  };

  const getOptimizationScore = (
    date: Date,
  ): DateOptimization | undefined => {
    return scoreByDay.get(format(date, "yyyy-MM-dd"));
  };

  // Find better date suggestions nearby
  const findBetterDateNearby = (
    selectedDate: Date,
  ): BetterDateSuggestion | null => {
    const currentScore = getOptimizationScore(selectedDate);
    const currentEfficiency = currentScore?.efficiency || 0;
    const currentLeaveDaysNeeded = currentScore?.leaveDaysNeeded ?? 0;

    // Check dates within ±5 days
    const nearbyDates: DateOptimization[] = [];
    for (let offset = -5; offset <= 5; offset++) {
      if (offset === 0) continue; // Skip the selected date itself
      const checkDate = addDays(selectedDate, offset);

      // Check if date is disabled or conflicts
      const isDisabled = isDateDisabled
        ? isDateDisabled(checkDate)
        : false;
      const hasConflict = conflictDates?.some((conflict) =>
        isSameDay(conflict, checkDate),
      );

      if (!isDisabled && !hasConflict) {
        const score = getOptimizationScore(checkDate);
        if (
          score &&
          score.efficiency > currentEfficiency + 0.5
        ) {
          nearbyDates.push(score);
        }
      }
    }

    // Find the best alternative
    if (nearbyDates.length > 0) {
      const best = nearbyDates.reduce((prev, curr) =>
        curr.efficiency > prev.efficiency ? curr : prev,
      );

      return {
        suggestedDate: best.date,
        suggestedEndDate: addDays(best.date, tripDays - 1),
        currentEfficiency,
        suggestedEfficiency: best.efficiency,
        currentLeaveDaysNeeded,
        suggestedScore: best,
      };
    }

    return null;
  };

  // Check for better dates when selection changes
  useEffect(() => {
    if (selectedStartDate && selectedEndDate) {
      const betterOption = findBetterDateNearby(
        selectedStartDate,
      );
      setSuggestion(betterOption);
    } else {
      setSuggestion(null);
    }
  }, [selectedStartDate, selectedEndDate, scoreByDay]);

  const handleAcceptSuggestion = () => {
    if (suggestion) {
      onDateSelect(
        suggestion.suggestedDate,
        suggestion.suggestedEndDate,
      );
      setSuggestion(null);
    }
  };

  const handleDismissSuggestion = () => {
    setSuggestion(null);
  };

  const isInRange = (date: Date): boolean => {
    if (!selectedStartDate) return false;
    if (!selectedEndDate) {
      // Show preview range based on trip days
      const previewEnd = addDays(
        selectedStartDate,
        tripDays - 1,
      );
      return date >= selectedStartDate && date <= previewEnd;
    }
    return date >= selectedStartDate && date <= selectedEndDate;
  };

  const handleDateClick = (date: Date) => {
    if (isDateDisabled && isDateDisabled(date)) return;

    if (
      !selectedStartDate ||
      (selectedStartDate && selectedEndDate)
    ) {
      // Start new selection
      const endDate = addDays(date, tripDays - 1);
      onDateSelect(date, endDate);
    } else {
      // Already have start date, set end date
      const daysBetween = Math.abs(
        Math.floor(
          (date.getTime() - selectedStartDate.getTime()) /
            (1000 * 60 * 60 * 24),
        ),
      );

      if (daysBetween + 1 === tripDays) {
        // Exact match
        if (date > selectedStartDate) {
          onDateSelect(selectedStartDate, date);
        } else {
          onDateSelect(date, selectedStartDate);
        }
      } else {
        // Start new selection
        const endDate = addDays(date, tripDays - 1);
        onDateSelect(date, endDate);
      }
    }
  };

  const renderMonth = (monthDate: Date) => {
    const monthStart = startOfMonth(monthDate);
    const monthEnd = endOfMonth(monthDate);
    const startDate = startOfWeek(monthStart);
    const endDate = endOfWeek(monthEnd);

    const rows: Date[][] = [];
    let days: Date[] = [];
    let day = startDate;

    while (day <= endDate) {
      for (let i = 0; i < 7; i++) {
        days.push(day);
        day = addDays(day, 1);
      }
      rows.push(days);
      days = [];
    }

    return (
      <div className="flex-1 min-w-[280px]">
        <div className="text-center font-semibold mb-3 text-gray-900">
          {format(monthDate, "MMMM yyyy")}
        </div>
        <div className="grid grid-cols-7 gap-1">
          {/* Day headers */}
          {["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"].map(
            (day) => (
              <div
                key={day}
                className="text-center text-xs font-medium text-gray-500 pb-2"
              >
                {day}
              </div>
            ),
          )}

          {/* Calendar days */}
          {rows.map((week, weekIdx) =>
            week.map((day, dayIdx) => {
              const isCurrentMonth = isSameMonth(
                day,
                monthDate,
              );
              const holiday = isHoliday(day);
              const optimization = getOptimizationScore(day);
              const inRange = isInRange(day);
              const isStart =
                selectedStartDate &&
                isSameDay(day, selectedStartDate);
              const isEnd =
                selectedEndDate &&
                isSameDay(day, selectedEndDate);
              const isWeekendDay = isWeekend(day);
              const disabled = isDateDisabled
                ? isDateDisabled(day)
                : false;
              const isPast = isBefore(
                day,
                new Date(2026, 0, 1),
              );
              const isConflict = conflictDaySet.has(
                format(day, "yyyy-MM-dd"),
              );

              let optimizationLevel = 0;
              if (optimization) {
                if (optimization.efficiency >= 3)
                  optimizationLevel = 3; // Excellent
                else if (optimization.efficiency >= 2)
                  optimizationLevel = 2; // Good
                else if (optimization.efficiency >= 1.5)
                  optimizationLevel = 1; // OK
              }

              return (
                <button
                  key={`${weekIdx}-${dayIdx}`}
                  onClick={() => handleDateClick(day)}
                  disabled={
                    disabled || !isCurrentMonth || isPast
                  }
                  className={`
                    relative aspect-square p-1 text-sm rounded-lg transition-all
                    ${!isCurrentMonth ? "text-gray-300 cursor-default" : ""}
                    ${isCurrentMonth && !disabled && !isPast && !isConflict ? "hover:bg-indigo-50 cursor-pointer" : ""}
                    ${disabled && !isConflict ? "opacity-30 cursor-not-allowed" : ""}
                    ${isPast ? "opacity-20 cursor-not-allowed" : ""}
                    ${inRange && isCurrentMonth ? "bg-indigo-100" : ""}
                    ${(isStart || isEnd) && isCurrentMonth ? "bg-indigo-600 text-white font-bold border-4 border-indigo-800 shadow-lg scale-105 ring-2 ring-indigo-300" : ""}
                    ${isConflict && isCurrentMonth ? "bg-orange-100 border-2 border-orange-400 cursor-not-allowed" : ""}
                    ${holiday && isCurrentMonth && !inRange && !isConflict ? "bg-red-50 border border-red-200" : ""}
                    ${isWeekendDay && isCurrentMonth && !inRange && !holiday && !isConflict ? "bg-gray-50" : ""}
                  `}
                >
                  <div className="flex flex-col items-center justify-center h-full">
                    <span
                      className={
                        isStart || isEnd
                          ? "text-white font-bold"
                          : isConflict
                            ? "text-orange-700 font-medium"
                            : ""
                      }
                    >
                      {format(day, "d")}
                    </span>

                    {/* Conflict indicator */}
                    {isConflict &&
                      isCurrentMonth &&
                      !inRange && (
                        <div className="absolute top-0.5 right-0.5">
                          <div className="w-2 h-2 rounded-full bg-orange-500" />
                        </div>
                      )}

                    {/* Optimization indicator dots */}
                    {isCurrentMonth &&
                      !inRange &&
                      !isConflict &&
                      optimizationLevel > 0 && (
                        <div className="flex gap-0.5 mt-0.5">
                          {Array.from({
                            length: optimizationLevel,
                          }).map((_, i) => (
                            <div
                              key={i}
                              className={`w-1 h-1 rounded-full ${
                                optimizationLevel === 3
                                  ? "bg-green-500"
                                  : optimizationLevel === 2
                                    ? "bg-blue-500"
                                    : "bg-yellow-500"
                              }`}
                            />
                          ))}
                        </div>
                      )}

                    {/* Holiday indicator */}
                    {holiday &&
                      isCurrentMonth &&
                      !inRange &&
                      !isConflict && (
                        <div className="absolute bottom-0.5 left-1/2 -translate-x-1/2">
                          <div className="w-1 h-1 rounded-full bg-red-500" />
                        </div>
                      )}
                  </div>
                </button>
              );
            }),
          )}
        </div>
      </div>
    );
  };

  const months = [
    currentMonth,
    addMonths(currentMonth, 1),
  ];

  return (
    <div className="space-y-4">
      {/* Navigation */}
      <div className="flex items-center justify-between">
        <Button
          variant="outline"
          size="sm"
          onClick={() =>
            setCurrentMonth(addMonths(currentMonth, -2))
          }
          disabled={currentMonth <= new Date(2026, 0, 1)}
        >
          <ChevronLeft className="w-4 h-4" />
        </Button>
        <div className="text-xs sm:text-sm text-gray-600 text-center px-2">
          Select your departure date ({tripDays} days trip)
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() =>
            setCurrentMonth(addMonths(currentMonth, 2))
          }
          disabled={currentMonth >= new Date(2026, 12, 1)}
        >
          <ChevronRight className="w-4 h-4" />
        </Button>
      </div>

      {/* Calendar grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
        {months.map((month, idx) => (
          <div key={idx}>{renderMonth(month)}</div>
        ))}
      </div>

      {/* Legend */}
      <div className="flex flex-wrap items-center gap-4 text-xs text-gray-600 pt-4 border-t">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 bg-indigo-500 rounded flex items-center justify-center text-white text-xs">
            1
          </div>
          <span>Selected dates</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 bg-orange-100 border-2 border-orange-400 rounded relative flex items-center justify-center">
            <div className="absolute top-0.5 right-0.5 w-2 h-2 rounded-full bg-orange-500" />
          </div>
          <span className="flex items-center gap-1">
            <span className="font-medium text-orange-700">
              Orange dot:
            </span>{" "}
            Already booked by another trip
          </span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 bg-red-50 border border-red-200 rounded flex items-center justify-center">
            <div className="w-1 h-1 rounded-full bg-red-500" />
          </div>
          <span className="flex items-center gap-1">
            <span className="font-medium text-red-700">
              Red dot:
            </span>{" "}
            Public holiday
          </span>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex gap-0.5">
            <div className="w-1.5 h-1.5 rounded-full bg-green-500" />
            <div className="w-1.5 h-1.5 rounded-full bg-green-500" />
            <div className="w-1.5 h-1.5 rounded-full bg-green-500" />
          </div>
          <span className="flex items-center gap-1">
            <span className="font-medium text-green-700">
              Green/blue/yellow dots:
            </span>{" "}
            Optimization score (more dots = better)
          </span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 bg-gray-50 rounded" />
          <span>Weekend</span>
        </div>
      </div>

      {/* Selected date info */}
      {selectedStartDate && selectedEndDate && (
        <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-4 space-y-2">
          <div className="flex items-start gap-2">
            <Info className="w-4 h-4 text-indigo-600 mt-0.5 flex-shrink-0" />
            <div className="flex-1">
              <div className="font-medium text-indigo-900 mb-2">
                {format(selectedStartDate, "EEE, MMM d")} →{" "}
                {format(selectedEndDate, "EEE, MMM d, yyyy")}
              </div>
              {getOptimizationScore(selectedStartDate) && (
                <div className="space-y-1 text-sm">
                  {getOptimizationScore(selectedStartDate)!
                    .nearHolidays.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {getOptimizationScore(
                        selectedStartDate,
                      )!.nearHolidays.map((holiday, idx) => (
                        <Badge
                          key={idx}
                          variant="secondary"
                          className="text-xs"
                        >
                          {holiday}
                        </Badge>
                      ))}
                    </div>
                  )}
                  <div className="text-indigo-700">
                    Leave needed:{" "}
                    <span className="font-semibold">
                      {
                        getOptimizationScore(selectedStartDate)!
                          .leaveDaysNeeded
                      }{" "}
                      days
                    </span>{" "}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Better date suggestion */}
      {suggestion && (
        <div className="bg-amber-50 border-2 border-amber-300 rounded-lg p-4 animate-in slide-in-from-top-2">
          <div className="flex items-start gap-3">
            <Lightbulb className="w-5 h-5 text-amber-600 mt-0.5 flex-shrink-0" />
            <div className="flex-1 space-y-3">
              <div>
                <div className="font-semibold text-amber-900 mb-1">
                  💡 Better Option Nearby!
                </div>
                <p className="text-sm text-amber-800">
                  Starting on{" "}
                  <strong>
                    {format(
                      suggestion.suggestedDate,
                      "EEE, MMM d",
                    )}
                  </strong>{" "}
                  needs{" "}
                  <strong className="text-green-700">
                    {suggestion.suggestedScore.leaveDaysNeeded} leave
                    day
                    {suggestion.suggestedScore.leaveDaysNeeded !== 1
                      ? "s"
                      : ""}
                  </strong>{" "}
                  (vs {suggestion.currentLeaveDaysNeeded} for your
                  current selection)
                </p>
              </div>

              {suggestion.suggestedScore.nearHolidays.length >
                0 && (
                <div className="flex flex-wrap gap-1">
                  {suggestion.suggestedScore.nearHolidays.map(
                    (holiday, idx) => (
                      <Badge
                        key={idx}
                        variant="secondary"
                        className="text-xs bg-green-100 text-green-800"
                      >
                        {holiday}
                      </Badge>
                    ),
                  )}
                </div>
              )}

              <div className="text-xs text-amber-700 bg-white/50 rounded px-2 py-1.5 inline-block">
                📅 {format(suggestion.suggestedDate, "MMM d")} →{" "}
                {format(
                  suggestion.suggestedEndDate,
                  "MMM d, yyyy",
                )}{" "}
                • Leave:{" "}
                {suggestion.suggestedScore.leaveDaysNeeded} days
              </div>

              <div className="flex flex-col md:flex-row md:items-center gap-2 pt-1">
                <Button
                  size="sm"
                  className="bg-amber-600 hover:bg-amber-700 text-white"
                  onClick={handleAcceptSuggestion}
                >
                  Switch to This Date
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-amber-700 hover:text-amber-900 hover:bg-amber-100"
                  onClick={handleDismissSuggestion}
                >
                  <X className="w-3 h-3 mr-1" />
                  Keep My Selection
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}