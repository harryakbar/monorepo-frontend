import { format, addDays } from 'date-fns';

interface Trip {
  id: string;
  destination: string;
  startDate: Date;
  endDate: Date;
  color: string;
  leaveDays: number;
  totalDays: number;
}

interface Holiday {
  date: Date;
  name: string;
}

interface TimelineViewProps {
  holidays: Holiday[];
  trips: Trip[];
  compact?: boolean;
}

export function TimelineView({ holidays, trips, compact }: TimelineViewProps) {
  // Create a timeline for the entire year
  const startDate = new Date(2026, 0, 1);
  const endDate = new Date(2026, 11, 31);
  const totalDays = 365;

  const getPositionPercentage = (date: Date) => {
    const dayOfYear = Math.floor((date.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
    return (dayOfYear / totalDays) * 100;
  };

  const getWidthPercentage = (start: Date, end: Date) => {
    const days = Math.floor((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;
    return (days / totalDays) * 100;
  };

  // Group holidays by month for display
  const monthMarkers = Array.from({ length: 12 }, (_, i) => {
    const monthDate = new Date(2026, i, 1);
    return {
      date: monthDate,
      position: getPositionPercentage(monthDate),
      name: format(monthDate, 'MMM')
    };
  });

  return (
    <div className="space-y-6">
      {/* Timeline */}
      <div className={`relative bg-white rounded-lg border border-gray-200 ${compact ? 'p-3' : 'p-6'}`}>
        <h3 className={`font-semibold text-gray-900 ${compact ? 'text-xs mb-3' : 'mb-6'}`}>2026 Timeline</h3>
        
        {/* Month markers */}
        <div className={`relative mb-2 ${compact ? 'h-4' : 'h-8 mb-4'}`}>
          {monthMarkers.map((month, index) => (
            <div
              key={index}
              className="absolute top-0"
              style={{ left: `${month.position}%` }}
            >
              <div className={`text-gray-500 font-medium ${compact ? 'text-[9px]' : 'text-xs'}`}>{month.name}</div>
              {!compact && <div className="w-px h-4 bg-gray-300"></div>}
            </div>
          ))}
        </div>

        {/* Main timeline bar */}
        <div className={`relative bg-gray-50 rounded-lg ${compact ? 'h-12 mb-0' : 'h-24 mb-6'}`}>
          {/* Holidays */}
          {holidays.map((holiday, index) => {
            const position = getPositionPercentage(holiday.date);
            return (
              <div
                key={index}
                className={`absolute top-0 bottom-0 bg-red-500 z-10 ${compact ? 'w-0.5' : 'w-1'}`}
                style={{ left: `${position}%` }}
                title={holiday.name}
              >
                {!compact && (
                  <div className="absolute -top-6 left-1/2 transform -translate-x-1/2 text-xs text-red-600 font-medium whitespace-nowrap hidden lg:block">
                    {holiday.name.split(' ')[0]}
                  </div>
                )}
              </div>
            );
          })}

          {/* Trips */}
          {trips.map((trip, index) => {
            const position = getPositionPercentage(trip.startDate);
            const width = getWidthPercentage(trip.startDate, trip.endDate);
            
            return (
              <div
                key={trip.id}
                className={`absolute ${trip.color} opacity-90 hover:opacity-100 transition-opacity rounded shadow-sm cursor-pointer`}
                style={{
                  left: `${position}%`,
                  width: `${width}%`,
                  top: compact ? `${(index % 2) * 20 + 4}px` : `${(index % 3) * 28 + 8}px`,
                  height: compact ? '14px' : '24px',
                }}
                title={`${trip.destination}: ${format(trip.startDate, 'MMM d')} - ${format(trip.endDate, 'MMM d')}`}
              >
                {!compact && (
                  <div className="px-2 py-1 text-white text-xs font-medium truncate">
                    {trip.destination}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Trip Details - Hidden in compact mode */}
        {!compact && trips.length > 0 && (
          <div className="space-y-2">
            {trips.map((trip) => (
              <div
                key={trip.id}
                className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className={`w-4 h-4 ${trip.color} rounded`}></div>
                  <div>
                    <div className="font-medium text-sm">{trip.destination}</div>
                    <div className="text-xs text-gray-600">
                      {format(trip.startDate, 'MMM d')} - {format(trip.endDate, 'MMM d, yyyy')}
                    </div>
                  </div>
                </div>
                <div className="flex gap-4 text-xs text-gray-600">
                  <div>
                    <span className="font-medium text-indigo-600">{trip.leaveDays}</span> leave days
                  </div>
                  <div>
                    <span className="font-medium text-green-600">{trip.totalDays}</span> total days
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}