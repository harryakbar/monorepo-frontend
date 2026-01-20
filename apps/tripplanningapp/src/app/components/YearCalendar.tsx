import { addDays, endOfMonth, endOfWeek, format, getDay, isSameDay, isSameMonth, startOfMonth, startOfWeek } from 'date-fns';

interface Trip {
  id: string;
  destination: string;
  startDate: Date;
  endDate: Date;
  color: string;
}

interface Holiday {
  date: Date;
  name: string;
}

interface YearCalendarProps {
  year: number;
  holidays: Holiday[];
  trips: Trip[];
}

export function YearCalendar({ year, holidays, trips }: YearCalendarProps) {
  const months = Array.from({ length: 12 }, (_, i) => new Date(year, i, 1));

  const isDateInTrip = (date: Date): Trip | undefined => {
    return trips.find(trip => {
      const dateTime = date.getTime();
      return dateTime >= trip.startDate.getTime() && dateTime <= trip.endDate.getTime();
    });
  };

  const isHoliday = (date: Date): Holiday | undefined => {
    return holidays.find(holiday => isSameDay(holiday.date, date));
  };

  const renderMonth = (monthDate: Date) => {
    const monthStart = startOfMonth(monthDate);
    const monthEnd = endOfMonth(monthDate);
    const startDate = startOfWeek(monthStart);
    const endDate = endOfWeek(monthEnd);

    const days = [];
    let currentDate = startDate;

    while (currentDate <= endDate) {
      days.push(new Date(currentDate));
      currentDate = addDays(currentDate, 1);
    }

    return (
      <div key={monthDate.getMonth()} className="bg-white rounded-lg p-4 border border-gray-200">
        <div className="font-semibold text-center mb-3 text-gray-900">
          {format(monthDate, 'MMMM yyyy')}
        </div>
        
        {/* Weekday headers */}
        <div className="grid grid-cols-7 gap-1 mb-2">
          {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map(day => (
            <div key={day} className="text-xs font-medium text-gray-500 text-center">
              {day}
            </div>
          ))}
        </div>

        {/* Calendar days */}
        <div className="grid grid-cols-7 gap-1">
          {days.map((day, index) => {
            const trip = isDateInTrip(day);
            const holiday = isHoliday(day);
            const isCurrentMonth = isSameMonth(day, monthDate);
            const isWeekend = getDay(day) === 0 || getDay(day) === 6;

            return (
              <div
                key={index}
                className={`
                  aspect-square flex items-center justify-center rounded text-xs relative
                  ${!isCurrentMonth ? 'text-gray-300' : ''}
                  ${trip ? `${trip.color} text-white font-semibold` : ''}
                  ${!trip && holiday ? 'bg-red-100 text-red-700 font-semibold' : ''}
                  ${!trip && !holiday && isWeekend && isCurrentMonth ? 'bg-gray-100 text-gray-600' : ''}
                  ${!trip && !holiday && !isWeekend && isCurrentMonth ? 'text-gray-700' : ''}
                `}
                title={
                  trip 
                    ? `${trip.destination}: ${format(trip.startDate, 'MMM d')} - ${format(trip.endDate, 'MMM d')}`
                    : holiday 
                    ? holiday.name 
                    : ''
                }
              >
                {format(day, 'd')}
                {holiday && !trip && (
                  <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-1 h-1 bg-red-600 rounded-full"></div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <div>
      {/* Legend */}
      <div className="mb-6 p-4 bg-gray-50 rounded-lg">
        <div className="text-sm font-medium mb-3">Legend:</div>
        <div className="flex flex-wrap gap-4 text-xs">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 bg-red-100 border border-red-200 rounded flex items-center justify-center">
              <div className="w-1 h-1 bg-red-600 rounded-full"></div>
            </div>
            <span>Public Holiday</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 bg-gray-100 rounded"></div>
            <span>Weekend</span>
          </div>
          {trips.map(trip => (
            <div key={trip.id} className="flex items-center gap-2">
              <div className={`w-6 h-6 ${trip.color} rounded`}></div>
              <span>{trip.destination}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Calendar Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {months.map(month => renderMonth(month))}
      </div>
    </div>
  );
}
