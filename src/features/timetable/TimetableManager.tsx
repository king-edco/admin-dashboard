import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase"; // <--- SUPABASE IMPORT
import { create, getAll, getDepartmentsByFaculty } from "@/services/supabase"; // Service Supabase
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  UploadCloud,
  FileText,
  CheckCircle,
  Loader2,
  AlertCircle,
} from "lucide-react";
import type { Faculty, Department } from "@/types/schema";

export const TimetableUploader = () => {
  // State for Metadata
  const [faculties, setFaculties] = useState<Faculty[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);

  const [selectedFac, setSelectedFac] = useState("");
  const [selectedDept, setSelectedDept] = useState("");
  const [selectedLevel, setSelectedLevel] = useState("LEVEL_300");
  const [mode, setMode] = useState("lecture");

  // State for File
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [status, setStatus] = useState<{
    type: "success" | "error";
    msg: string;
  } | null>(null);

  // Load Faculties on mount
  useEffect(() => {
    getAll<Faculty>("faculties").then(setFaculties);
  }, []);

  // Load Depts when Faculty changes
  useEffect(() => {
    if (selectedFac) {
      getDepartmentsByFaculty(selectedFac).then(setDepartments);
      setSelectedDept("");
    } else {
      setDepartments([]);
    }
  }, [selectedFac]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selected = e.target.files[0];
      if (selected.type !== "application/pdf") {
        setStatus({ type: "error", msg: "Only PDF files are allowed." });
        return;
      }
      setFile(selected);
      setStatus(null);
    }
  };

  const handleUpload = async () => {
    if (!file || !selectedDept) {
      setStatus({
        type: "error",
        msg: "Please select a department and a file.",
      });
      return;
    }

    setIsUploading(true);
    setStatus(null);

    try {
      // 1. Upload vers Supabase Storage
      // Nom du fichier unique
      const filePath = `${selectedDept}/${selectedLevel}/${Date.now()}_${file.name}`;
      
      // Assure-toi d'avoir créé le bucket 'timetables' dans Supabase Storage
      const { data: _uploadData, error: uploadError } = await supabase.storage
        .from('timetables')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (uploadError) throw uploadError;

      // 2. Récupérer l'URL Publique
      const { data: urlData } = supabase.storage
        .from('timetables')
        .getPublicUrl(filePath);

      const downloadURL = urlData.publicUrl;

      // 3. Sauvegarder dans la DB
      await create("timetables", "AUTO", {
        type: "PDF",
        departmentId: selectedDept,
        level: selectedLevel,
        mode: mode,
        fileUrl: downloadURL,
        fileName: file.name,
        uploadedAt: new Date().toISOString(),
      });

      setStatus({
        type: "success",
        msg: "Timetable PDF uploaded and linked successfully!",
      });
      setFile(null);
      const input = document.getElementById("file-upload") as HTMLInputElement;
      if (input) input.value = "";
      
    } catch (error: any) {
      console.error(error);
      setStatus({
        type: "error",
        msg: error.message || "Upload failed.",
      });
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <UploadCloud className="text-blue-600" /> Upload PDF Timetable
        </CardTitle>
        <CardDescription>
          Upload a complete semester schedule as a PDF file.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* 1. SELECTORS */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Faculty</Label>
            <Select onValueChange={setSelectedFac} value={selectedFac}>
              <SelectTrigger>
                <SelectValue placeholder="Select Faculty" />
              </SelectTrigger>
              <SelectContent>
                {faculties.map((f) => (
                  <SelectItem key={f.id} value={f.id}>
                    {f.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Department</Label>
            <Select
              onValueChange={setSelectedDept}
              value={selectedDept}
              disabled={!selectedFac}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select Dept" />
              </SelectTrigger>
              <SelectContent>
                {departments.map((d) => (
                  <SelectItem key={d.id} value={d.id}>
                    {d.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Level</Label>
            <Select onValueChange={setSelectedLevel} value={selectedLevel}>
              <SelectTrigger>
                <SelectValue placeholder="Level" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="LEVEL_200">Level 200</SelectItem>
                <SelectItem value="LEVEL_300">Level 300</SelectItem>
                <SelectItem value="LEVEL_400">Level 400</SelectItem>
                <SelectItem value="LEVEL_500">Level 500</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Timetable Mode</Label>
            <Select onValueChange={setMode} value={mode}>
              <SelectTrigger>
                <SelectValue placeholder="Mode" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="lecture">Lecture</SelectItem>
                <SelectItem value="ca">CA (Evaluations)</SelectItem>
                <SelectItem value="exam">Exam</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* 2. FILE UPLOAD AREA */}
        <div className="border-2 border-dashed border-slate-200 rounded-xl p-8 flex flex-col items-center justify-center bg-slate-50 mt-4 relative">
          {file ? (
            <div className="flex items-center gap-3 text-blue-700 bg-blue-100 px-4 py-2 rounded-lg z-10">
              <FileText size={24} />
              <span className="font-medium">{file.name}</span>
              <span className="text-xs opacity-70">
                ({(file.size / 1024).toFixed(1)} KB)
              </span>
              <button
                onClick={() => setFile(null)}
                className="text-blue-900 font-bold ml-2"
              >
                X
              </button>
            </div>
          ) : (
            <>
              <UploadCloud size={40} className="text-slate-400 mb-2" />
              <p className="text-sm text-slate-500 font-medium">
                Click to select PDF
              </p>
              <p className="text-xs text-slate-400 mt-1">Max size: 5MB</p>
            </>
          )}

          <input
            id="file-upload"
            type="file"
            accept=".pdf"
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            onChange={handleFileChange}
            disabled={!!file} 
          />
        </div>

        {/* 3. STATUS & ACTION */}
        {status && (
          <div
            className={`p-3 rounded-md flex items-center gap-2 text-sm ${
              status.type === "success"
                ? "bg-green-100 text-green-700"
                : "bg-red-100 text-red-700"
            }`}
          >
            {status.type === "success" ? (
              <CheckCircle size={16} />
            ) : (
              <AlertCircle size={16} />
            )}
            {status.msg}
          </div>
        )}

        <Button
          onClick={handleUpload}
          disabled={!file || !selectedDept || isUploading}
          className="w-full bg-blue-600 hover:bg-blue-700"
        >
          {isUploading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Uploading...
            </>
          ) : (
            "Publish Timetable"
          )}
        </Button>
      </CardContent>
    </Card>
  );
};