import { supabase } from '@/lib/supabase';
import type { 
  Faculty, 
  Department, 
  Course, 
  Venue, 
  TimetableEntry, 
  TimetableMode, 
  UserProfile, 
  AppConfig 
} from '@/types/schema';
import type { CourseMaterial } from '@/types/schema';

// --- 1. MAPPING HELPERS (DB snake_case -> App camelCase) ---

const mapFaculty = (d: any): Faculty => ({
  id: d.id,
  name: d.name,
  description: d.description
});

const mapDepartment = (d: any): Department => ({
  id: d.id,
  name: d.name,
  code: d.code,
  facultyId: d.faculty_id
});

const mapCourse = (c: any): Course => ({
  id: c.id,
  code: c.code,
  title: c.title,
  level: c.level,
  creditValue: c.credit_value,
  lecturer: c.lecturer,
  departmentId: c.department_id
});

const mapVenue = (v: any): Venue => ({
  id: v.id,
  name: v.name,
  capacity: v.capacity,
  imageUrl: v.image_url
});

const mapTimetable = (t: any): TimetableEntry => ({
  id: t.id,
  courseId: t.course_id,
  venueId: t.venue_id,
  mode: t.mode,
  day: t.day,
  startTime: t.start_time,
  endTime: t.end_time,
  pdfUrl: t.pdf_url
});

const mapUser = (u: any): UserProfile => ({
  id: u.id,
  fullName: u.full_name,
  email: u.email,
  matricule: u.matricule,
  facultyId: u.faculty_id,
  departmentId: u.department_id,
  level: u.level,
  subscriptionStatus: u.subscription_status,
  trialStartDate: u.trial_start_date,
  selectedCourses: u.selected_courses || [],
  fcmToken: u.fcm_token,
  lastPaymentDate: u.last_payment_date,
  subscriptionExpiryDate: u.subscription_expiry_date
});

// --- 2. FONCTIONS GÉNÉRIQUES (CRUD) ---

export const getAll = async <T>(table: string): Promise<T[]> => {
  const { data, error } = await supabase.from(table).select('*');
  if (error) {
    console.error(`Erreur fetch ${table}:`, error);
    return [];
  }
  
  if (table === 'faculties') return data.map(mapFaculty) as unknown as T[];
  if (table === 'departments') return data.map(mapDepartment) as unknown as T[];
  if (table === 'courses') return data.map(mapCourse) as unknown as T[];
  if (table === 'venues') return data.map(mapVenue) as unknown as T[];
  if (table === 'users') return data.map(mapUser) as unknown as T[];
  
  return data as unknown as T[];
};

export const create = async (table: string, id: string, data: any) => {
  const payload: any = { ...data };
  if (id === 'AUTO') delete payload.id;

  // Mapping manuel Camel -> Snake
  if (payload.facultyId) { payload.faculty_id = payload.facultyId; delete payload.facultyId; }
  if (payload.departmentId) { payload.department_id = payload.departmentId; delete payload.departmentId; }
  if (payload.creditValue) { payload.credit_value = payload.creditValue; delete payload.creditValue; }
  if (payload.imageUrl) { payload.image_url = payload.imageUrl; delete payload.imageUrl; }
  if (payload.courseId) { payload.course_id = payload.courseId; delete payload.courseId; }
  if (payload.venueId) { payload.venue_id = payload.venueId; delete payload.venueId; }
  if (payload.startTime) { payload.start_time = payload.startTime; delete payload.startTime; }
  if (payload.endTime) { payload.end_time = payload.endTime; delete payload.endTime; }
  if (payload.pdfUrl) { payload.pdf_url = payload.pdfUrl; delete payload.pdfUrl; }
  if (payload.uploadedAt) { payload.uploaded_at = payload.uploadedAt; delete payload.uploadedAt; }
  if (payload.fileUrl) { payload.file_url = payload.fileUrl; delete payload.fileUrl; }
  if (payload.fileName) { payload.file_name = payload.fileName; delete payload.fileName; }

  const { error } = await supabase.from(table).insert(payload);
  if (error) throw error;
};

export const remove = async (table: string, id: string) => {
  const { error } = await supabase.from(table).delete().eq('id', id);
  if (error) throw error;
};

// --- 3. LOGIQUE MÉTIER SPÉCIFIQUE ---

// Remplacement direct de ta fonction 'deleteFaculty' pour garder la sécurité
export const deleteFaculty = async (id: string) => {
  // 1. Vérification d'intégrité référentielle
  const { count, error } = await supabase
    .from('departments')
    .select('*', { count: 'exact', head: true })
    .eq('faculty_id', id);

  if (error) throw error;

  if (count && count > 0) {
    throw new Error("Impossible de supprimer : Cette faculté contient des départements.");
  }

  // 2. Suppression si vide
  await remove('faculties', id);
};

export const getDepartmentsByFaculty = async (facultyId: string): Promise<Department[]> => {
  const { data, error } = await supabase
    .from('departments')
    .select('*')
    .eq('faculty_id', facultyId);
  
  if (error) throw error;
  return data.map(mapDepartment);
};

export const getCoursesByDepartment = async (departmentId: string): Promise<Course[]> => {
  const { data, error } = await supabase
    .from('courses')
    .select('*')
    .eq('department_id', departmentId);
  
  if (error) throw error;
  return data.map(mapCourse);
};

export const getVenues = async (): Promise<Venue[]> => {
  return getAll<Venue>('venues');
};

export const getUsers = async (): Promise<UserProfile[]> => {
  return getAll<UserProfile>('users');
};

export const getTimetable = async (
  departmentId: string, 
  level: string, 
  mode: TimetableMode
): Promise<TimetableEntry[]> => {
  const { data: courses } = await supabase
    .from('courses')
    .select('id')
    .eq('department_id', departmentId)
    .eq('level', level);

  if (!courses || courses.length === 0) return [];
  const courseIds = courses.map(c => c.id);

  const { data: entries, error } = await supabase
    .from('timetables')
    .select('*')
    .in('course_id', courseIds)
    .eq('mode', mode);

  if (error) throw error;
  return entries.map(mapTimetable);
};

export const getAppConfig = async (): Promise<AppConfig | null> => {
  const { data, error } = await supabase.from('app_config').select('*').eq('id', 1).single();
  if (error) return null;
  return {
    id: '1',
    currentMode: data.current_mode,
    maintenanceMode: data.maintenance_mode,
    announcement: data.announcement,
    minVersion: data.min_version
  };
};

export const updateAppConfig = async (data: Partial<AppConfig>) => {
  const payload: any = {};
  if (data.currentMode) payload.current_mode = data.currentMode;
  if (data.maintenanceMode !== undefined) payload.maintenance_mode = data.maintenanceMode;
  if (data.announcement !== undefined) payload.announcement = data.announcement;
  if (data.minVersion) payload.min_version = data.minVersion;

  const { error } = await supabase.from('app_config').update(payload).eq('id', 1);
  if (error) throw error;
};

export const getCollectionCount = async (table: string): Promise<number> => {
  const { count, error } = await supabase
    .from(table)
    .select('*', { count: 'exact', head: true });
  if (error) return 0;
  return count || 0;
};


// --- GESTION DES MATÉRIAUX DE COURS (Supports / TD) --- 

export const getCourseMaterials = async (courseId: string): Promise<CourseMaterial[]> => {
  const { data, error } = await supabase
    .from('course_materials')
    .select('*')
    .eq('course_id', courseId)
    .order('uploaded_at', { ascending: false });

  if (error) throw error;

  // Mapping snake_case -> camelCase
  return data.map((m: any) => ({
    id: m.id,
    courseId: m.course_id,
    title: m.title,
    type: m.type,
    fileUrl: m.file_url,
    uploadedAt: m.uploaded_at
  }));
};

export const uploadCourseMaterial = async (
  courseId: string, 
  file: File, 
  title: string, 
  type: 'handout' | 'tutorial' | 'past_question'
) => {
  // 1. Upload du fichier dans le Bucket 'course_materials'
  // Chemin : course_id/timestamp_filename
  const filePath = `${courseId}/${Date.now()}_${file.name}`;
  
  const { error: uploadError } = await supabase.storage
    .from('course_materials') // Assure-toi que ce bucket existe et est public dans Supabase
    .upload(filePath, file);

  if (uploadError) throw uploadError;

  // 2. Récupérer l'URL publique
  const { data: urlData } = supabase.storage
    .from('course_materials')
    .getPublicUrl(filePath);

  // 3. Créer l'entrée en base de données
  const { error: dbError } = await supabase.from('course_materials').insert({
    course_id: courseId,
    title: title,
    type: type,
    file_url: urlData.publicUrl
  });

  if (dbError) throw dbError;
};

export const deleteCourseMaterial = async (id: string, fileUrl: string) => {
  // 1. Supprimer de la DB
  const { error: dbError } = await supabase.from('course_materials').delete().eq('id', id);
  if (dbError) throw dbError;

  // 2. Supprimer du Storage (Optionnel mais recommandé pour nettoyer)
  // On extrait le chemin relatif de l'URL complète
  // Ex: .../course_materials/123/456_file.pdf -> 123/456_file.pdf
  try {
    const path = fileUrl.split('/course_materials/')[1];
    if (path) {
      await supabase.storage.from('course_materials').remove([path]);
    }
  } catch (e) {
    console.warn("Impossible de supprimer le fichier du storage", e);
  }
};