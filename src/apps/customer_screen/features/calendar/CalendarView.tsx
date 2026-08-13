import React, { useState, useMemo } from 'react';
import { Calendar as BigCalendar, dateFnsLocalizer, Views } from 'react-big-calendar';
import { format, parse, startOfWeek, getDay, addDays, subDays, addWeeks, subWeeks, addMonths, subMonths } from 'date-fns';
import { de } from 'date-fns/locale/de';
import { View } from 'react-big-calendar';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import { Calendar as CalendarIcon, Clock, Plus, Loader2, ChevronLeft, ChevronRight, X, Trash2 } from 'lucide-react';
import { useAppointments, Appointment } from './useAppointments';

const locales = {
  'de': de,
};

const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek: () => startOfWeek(new Date(), { weekStartsOn: 1 }),
  getDay,
  locales,
});

export const CalendarView: React.FC = () => {
  const { appointments, loading, addAppointment, deleteAppointment } = useAppointments();
  const [view, setView] = useState<View>(Views.WEEK);
  const [date, setDate] = useState(new Date());
  const [selectedEvent, setSelectedEvent] = useState<any>(null);

  const handleNavigate = (direction: 'PREV' | 'NEXT') => {
    if (view === Views.MONTH) {
      setDate(prev => direction === 'PREV' ? subMonths(prev, 1) : addMonths(prev, 1));
    } else if (view === Views.WEEK) {
      setDate(prev => direction === 'PREV' ? subWeeks(prev, 1) : addWeeks(prev, 1));
    } else {
      setDate(prev => direction === 'PREV' ? subDays(prev, 1) : addDays(prev, 1));
    }
  };

  const events = useMemo(() => {
    return appointments.map(appt => ({
      id: appt.id,
      title: appt.title,
      start: new Date(appt.start_time),
      end: new Date(appt.end_time),
      resource: appt,
    }));
  }, [appointments]);

  const handleSelectSlot = async ({ start, end }: { start: Date; end: Date }) => {
    const title = window.prompt('Neuer Termin Name:');
    if (title) {
      await addAppointment({
        title,
        start_time: start.toISOString(),
        end_time: end.toISOString(),
        status: 'confirmed'
      });
    }
  };

  const handleSelectEvent = (event: any) => {
    setSelectedEvent(event);
  };

  const handleDeleteEvent = async () => {
    if (selectedEvent && window.confirm('Möchten Sie diesen Termin wirklich löschen?')) {
      await deleteAppointment(selectedEvent.id);
      setSelectedEvent(null);
    }
  };

  const eventStyleGetter = (event: any) => {
    return {
      style: {
        backgroundColor: '#3b82f6',
        borderRadius: '6px',
        opacity: 0.9,
        color: 'white',
        border: '0px',
        display: 'block'
      }
    };
  };

  const getDateLabel = () => {
    if (view === Views.MONTH) {
      return format(date, 'MMMM yyyy', { locale: de });
    }
    if (view === Views.WEEK) {
      const start = startOfWeek(date, { weekStartsOn: 1 });
      const end = addDays(start, 6);
      return `${format(start, 'd. MMM', { locale: de })} - ${format(end, 'd. MMM yyyy', { locale: de })}`;
    }
    return format(date, 'EEEE, d. MMMM yyyy', { locale: de });
  };

  return (
    <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6 flex flex-col h-[calc(100vh-4rem)]">
      <div className="flex items-center justify-between shrink-0">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Kalender</h1>
          <p className="text-xs text-slate-500 mt-1">Verwalten Sie Termine. Lisa synchronisiert sich automatisch mit diesen Zeiten.</p>
        </div>
        <div className="flex space-x-4 items-center">
          <div className="flex space-x-1 shrink-0">
            <button 
              onClick={() => handleNavigate('PREV')}
              className="flex items-center space-x-1 px-3 py-1.5 bg-white border border-slate-200 text-slate-600 rounded-lg text-sm font-medium hover:bg-slate-50 transition-colors whitespace-nowrap shrink-0"
            >
              <ChevronLeft className="w-4 h-4 -ml-1 shrink-0" />
              <span className="whitespace-nowrap">{view === Views.MONTH ? 'Letzter Monat' : view === Views.WEEK ? 'Letzte Woche' : 'Letzter Tag'}</span>
            </button>
            <button 
              onClick={() => setDate(new Date())}
              className="px-3 py-1.5 bg-white border border-slate-200 text-slate-600 rounded-lg text-sm font-medium hover:bg-slate-50 transition-colors whitespace-nowrap shrink-0"
            >
              Heute
            </button>
            <button 
              onClick={() => handleNavigate('NEXT')}
              className="flex items-center space-x-1 px-3 py-1.5 bg-white border border-slate-200 text-slate-600 rounded-lg text-sm font-medium hover:bg-slate-50 transition-colors whitespace-nowrap shrink-0"
            >
              <span className="whitespace-nowrap">{view === Views.MONTH ? 'Nächster Monat' : view === Views.WEEK ? 'Nächste Woche' : 'Nächster Tag'}</span>
              <ChevronRight className="w-4 h-4 -mr-1 shrink-0" />
            </button>
          </div>
          
          <div className="mx-4 text-base font-semibold text-slate-800 min-w-[200px] text-center">
            {getDateLabel()}
          </div>
          
          <div className="w-px h-6 bg-slate-200 mx-2"></div>
          <div className="flex bg-slate-100 p-1 rounded-lg shrink-0">
            <button 
              onClick={() => setView(Views.DAY)}
              className={`px-3 py-1 rounded-md text-sm font-medium transition-colors whitespace-nowrap shrink-0 ${view === Views.DAY ? 'bg-white shadow-sm text-slate-800' : 'text-slate-600 hover:text-slate-800'}`}
            >
              Tag
            </button>
            <button 
              onClick={() => setView(Views.WEEK)}
              className={`px-3 py-1 rounded-md text-sm font-medium transition-colors whitespace-nowrap shrink-0 ${view === Views.WEEK ? 'bg-white shadow-sm text-slate-800' : 'text-slate-600 hover:text-slate-800'}`}
            >
              Woche
            </button>
            <button 
              onClick={() => setView(Views.MONTH)}
              className={`px-3 py-1 rounded-md text-sm font-medium transition-colors whitespace-nowrap shrink-0 ${view === Views.MONTH ? 'bg-white shadow-sm text-slate-800' : 'text-slate-600 hover:text-slate-800'}`}
            >
              Monat
            </button>
          </div>
          <button 
            onClick={() => handleSelectSlot({ start: new Date(), end: new Date(Date.now() + 3600000) })}
            className="flex items-center space-x-2 px-3 py-1.5 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span>Neuer Termin</span>
          </button>
        </div>
      </div>
      
      <div className="flex-1 bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden flex flex-col relative">
        {loading && (
          <div className="absolute inset-0 z-10 bg-white/50 backdrop-blur-sm flex items-center justify-center">
            <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
          </div>
        )}
        <div className="p-4 flex-1 h-full">
          <style dangerouslySetInnerHTML={{__html: `
            .rbc-toolbar { display: none; }
            .rbc-event { padding: 4px 8px; font-size: 12px; }
            .rbc-today { background-color: #f8fafc; }
            .rbc-time-view { border: none; }
            .rbc-time-header { border-bottom: 1px solid #e2e8f0; }
            .rbc-time-content { border-top: none; }
            .rbc-day-bg + .rbc-day-bg { border-left: 1px solid #f1f5f9; }
            .rbc-timeslot-group { border-bottom: 1px solid #f1f5f9; }
            .rbc-time-header-content { border-left: 1px solid #f1f5f9; }
            .rbc-header { padding: 12px 0; font-weight: 600; color: #475569; text-transform: uppercase; font-size: 11px; border-bottom: none; border-left: 1px solid #f1f5f9; }
            .rbc-allday-cell { display: none; }
            .rbc-time-column .rbc-timeslot-group { min-height: 60px; }
          `}} />
          <BigCalendar
            localizer={localizer}
            events={events}
            startAccessor="start"
            endAccessor="end"
            style={{ height: '100%' }}
            view={view}
            date={date}
            onNavigate={(newDate) => setDate(newDate)}
            onView={(newView) => setView(newView)}
            selectable
            onSelectSlot={handleSelectSlot}
            onSelectEvent={handleSelectEvent}
            eventPropGetter={eventStyleGetter}
            culture="de"
            messages={{
              next: "Weiter",
              previous: "Zurück",
              today: "Heute",
              month: "Monat",
              week: "Woche",
              day: "Tag"
            }}
            min={new Date(0, 0, 0, 7, 0, 0)}
            max={new Date(0, 0, 0, 20, 0, 0)}
          />
        </div>
      </div>

      {selectedEvent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden">
            <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <h3 className="font-semibold text-slate-800">Termin Details</h3>
              <button onClick={() => setSelectedEvent(null)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <p className="text-sm text-slate-500 mb-1">Titel</p>
                <p className="font-medium text-slate-900">{selectedEvent.title}</p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-slate-500 mb-1">Start</p>
                  <p className="font-medium text-slate-900">{format(selectedEvent.start, 'dd.MM.yyyy HH:mm')}</p>
                </div>
                <div>
                  <p className="text-sm text-slate-500 mb-1">Ende</p>
                  <p className="font-medium text-slate-900">{format(selectedEvent.end, 'dd.MM.yyyy HH:mm')}</p>
                </div>
              </div>
              {selectedEvent.resource?.notes && (
                <div>
                  <p className="text-sm text-slate-500 mb-1">Notizen</p>
                  <p className="text-sm text-slate-700 bg-slate-50 p-3 rounded-lg border border-slate-100">{selectedEvent.resource.notes}</p>
                </div>
              )}
            </div>
            <div className="p-4 border-t border-slate-100 bg-slate-50 flex justify-end space-x-2">
              <button 
                onClick={handleDeleteEvent}
                className="flex items-center space-x-2 px-4 py-2 text-rose-600 bg-rose-50 hover:bg-rose-100 rounded-lg text-sm font-medium transition-colors"
              >
                <Trash2 className="w-4 h-4" />
                <span>Löschen</span>
              </button>
              <button 
                onClick={() => setSelectedEvent(null)}
                className="px-4 py-2 bg-blue-600 text-white hover:bg-blue-700 rounded-lg text-sm font-medium transition-colors"
              >
                Schließen
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
