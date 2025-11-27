import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";

const courseSchema = z.object({
  code: z
    .string()
    .min(3)
    .transform((val) => val.toUpperCase()),
  title: z.string().min(5),
  level: z.enum(["LEVEL_200", "LEVEL_300", "LEVEL_400", "LEVEL_500"] as const),
  creditValue: z.number().min(1).max(30),
  lecturer: z.string().min(2),
});

type CourseFormData = z.infer<typeof courseSchema>;

interface CourseFormProps {
  departmentId: string;
  onClose: () => void;
  onSubmit: (data: CourseFormData) => Promise<void>;
}

export const CourseForm = ({ onClose, onSubmit }: CourseFormProps) => {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<CourseFormData>({
    resolver: zodResolver(courseSchema),
    defaultValues: { level: "LEVEL_200", creditValue: 6 },
  });

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden">
        <div className="flex justify-between items-center p-4 border-b bg-gray-50">
          <h3 className="font-bold text-lg text-gray-800">Add New Course</h3>
          <button onClick={onClose}>
            <X size={20} className="text-gray-400" />
          </button>
        </div>
        <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium">Code</label>
              <input
                {...register("code")}
                className="w-full border p-2 rounded"
                placeholder="CSC301"
              />
              {errors.code && (
                <p className="text-red-500 text-xs">{errors.code.message}</p>
              )}
            </div>
            <div>
              <label className="text-sm font-medium">Level</label>
              <select
                {...register("level")}
                className="w-full border p-2 rounded"
              >
                <option value="LEVEL_200">Level 200</option>
                <option value="LEVEL_300">Level 300</option>
                <option value="LEVEL_400">Level 400</option>
                <option value="LEVEL_500">Level 500</option>
              </select>
            </div>
          </div>
          <div>
            <label className="text-sm font-medium">Title</label>
            <input
              {...register("title")}
              className="w-full border p-2 rounded"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm">Credits</label>
              <input
                type="number"
                {...register("creditValue", { valueAsNumber: true })}
                className="w-full border p-2"
              />
            </div>
            <div>
              <label className="text-sm">Lecturer</label>
              <input {...register("lecturer")} className="w-full border p-2" />
            </div>
          </div>
          <div className="pt-4 flex justify-end gap-3">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              Create
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};
