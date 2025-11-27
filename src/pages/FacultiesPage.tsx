import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { Plus, Trash2, ChevronRight, Building, Layers, Loader2 } from "lucide-react";
import {
  getAll,
  create,
  remove,
  getDepartmentsByFaculty,
  // Si deleteFaculty fait planter l'import, on utilisera une logique locale,
  // mais assurons-nous qu'il est bien dans src/services/supabase.ts
  deleteFaculty, 
} from "@/services/supabase";
import type { Faculty, Department } from "@/types/schema";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export const FacultiesPage = () => {
  const [faculties, setFaculties] = useState<Faculty[]>([]);
  const [selectedFaculty, setSelectedFaculty] = useState<Faculty | null>(null);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    loadFaculties();
  }, []);

  useEffect(() => {
    if (selectedFaculty) {
      loadDepartments(selectedFaculty.id);
    } else {
      setDepartments([]);
    }
  }, [selectedFaculty]);

  const loadFaculties = async () => {
    setIsLoading(true);
    try {
      const data = await getAll<Faculty>("faculties");
      // Vérification de sécurité si data est null
      if (Array.isArray(data)) {
        setFaculties(data.sort((a, b) => a.name.localeCompare(b.name)));
      } else {
        setFaculties([]);
      }
    } catch (e) {
      console.error("Erreur chargement facultés", e);
    } finally {
      setIsLoading(false);
    }
  };

  const loadDepartments = async (facultyId: string) => {
    try {
      const data = await getDepartmentsByFaculty(facultyId);
      setDepartments(data || []);
    } catch (e) {
      console.error(e);
      setDepartments([]);
    }
  };

  const handleDeleteFaculty = async (id: string) => {
    if (!window.confirm("Voulez-vous vraiment supprimer cette faculté ?")) return;
    try {
      // On utilise la fonction sécurisée. Si elle n'existe pas, vérifie src/services/supabase.ts
      if (typeof deleteFaculty === 'function') {
        await deleteFaculty(id);
      } else {
        // Fallback si la fonction n'est pas trouvée (pour éviter l'écran blanc)
        await remove("faculties", id);
      }
      
      if (selectedFaculty?.id === id) setSelectedFaculty(null);
      loadFaculties();
    } catch (e: any) {
      alert(e.message || "Impossible de supprimer (contient peut-être des départements)");
    }
  };

  const handleDeleteDept = async (id: string) => {
    if (!window.confirm("Supprimer ce département ?")) return;
    try {
      await remove("departments", id);
      if (selectedFaculty) loadDepartments(selectedFaculty.id);
    } catch (e) {
      alert("Erreur lors de la suppression");
    }
  };

  return (
    <div className="h-[calc(100vh-8rem)] flex flex-col md:flex-row gap-6">
      
      {/* COLONNE GAUCHE : FACULTÉS */}
      <div className="w-full md:w-1/3 flex flex-col bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="p-4 border-b bg-gray-50 flex justify-between items-center">
          <h2 className="font-bold text-gray-700 flex items-center gap-2">
            <Building size={18} /> Faculties
          </h2>
          <AddFacultyForm onSuccess={loadFaculties} />
        </div>
        
        <div className="flex-1 overflow-y-auto p-2 space-y-2">
          {isLoading && (
            <div className="p-4 text-center text-gray-500 flex justify-center">
              <Loader2 className="animate-spin" />
            </div>
          )}
          
          {!isLoading && faculties.length === 0 && (
            <p className="text-center text-gray-400 mt-4 text-sm">Aucune faculté.</p>
          )}

          {faculties.map((fac) => (
            <div
              key={fac.id}
              onClick={() => setSelectedFaculty(fac)}
              className={`p-3 rounded-lg cursor-pointer flex justify-between items-center group transition-colors ${
                selectedFaculty?.id === fac.id
                  ? "bg-blue-50 border-blue-200 border"
                  : "hover:bg-gray-50 border border-transparent"
              }`}
            >
              <div className="font-medium text-gray-800 truncate pr-2">{fac.name}</div>
              <div className="flex items-center gap-1">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDeleteFaculty(fac.id);
                  }}
                  className="p-1 text-gray-300 hover:text-red-600 hover:bg-red-50 rounded"
                >
                  <Trash2 size={16} />
                </button>
                <ChevronRight size={16} className={selectedFaculty?.id === fac.id ? "text-blue-500" : "text-gray-300"} />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* COLONNE DROITE : DÉPARTEMENTS */}
      <div className="flex-1 bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden flex flex-col">
        {selectedFaculty ? (
          <>
            <div className="p-4 border-b bg-gray-50 flex justify-between items-center">
              <div>
                <h2 className="font-bold text-gray-700 flex items-center gap-2">
                  <Layers size={18} /> Departments
                </h2>
                <p className="text-xs text-blue-600 font-medium ml-6">{selectedFaculty.name}</p>
              </div>
              <AddDepartmentForm
                facultyId={selectedFaculty.id}
                onSuccess={() => loadDepartments(selectedFaculty.id)}
              />
            </div>
            
            <div className="p-4 grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4 overflow-y-auto">
              {departments.length === 0 && (
                <div className="col-span-full text-center py-10 text-gray-400 border-2 border-dashed rounded-xl">
                  Aucun département dans cette faculté.
                </div>
              )}

              {departments.map((dept) => (
                <div
                  key={dept.id}
                  className="border p-4 rounded-xl bg-white hover:shadow-md transition relative group"
                >
                  <div className="flex justify-between items-start mb-2">
                    <span className="bg-blue-100 text-blue-800 text-xs font-bold px-2 py-1 rounded">
                      {dept.code}
                    </span>
                    <button
                      onClick={() => handleDeleteDept(dept.id)}
                      className="text-gray-300 hover:text-red-500 transition"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                  <h3 className="font-bold text-gray-800">{dept.name}</h3>
                </div>
              ))}
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-gray-400 bg-gray-50/50">
            <Building size={48} className="mb-4 opacity-20" />
            <p>Sélectionnez une faculté pour voir ses départements</p>
          </div>
        )}
      </div>
    </div>
  );
};

// --- SOUS-COMPOSANTS ---

const AddFacultyForm = ({ onSuccess }: any) => {
  const { register, handleSubmit, reset } = useForm();
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  
  const onSubmit = async (data: any) => {
    setLoading(true);
    try {
      await create("faculties", "AUTO", data);
      reset();
      setIsOpen(false);
      onSuccess();
    } catch (e) {
      alert("Erreur création");
    } finally {
      setLoading(false);
    }
  };
  
  if (!isOpen)
    return (
      <Button onClick={() => setIsOpen(true)} size="sm" className="gap-2">
        <Plus size={16} /> Ajouter
      </Button>
    );
    
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <form
        onSubmit={handleSubmit(onSubmit)}
        className="bg-white p-6 rounded-xl w-full max-w-sm shadow-2xl"
      >
        <h3 className="font-bold text-lg mb-4">Nouvelle Faculté</h3>
        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium mb-1 block">Nom</label>
            <Input
              {...register("name", { required: true })}
              placeholder="Ex: Faculté des Sciences"
              autoFocus
            />
          </div>
          <div>
            <label className="text-sm font-medium mb-1 block">Description</label>
            <Input
              {...register("description")}
              placeholder="Optionnel"
            />
          </div>
        </div>
        <div className="flex justify-end gap-2 mt-6">
          <Button type="button" variant="ghost" onClick={() => setIsOpen(false)}>Annuler</Button>
          <Button type="submit" disabled={loading}>
            {loading ? <Loader2 className="animate-spin h-4 w-4" /> : "Enregistrer"}
          </Button>
        </div>
      </form>
    </div>
  );
};

const AddDepartmentForm = ({ facultyId, onSuccess }: any) => {
  const { register, handleSubmit, reset } = useForm();
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  
  const onSubmit = async (data: any) => {
    setLoading(true);
    try {
      await create("departments", "AUTO", { ...data, facultyId });
      reset();
      setIsOpen(false);
      onSuccess();
    } catch (e) {
      alert("Erreur création");
    } finally {
      setLoading(false);
    }
  };
  
  if (!isOpen)
    return (
      <Button onClick={() => setIsOpen(true)} size="sm" variant="outline" className="gap-2 bg-white">
        <Plus size={14} /> Dept
      </Button>
    );
    
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <form
        onSubmit={handleSubmit(onSubmit)}
        className="bg-white p-6 rounded-xl w-full max-w-sm shadow-2xl"
      >
        <h3 className="font-bold text-lg mb-4">Nouveau Département</h3>
        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium mb-1 block">Nom</label>
            <Input
              {...register("name", { required: true })}
              placeholder="Ex: Informatique"
              autoFocus
            />
          </div>
          <div>
            <label className="text-sm font-medium mb-1 block">Code</label>
            <Input
              {...register("code", { required: true })}
              placeholder="Ex: INFO"
              className="uppercase"
            />
          </div>
        </div>
        <div className="flex justify-end gap-2 mt-6">
          <Button type="button" variant="ghost" onClick={() => setIsOpen(false)}>Annuler</Button>
          <Button type="submit" disabled={loading}>
            {loading ? <Loader2 className="animate-spin h-4 w-4" /> : "Enregistrer"}
          </Button>
        </div>
      </form>
    </div>
  );
};