import { addDays, format, isWeekend, startOfDay } from "date-fns";
import {
  Calendar,
  Check,
  Lightbulb,
  MapPin,
  MessageSquare,
  Plus,
  Send,
  ThumbsUp,
  Users,
  X,
} from "lucide-react";
import { useMemo, useState } from "react";
import type { Holiday, Trip } from "../utils/storage";
import { CalendarPicker } from "./CalendarPicker";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "./ui/card";
import { Label } from "./ui/label";
import { Textarea } from "./ui/textarea";

interface GroupTripViewProps {
  trip: Trip;
  allTrips: Trip[];
  holidays: Holiday[];
  year: number;
  currentUserId: string;
  currentUserEmail: string;
  currentUserName: string;
  onUpdateTrip: (tripId: string, updates: Partial<Trip>) => void;
  onSuggestDate: (
    tripId: string,
    startDate: Date,
    endDate: Date,
    reason?: string
  ) => void;
  onVoteDate: (tripId: string, suggestionId: string) => void;
  onAddComment: (tripId: string, text: string) => void;
  onConfirmDates: (tripId: string, startDate: Date, endDate: Date) => void;
  onClose?: () => void;
}

export function GroupTripView({
  trip,
  allTrips,
  holidays,
  year,
  currentUserId,
  currentUserEmail,
  currentUserName: _currentUserName,
  onUpdateTrip: _onUpdateTrip,
  onSuggestDate,
  onVoteDate,
  onAddComment,
  onConfirmDates,
  onClose,
}: GroupTripViewProps) {
  void _currentUserName;
  void _onUpdateTrip;
  const [showDateSuggestion, setShowDateSuggestion] = useState(false);
  const [suggestedStartDate, setSuggestedStartDate] = useState<Date | null>(
    null
  );
  const [suggestedEndDate, setSuggestedEndDate] = useState<Date | null>(null);
  const [suggestionReason, setSuggestionReason] = useState("");
  const [newComment, setNewComment] = useState("");
  const [showFinalizeDates, setShowFinalizeDates] = useState(false);
  const [finalStartDate, setFinalStartDate] = useState<Date | null>(null);
  const [finalEndDate, setFinalEndDate] = useState<Date | null>(null);

  const groupTripData = trip.groupTripData;
  const members = groupTripData?.members ?? [];
  const suggestedDates = groupTripData?.suggestedDates ?? [];
  const comments = groupTripData?.comments ?? [];

  const isOwner =
    groupTripData?.createdBy === currentUserId ||
    members.find((m) => m.userId === currentUserId)?.role === "owner";

  // Calculate optimization scores for date suggestions
  const optimizationScores = useMemo(() => {
    const scores: {
      date: Date;
      efficiency: number;
      leaveDaysNeeded: number;
      nearHolidays: string[];
    }[] = [];
    const MS_PER_DAY = 24 * 60 * 60 * 1000;
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

    // Prefix sum of working days
    const prefix = new Array<number>(daysInYear + 1);
    prefix[0] = 0;
    for (let i = 0; i < daysInYear; i++) {
      const d = addDays(yearStart, i);
      const isWorking = !isWeekend(d) && !holidayIndexToName.has(i);
      prefix[i + 1] = prefix[i] + (isWorking ? 1 : 0);
    }

    const lastStartIdx = daysInYear - trip.days;
    if (lastStartIdx < 0) return [];

    for (let startIdx = 0; startIdx <= lastStartIdx; startIdx++) {
      const endIdx = startIdx + trip.days - 1;
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
        efficiency: trip.days / leaveDaysNeeded,
        leaveDaysNeeded,
        nearHolidays: Array.from(new Set(nearHolidays)),
      });
    }

    // CalendarPicker does O(1) lookups by date-key now, so sorting isn't required.
    return scores;
  }, [trip.days, holidays, year]);

  const handleSuggestDate = () => {
    if (suggestedStartDate && suggestedEndDate) {
      onSuggestDate(
        trip.id,
        suggestedStartDate,
        suggestedEndDate,
        suggestionReason.trim() || undefined
      );
      setSuggestedStartDate(null);
      setSuggestedEndDate(null);
      setSuggestionReason("");
      setShowDateSuggestion(false);
    }
  };

  const handleAddComment = () => {
    if (newComment.trim()) {
      onAddComment(trip.id, newComment.trim());
      setNewComment("");
    }
  };

  const handleFinalizeDates = () => {
    if (finalStartDate && finalEndDate) {
      onConfirmDates(trip.id, finalStartDate, finalEndDate);
      setShowFinalizeDates(false);
      setFinalStartDate(null);
      setFinalEndDate(null);
    }
  };

  const getConflictDates = (): Date[] => {
    const conflicts: Date[] = [];
    allTrips.forEach((t) => {
      if (t.id === trip.id || !t.startDate || !t.endDate) return;
      let current = new Date(t.startDate);
      while (current <= t.endDate) {
        conflicts.push(new Date(current));
        current = addDays(current, 1);
      }
    });
    return conflicts;
  };

  // Sort suggested dates by vote count (descending)
  const sortedSuggestions = [...suggestedDates].sort(
    (a, b) => b.votes.length - a.votes.length
  );

  if (!groupTripData) return null;

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <MapPin className="w-6 h-6" />
            {trip.destination}
          </h2>
          <p className="text-muted-foreground">
            {trip.days} days • {members.length} member
            {members.length !== 1 ? "s" : ""}
          </p>
        </div>
        <Button variant="ghost" size="sm" onClick={onClose}>
          <X className="w-4 h-4" />
        </Button>
      </div>

      {/* Status Badge */}
      <div>
        <Badge
          variant={
            groupTripData.status === "confirmed" ? "default" : "secondary"
          }
        >
          {groupTripData.status === "confirmed" ? "Confirmed" : "Planning"}
        </Badge>
        {trip.startDate && trip.endDate && (
          <span className="ml-2 text-sm text-muted-foreground">
            {format(trip.startDate, "MMM d")} -{" "}
            {format(trip.endDate, "MMM d, yyyy")}
          </span>
        )}
      </div>

      {/* Members */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Users className="w-5 h-5" />
            Members
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {members.map((member) => (
              <Badge key={member.userId} variant="outline" className="text-sm">
                {member.displayName || member.email}
                {member.role === "owner" && " (Owner)"}
                {member.userId === currentUserId && " (You)"}
              </Badge>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Suggested Dates */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg flex items-center gap-2">
              <Calendar className="w-5 h-5" />
              Suggested Dates
            </CardTitle>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowDateSuggestion(!showDateSuggestion)}
            >
              <Plus className="w-4 h-4 mr-1" />
              Suggest Date
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Date Suggestion Form */}
          {showDateSuggestion && (
            <Card className="bg-blue-50 border-blue-200">
              <CardHeader>
                <CardTitle className="text-base">
                  Suggest a Date Range
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <CalendarPicker
                  tripDays={trip.days}
                  onDateSelect={(start, end) => {
                    setSuggestedStartDate(start);
                    setSuggestedEndDate(end);
                  }}
                  selectedStartDate={suggestedStartDate}
                  selectedEndDate={suggestedEndDate}
                  holidays={holidays}
                  optimizationScores={optimizationScores}
                  conflictDates={getConflictDates()}
                />
                <div>
                  <Label htmlFor="reason">Reason (optional)</Label>
                  <Textarea
                    id="reason"
                    placeholder="Why this date works for you..."
                    value={suggestionReason}
                    onChange={(e) => setSuggestionReason(e.target.value)}
                    rows={2}
                  />
                </div>
                <div className="flex gap-2">
                  <Button
                    onClick={handleSuggestDate}
                    disabled={!suggestedStartDate || !suggestedEndDate}
                  >
                    <Lightbulb className="w-4 h-4 mr-2" />
                    Suggest Date
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setShowDateSuggestion(false);
                      setSuggestedStartDate(null);
                      setSuggestedEndDate(null);
                      setSuggestionReason("");
                    }}
                  >
                    Cancel
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Suggested Dates List */}
          {sortedSuggestions.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Calendar className="w-12 h-12 mx-auto mb-2 opacity-50" />
              <p>No date suggestions yet. Be the first to suggest a date!</p>
            </div>
          ) : (
            <div className="space-y-3">
              {sortedSuggestions.map((suggestion) => {
                const hasVoted =
                  suggestion.votes.includes(currentUserId) ||
                  suggestion.votes.includes(currentUserEmail);
                const voteCount = suggestion.votes.length;
                const suggestedBy = members.find(
                  (m) => m.userId === suggestion.suggestedBy
                );

                return (
                  <Card
                    key={suggestion.id}
                    className={`${
                      voteCount > 0
                        ? "border-green-200 bg-green-50"
                        : "border-gray-200"
                    }`}
                  >
                    <CardContent className="pt-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <div className="font-semibold">
                              {format(suggestion.startDate, "MMM d")} -{" "}
                              {format(suggestion.endDate, "MMM d, yyyy")}
                            </div>
                            {voteCount > 0 && (
                              <Badge variant="default" className="bg-green-600">
                                {voteCount} vote{voteCount !== 1 ? "s" : ""}
                              </Badge>
                            )}
                          </div>
                          {suggestion.reason && (
                            <p className="text-sm text-muted-foreground mb-2">
                              {suggestion.reason}
                            </p>
                          )}
                          <div className="text-xs text-muted-foreground">
                            Suggested by{" "}
                            {suggestedBy?.displayName ||
                              suggestedBy?.email ||
                              "Unknown"}
                            {" • "}
                            {format(suggestion.createdAt, "MMM d, yyyy")}
                          </div>
                        </div>
                        <Button
                          variant={hasVoted ? "default" : "outline"}
                          size="sm"
                          onClick={() => onVoteDate(trip.id, suggestion.id)}
                          className="ml-4"
                        >
                          <ThumbsUp
                            className={`w-4 h-4 mr-1 ${
                              hasVoted ? "fill-current" : ""
                            }`}
                          />
                          {hasVoted ? "Voted" : "Vote"}
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}

          {/* Finalize Dates (Owner only) - Show even if dates are set (for editing) */}
          {isOwner && sortedSuggestions.length > 0 && (
            <Card className="bg-amber-50 border-amber-200">
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Check className="w-5 h-5" />
                  Finalize Dates
                </CardTitle>
                <CardDescription>
                  As the trip owner, you can finalize the dates for this trip
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {!showFinalizeDates ? (
                  <div className="space-y-2">
                    <p className="text-sm text-muted-foreground">
                      Choose from the suggested dates above or select custom
                      dates
                    </p>
                    <Button
                      onClick={() => setShowFinalizeDates(true)}
                      variant="outline"
                    >
                      <Check className="w-4 h-4 mr-2" />
                      Finalize Dates
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <CalendarPicker
                      tripDays={trip.days}
                      onDateSelect={(start, end) => {
                        setFinalStartDate(start);
                        setFinalEndDate(end);
                      }}
                      selectedStartDate={finalStartDate}
                      selectedEndDate={finalEndDate}
                      holidays={holidays}
                      optimizationScores={optimizationScores}
                      conflictDates={getConflictDates()}
                    />
                    <div className="flex gap-2">
                      <Button
                        onClick={handleFinalizeDates}
                        disabled={!finalStartDate || !finalEndDate}
                      >
                        <Check className="w-4 h-4 mr-2" />
                        Confirm Dates
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => {
                          setShowFinalizeDates(false);
                          setFinalStartDate(null);
                          setFinalEndDate(null);
                        }}
                      >
                        Cancel
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </CardContent>
      </Card>

      {/* Comments/Chat */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <MessageSquare className="w-5 h-5" />
            Discussion
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Comments List */}
          <div className="space-y-3 max-h-64 overflow-y-auto">
            {comments.length === 0 ? (
              <div className="text-center py-4 text-muted-foreground text-sm">
                No comments yet. Start the conversation!
              </div>
            ) : (
              comments.map((comment) => {
                const commenter = members.find(
                  (m) => m.userId === comment.userId
                );
                return (
                  <div
                    key={comment.id}
                    className="bg-gray-50 rounded-lg p-3 space-y-1"
                  >
                    <div className="flex items-center justify-between">
                      <div className="font-medium text-sm">
                        {comment.userName ||
                          commenter?.displayName ||
                          commenter?.email ||
                          "Unknown"}
                        {comment.userId === currentUserId && " (You)"}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {format(comment.createdAt, "MMM d, h:mm a")}
                      </div>
                    </div>
                    <p className="text-sm">{comment.text}</p>
                  </div>
                );
              })
            )}
          </div>

          {/* Add Comment */}
          <div className="space-y-2 border-t pt-4">
            <Label htmlFor="comment">Add a comment</Label>
            <div className="flex gap-2">
              <Textarea
                id="comment"
                placeholder="Share your thoughts..."
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && e.metaKey) {
                    handleAddComment();
                  }
                }}
                rows={2}
                className="flex-1"
              />
              <Button
                onClick={handleAddComment}
                disabled={!newComment.trim()}
                size="icon"
              >
                <Send className="w-4 h-4" />
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              Press Cmd+Enter to send
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
