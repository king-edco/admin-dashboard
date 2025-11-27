import { useEffect, useState } from "react";
import {
  getDepartmentsByFaculty,
  create,
  remove,
  getCoursesByDepartment,
  getAll,
} from "@/services/supabase"; // <--- Service Supabase
import type { Faculty, Department, Course } from "@/types/schema";
import { CourseForm } from "@/features/courses/CourseForm";
import { MaterialsManager } from "@/features/courses/MaterialsManager"; // <--- Nouveau composant
import { Plus, Trash2, BookOpen, FolderOpen } from "lucide-react"; // <--- Ajout icône FolderOpen
import { Button } from "@/components/ui/button";

export const CoursesPage = () => {
  // --- ÉTATS ---
  const [faculties, setFaculties] = useState<Faculty[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  
  // Filtres
  const [selectedFacultyId, setSelectedFacultyId] = useState("");
  const [selectedDeptId, setSelectedDeptId] = useState("");
  
  // Modales
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [managingCourse, setManagingCourse] = useState<Course | null>(null); // Pour le gestionnaire de fichiers
  
  const [isLoading, setIsLoading] = useState(false);

  // --- EFFETS ---

  // 1. Charger les facultés au démarrage
  useEffect(() => {
    getAll<Faculty>("faculties").then(setFaculties);
  }, []);

  // 2. Charger les départements quand la faculté change
  useEffect(() => {
    if (selectedFacultyId) {
      getDepartmentsByFaculty(selectedFacultyId).then(setDepartments);
      setSelectedDeptId(""); // Reset dept
      setCourses([]); // Reset courses
    } else {
      setDepartments([]);
      setCourses([]);
    }
  }, [selectedFacultyId]);

  // 3. Charger les cours quand le département change
  useEffect(() => {
    if (selectedDeptId) {
      loadCourses();
    }
  }, [selectedDeptId]);

  // --- ACTIONS ---

  const loadCourses = async () => {
    setIsLoading(true);
    const data = await getCoursesByDepartment(selectedDeptId);
    // Tri par Niveau puis par Code
    setCourses(
      data.sort(
        (a, b) => a.level.localeCompare(b.level) || a.code.localeCompare(b.code)
      )
    );
    setIsLoading(false);
  };

  const handleCreateCourse = async (data: any) => {
    try {
      await create("courses", "AUTO", { ...data, departmentId: selectedDeptId });
      setIsCreateModalOpen(false);
      loadCourses();
    } catch (error: any) {
      alert("Erreur lors de la création : " + error.message);
    }
  };

  const handleDeleteCourse = async (id: string) => {
    if (confirm("Voulez-vous vraiment supprimer ce cours ? Cela supprimera aussi l'emploi du temps associé.")) {
      try {
        await remove("courses", id);
        loadCourses();
      } catch (error: any) {
        alert("Erreur suppression : " + error.message);
      }
    }
  };

  // --- RENDER ---

  return (
    <div className="space-y-6">
      
      {/* HEADER & FILTRES */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
        <div className="flex justify-between items-start mb-6">
          <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
            <BookOpen className="text-blue-600" /> Manage Courses
          </h1>
          {selectedDeptId && (
            <Button onClick={() => setIsCreateModalOpen(true)}>
              <Plus size={18} className="mr-2" /> Add Course
            </Button>
          )}
        </div>

        <div className="flex gap-4 items-end">
          {/* Sélection Faculté */}
          <div className="flex-1">
            <label className="text-xs font-bold text-gray-500 uppercase block mb-1">
              Faculty
            </label>
            <select
              value={selectedFacultyId}
              onChange={(e) => setSelectedFacultyId(e.target.value)}
              className="w-full p-3 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
            >
              <option value="">-- Select Faculty --</option>
              {faculties.map((f) => (
                <option key={f.id} value={f.id}>
                  {f.name}
                </option>
              ))}
            </select>
          </div>

          {/* Sélection Département */}
          <div className="flex-1">
            <label className="text-xs font-bold text-gray-500 uppercase block mb-1">
              Department
            </label>
            <select
              value={selectedDeptId}
              onChange={(e) => setSelectedDeptId(e.target.value)}
              disabled={!selectedFacultyId}
              className="w-full p-3 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none disabled:opacity-50"
            >
              <option value="">-- Select Department --</option>
              {departments.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* TABLEAU DES COURS */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        {!selectedDeptId ? (
          <div className="p-12 text-center text-gray-400">
            Please select a Faculty and Department to view courses.
          </div>
        ) : (
          <table className="w-full text-left">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="p-4 font-semibold text-gray-600 text-sm">Code</th>
                <th className="p-4 font-semibold text-gray-600 text-sm">Title</th>
                <th className="p-4 font-semibold text-gray-600 text-sm">Level</th>
                <th className="p-4 font-semibold text-gray-600 text-sm">Credits</th>
                <th className="p-4 font-semibold text-gray-600 text-sm">Lecturer</th>
                <th className="p-4 text-right font-semibold text-gray-600 text-sm">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {isLoading && (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-gray-500">Loading courses...</td>
                </tr>
              )}
              
              {!isLoading && courses.length === 0 && (
                 <tr>
                   <td colSpan={6} className="p-8 text-center text-gray-400">No courses found in this department.</td>
                 </tr>
              )}

              {courses.map((course) => (
                <tr key={course.id} className="hover:bg-blue-50/30 transition-colors">
                  <td className="p-4 font-mono font-bold text-blue-700">
                    {course.code}
                  </td>
                  <td className="p-4 font-medium text-gray-800">{course.title}</td>
                  <td className="p-4">
                    <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full font-bold border border-gray-200">
                      {course.level.replace("_", " ")}
                    </span>
                  </td>
                  <td className="p-4 text-gray-600">{course.creditValue}</td>
                  <td className="p-4 text-gray-600 text-sm">{course.lecturer}</td>
                  
                  {/* ACTIONS */}
                  <td className="p-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      {/* Bouton Gérer Fichiers */}
                      <button 
                        onClick={() => setManagingCourse(course)}
                        className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-md transition"
                        title="Manage Materials (PDFs)"
                      >
                        <FolderOpen size={18} />
                      </button>

                      {/* Bouton Supprimer */}
                      <button
                        onClick={() => handleDeleteCourse(course.id)}
                        className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-md transition"
                        title="Delete Course"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* MODALE : CRÉATION DE COURS */}
      {isCreateModalOpen && selectedDeptId && (
        <CourseForm
          departmentId={selectedDeptId}
          onClose={() => setIsCreateModalOpen(false)}
          onSubmit={handleCreateCourse}
        />
      )}

      {/* MODALE : GESTION DES FICHIERS */}
      {managingCourse && (
        <MaterialsManager 
          course={managingCourse}
          onClose={() => setManagingCourse(null)}
        />
      )}

    </div>
  );
};