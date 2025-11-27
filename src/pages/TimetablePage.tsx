import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { Calendar, Plus, Trash2, MapPin } from 'lucide-react';
import { 
  getAll, 
  getDepartmentsByFaculty, 
  getCoursesByDepartment, 
  create, 
  remove, 
  getTimetable, 
} from '@/services/supabase'; // <--- CHANGÉ (Supabase)
import type { Faculty, Department, Course, Venue, TimetableEntry, TimetableMode } from '@/types/schema';
import { Button } from '@/components/ui/button';
import { TimetableUploader } from '@/features/timetable/TimetableManager'; // Import de l'Uploader PDF

const DAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

export const TimetablePage = () => {
  const [faculties, setFaculties] = useState<Faculty[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [selectedFacultyId, setSelectedFacultyId] = useState('');
  const [selectedDeptId, setSelectedDeptId] = useState('');
  const [selectedLevel, setSelectedLevel] = useState('LEVEL_300');
  const [mode, setMode] = useState<TimetableMode>('lecture');

  const [courses, setCourses] = useState<Course[]>([]);
  const [venues, setVenues] = useState<Venue[]>([]);
  const [entries, setEntries] = useState<TimetableEntry[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const [activeDay, setActiveDay] = useState(1); 
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    getAll<Faculty>('faculties').then(setFaculties);
    getAll<Venue>('venues').then(setVenues);
  }, []);

  useEffect(() => {
    if (selectedFacultyId) {
      getDepartmentsByFaculty(selectedFacultyId).then(setDepartments);
      setSelectedDeptId('');
    }
  }, [selectedFacultyId]);

  useEffect(() => {
    if (selectedDeptId && selectedLevel) {
      fetchData();
    }
  }, [selectedDeptId, selectedLevel, mode]);

  const fetchData = async () => {
    setIsLoading(true);
    const courseData = await getCoursesByDepartment(selectedDeptId);
    setCourses(courseData.filter(c => c.level === selectedLevel));
    const scheduleData = await getTimetable(selectedDeptId, selectedLevel, mode);
    setEntries(scheduleData);
    setIsLoading(false);
  };

  const handleDelete = async (id: string) => {
    if (confirm("Remove this class session?")) {
      await remove('timetables', id);
      fetchData(); 
    }
  };

  return (
    <div className="space-y-6">
      
      {/* 1. HEADER & FILTERS */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
        <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2 mb-6">
          <Calendar className="text-blue-600" /> Timetable Scheduler
        </h1>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <select 
            className="p-2 border rounded bg-gray-50"
            value={selectedFacultyId}
            onChange={e => setSelectedFacultyId(e.target.value)}
          >
            <option value="">Select Faculty</option>
            {faculties.map(f => <option key={f.id} value={f.id}>{f.name}</option>)}
          </select>

          <select 
            className="p-2 border rounded bg-gray-50"
            value={selectedDeptId}
            onChange={e => setSelectedDeptId(e.target.value)}
            disabled={!selectedFacultyId}
          >
            <option value="">Select Department</option>
            {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
          </select>

          <select 
            className="p-2 border rounded bg-gray-50"
            value={selectedLevel}
            onChange={e => setSelectedLevel(e.target.value)}
          >
            <option value="LEVEL_200">Level 200</option>
            <option value="LEVEL_300">Level 300</option>
            <option value="LEVEL_400">Level 400</option>
            <option value="LEVEL_500">Level 500</option>
          </select>

          <div className="flex bg-gray-100 p-1 rounded">
            {(['lecture', 'ca', 'exam'] as const).map((m) => (
              <button
                key={m}
                onClick={() => setMode(m)}
                className={`flex-1 text-sm font-bold capitalize rounded py-1 ${mode === m ? 'bg-white shadow text-blue-600' : 'text-gray-500'}`}
              >
                {m}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* 2. PDF UPLOADER & MANUAL SCHEDULER */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
         
         {/* LEFT: PDF UPLOADER */}
         <div className="lg:col-span-1">
            <TimetableUploader />
         </div>

         {/* RIGHT: MANUAL SCHEDULER */}
         <div className="lg:col-span-2">
            {selectedDeptId ? (
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden min-h-[500px]">
                <div className="flex border-b overflow-x-auto">
                  {DAYS.map((day, index) => (
                    <button
                      key={day}
                      onClick={() => setActiveDay(index)}
                      className={`px-6 py-4 font-bold text-sm border-b-2 whitespace-nowrap transition ${
                        activeDay === index 
                          ? 'border-blue-600 text-blue-600 bg-blue-50' 
                          : 'border-transparent text-gray-500 hover:text-gray-700'
                      }`}
                    >
                      {day}
                    </button>
                  ))}
                </div>

                <div className="p-6">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="font-bold text-gray-700">{DAYS[activeDay]} Schedule</h3>
                    <Button onClick={() => setIsModalOpen(true)} className="bg-blue-600">
                      <Plus size={16} className="mr-2" /> Add Class
                    </Button>
                  </div>

                  {isLoading ? <div className="text-center py-10">Loading...</div> : (
                    <div className="space-y-3">
                      {entries.filter(e => e.day === activeDay).sort((a,b) => a.startTime.localeCompare(b.startTime)).map(entry => {
                        const course = courses.find(c => c.id === entry.courseId);
                        const venue = venues.find(v => v.id === entry.venueId);
                        
                        return (
                          <div key={entry.id} className="flex items-center p-4 border rounded-lg hover:shadow-md transition bg-gray-50">
                            <div className="w-32 font-mono text-lg font-bold text-gray-700">
                              {entry.startTime}
                              <div className="text-xs text-gray-400 font-normal">to {entry.endTime}</div>
                            </div>
                            <div className="flex-1 px-4 border-l border-gray-200">
                              <div className="font-bold text-blue-800">{course?.code || entry.courseId}</div>
                              <div className="text-sm text-gray-600">{course?.title}</div>
                            </div>
                            <div className="flex items-center gap-4">
                              <div className="text-right">
                                <div className="font-bold text-gray-700 flex items-center justify-end gap-1">
                                  <MapPin size={14} className="text-gray-400" /> {venue?.name || "Unknown"}
                                </div>
                              </div>
                              <button onClick={() => handleDelete(entry.id)} className="p-2 text-gray-400 hover:text-red-600">
                                <Trash2 size={18} />
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="text-center py-20 text-gray-400 bg-white rounded-xl border border-gray-200">
                Please select a Faculty and Department to manage the schedule.
              </div>
            )}
         </div>
      </div>

      {isModalOpen && (
        <AddClassModal 
          onClose={() => setIsModalOpen(false)}
          courses={courses}
          venues={venues}
          day={activeDay}
          mode={mode}
          onSuccess={fetchData}
        />
      )}
    </div>
  );
};

const AddClassModal = ({ onClose, courses, venues, day, mode, onSuccess }: any) => {
  const { register, handleSubmit } = useForm();
  
  const onSubmit = async (data: any) => {
    if (data.endTime <= data.startTime) {
      alert("End time must be after start time");
      return;
    }
    await create('timetables', 'AUTO', { ...data, day, mode, pdfUrl: null });
    onClose();
    onSuccess();
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white p-6 rounded-xl w-full max-w-md shadow-2xl">
        <h3 className="font-bold text-lg mb-4">Add {mode} Session</h3>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-1">Course</label>
            <select {...register('courseId', { required: true })} className="w-full border p-2 rounded">
              <option value="">Select Course</option>
              {courses.map((c: Course) => <option key={c.id} value={c.id}>{c.code}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-1">Venue</label>
            <select {...register('venueId', { required: true })} className="w-full border p-2 rounded">
              <option value="">Select Venue</option>
              {venues.map((v: Venue) => <option key={v.id} value={v.id}>{v.name}</option>)}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div><label className="text-xs">Start</label><input type="time" {...register('startTime')} className="w-full border p-2" /></div>
            <div><label className="text-xs">End</label><input type="time" {...register('endTime')} className="w-full border p-2" /></div>
          </div>
          <div className="flex justify-end gap-2 mt-6">
            <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
            <Button type="submit">Save</Button>
          </div>
        </form>
      </div>
    </div>
  );
};