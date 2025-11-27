// Enums for standardizing data
export type AcademicLevel = 'LEVEL_200' | 'LEVEL_300' | 'LEVEL_400' | 'LEVEL_500';
export type TimetableMode = 'lecture' | 'ca' | 'exam';

// FIX: Ajout de 'past_due' et 'canceled' pour correspondre à la logique de paiement
export type SubscriptionStatus = 'trial' | 'active' | 'expired' | 'past_due' | 'canceled';

export type MaterialType = 'handout' | 'past_question' | 'tutorial';
export type CourseType = 'major' | 'elective' | 'carry_over';

// 1. Organization Structure
export interface Faculty {
  id: string;
  name: string;
  description?: string;
}

export interface Department {
  id: string;
  facultyId: string;
  name: string;
  code: string;
}

export interface Program {
  id: string;
  departmentId: string;
  name: string;
}

// 2. Academic Assets
export interface Venue {
  id: string;
  name: string;
  imageUrl?: string;
  capacity?: number;
}

export interface Course {
  id: string;
  departmentId: string;
  level: AcademicLevel;
  code: string;
  title: string;
  lecturer: string;
  creditValue: number;
}

// 3. Timetable & Schedule
export interface TimetableEntry {
  id: string;
  courseId: string;
  venueId: string; // Relies on Venues collection
  mode: TimetableMode;
  day: number; // 0 (Sun) - 6 (Sat)
  startTime: string; // "HH:mm" 24h format
  endTime: string;
  pdfUrl?: string; // If the admin uploaded a PDF instead of structured data
}

export interface CourseMaterial {
  id: string;
  courseId: string;
  title: string;
  type: MaterialType;
  fileUrl: string;
  uploadedAt: string; // ISO String
}

// 4. User & Auth
export interface UserProfile {
  id: string; // Matches Supabase Auth UID
  fullName: string;
  email: string;
  matricule: string;
  facultyId: string;
  departmentId: string;
  level: AcademicLevel;
  selectedCourses: UserCourseSelection[]; 
  trialStartDate: string; // ISO String
  subscriptionStatus: SubscriptionStatus;
  fcmToken?: string;
  
  // FIX: Ajout des champs pour le suivi de l'abonnement
  lastPaymentDate?: string;        // ISO String (optionnel)
  subscriptionExpiryDate?: string; // ISO String (optionnel)
}

// Helper for user's specific course list
export interface UserCourseSelection {
  courseId: string;
  type: CourseType; // User tags this as Major/Elective/Carry-over
  notify: boolean; // Toggle for notifications
}

// 5. Config
export interface AppConfig {
  id: string; // usually 'global' or '1'
  currentMode: TimetableMode;
  maintenanceMode: boolean;
  announcement?: string;
  minVersion: string;
}