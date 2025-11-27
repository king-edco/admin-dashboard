import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { Loader2, Trash2, FileText, Upload, X } from 'lucide-react';
import { getCourseMaterials, uploadCourseMaterial, deleteCourseMaterial } from '@/services/supabase';
import type { Course, CourseMaterial } from '@/types/schema';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface MaterialsManagerProps {
  course: Course;
  onClose: () => void;
}

export const MaterialsManager = ({ course, onClose }: MaterialsManagerProps) => {
  const [materials, setMaterials] = useState<CourseMaterial[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  // Formulaire pour l'upload
  const { register, handleSubmit, reset, setValue} = useForm({
    defaultValues: { title: '', type: 'handout' }
  });

  // Charger la liste au montage
  useEffect(() => {
    loadList();
  }, [course.id]);

  const loadList = async () => {
    setLoading(true);
    try {
      const data = await getCourseMaterials(course.id);
      setMaterials(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const onUpload = async (data: any) => {
    if (!selectedFile) return alert("Veuillez sélectionner un fichier PDF.");
    
    setUploading(true);
    try {
      await uploadCourseMaterial(course.id, selectedFile, data.title, data.type);
      reset();
      setSelectedFile(null);
      loadList(); // Rafraîchir la liste
    } catch (e: any) {
      alert("Erreur upload: " + e.message);
    } finally {
      setUploading(false);
    }
  };

  const onDelete = async (id: string, url: string) => {
    if (!confirm("Supprimer ce document ?")) return;
    try {
      await deleteCourseMaterial(id, url);
      setMaterials(materials.filter(m => m.id !== id));
    } catch (e) {
      alert("Erreur suppression");
    }
  };

  // Gestion input file
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* HEADER */}
        <div className="p-4 border-b bg-gray-50 flex justify-between items-center">
          <div>
            <h3 className="font-bold text-lg text-gray-800">Gérer les supports</h3>
            <p className="text-sm text-gray-500">{course.code} - {course.title}</p>
          </div>
          <button onClick={onClose}><X size={20} className="text-gray-400 hover:text-gray-600" /></button>
        </div>

        <div className="flex-1 overflow-hidden flex flex-col md:flex-row">
          
          {/* GAUCHE: LISTE DES FICHIERS */}
          <div className="flex-1 overflow-y-auto p-4 border-r border-gray-100">
            <h4 className="font-bold text-sm text-gray-700 mb-3">Documents existants ({materials.length})</h4>
            
            {loading ? (
              <div className="text-center py-10"><Loader2 className="animate-spin mx-auto text-blue-600" /></div>
            ) : materials.length === 0 ? (
              <div className="text-center py-10 text-gray-400 bg-gray-50 rounded-lg border border-dashed">
                Aucun document.
              </div>
            ) : (
              <div className="space-y-2">
                {materials.map(mat => (
                  <div key={mat.id} className="flex items-center justify-between p-3 bg-white border rounded-lg hover:shadow-sm">
                    <div className="flex items-center gap-3 overflow-hidden">
                      <div className={`p-2 rounded ${mat.type === 'handout' ? 'bg-orange-100 text-orange-600' : 'bg-purple-100 text-purple-600'}`}>
                        <FileText size={18} />
                      </div>
                      <div className="min-w-0">
                        <p className="font-medium text-sm truncate">{mat.title}</p>
                        <p className="text-xs text-gray-400 capitalize">{mat.type}</p>
                      </div>
                    </div>
                    <button onClick={() => onDelete(mat.id, mat.fileUrl)} className="text-gray-300 hover:text-red-500 p-1">
                      <Trash2 size={16} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* DROITE: FORMULAIRE D'AJOUT */}
          <div className="w-full md:w-80 bg-gray-50 p-4 border-l border-gray-200">
            <h4 className="font-bold text-sm text-gray-700 mb-4">Ajouter un document</h4>
            
            <form onSubmit={handleSubmit(onUpload)} className="space-y-4">
              <div>
                <Label>Titre du document</Label>
                <Input {...register('title', { required: true })} placeholder="Ex: Chapitre 1" className="bg-white" />
              </div>

              <div>
                <Label>Type</Label>
                <Select onValueChange={(val) => setValue('type', val as any)} defaultValue="handout">
                  <SelectTrigger className="bg-white">
                    <SelectValue placeholder="Choisir..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="handout">Support de cours (Handout)</SelectItem>
                    <SelectItem value="tutorial">TD / Exercice</SelectItem>
                    <SelectItem value="past_question">Ancienne Épreuve</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Fichier (PDF)</Label>
                <div className="mt-1 flex items-center justify-center w-full">
                  <label className="flex flex-col items-center justify-center w-full h-24 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer bg-white hover:bg-gray-50">
                    {selectedFile ? (
                      <div className="text-center px-2">
                        <p className="text-sm font-medium text-blue-600 truncate max-w-[200px]">{selectedFile.name}</p>
                        <p className="text-xs text-gray-500">{(selectedFile.size/1024).toFixed(0)} KB</p>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center justify-center pt-5 pb-6">
                        <Upload className="w-6 h-6 text-gray-400 mb-1" />
                        <p className="text-xs text-gray-500">Cliquez pour choisir</p>
                      </div>
                    )}
                    <input type="file" className="hidden" accept=".pdf" onChange={handleFileChange} />
                  </label>
                </div>
              </div>

              <Button type="submit" disabled={uploading || !selectedFile} className="w-full bg-blue-600">
                {uploading ? <Loader2 className="animate-spin mr-2 h-4 w-4" /> : 'Uploader'}
              </Button>
            </form>
          </div>

        </div>
      </div>
    </div>
  );
};