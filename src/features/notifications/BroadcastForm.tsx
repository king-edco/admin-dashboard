import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Send, Users, AlertCircle, CheckCircle, Loader2 } from 'lucide-react';
import { supabase } from '@/lib/supabase'; // <--- SUPABASE IMPORT
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const broadcastSchema = z.object({
  title: z.string().min(3, "Title is too short"),
  body: z.string().min(10, "Message must be at least 10 chars"),
  targetLevel: z.string().optional(),
  targetFacultyId: z.string().optional(),
});

type BroadcastData = z.infer<typeof broadcastSchema>;

export const BroadcastForm = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [status, setStatus] = useState<{ type: 'success' | 'error', msg: string } | null>(null);

  const { register, handleSubmit, reset, setValue, formState: { errors } } = useForm<BroadcastData>({
    resolver: zodResolver(broadcastSchema),
    defaultValues: {
      targetLevel: 'ALL',
      targetFacultyId: 'ALL'
    }
  });

  const onSubmit = async (data: BroadcastData) => {
    setIsLoading(true);
    setStatus(null);
    try {
      // APPEL EDGE FUNCTION SUPABASE
      const { data: response, error } = await supabase.functions.invoke('university-api', {
        body: { 
          action: 'sendBroadcast', // L'action pour le routeur Deno
          ...data 
        }
      });

      if (error) throw error;

      // Vérifier la réponse logique de l'API
      if (response && response.success) {
        setStatus({ 
          type: 'success', 
          msg: `Broadcast sent successfully to ${response.count} devices!` 
        });
        reset();
      } else {
        throw new Error(response?.message || "Unknown error");
      }

    } catch (error: any) {
      console.error(error);
      setStatus({ 
        type: 'error', 
        msg: "Failed to send broadcast. Check console for details." 
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Send size={20} className="text-blue-600"/> Compose Broadcast
        </CardTitle>
        <CardDescription>Send push notifications to student devices instantly.</CardDescription>
      </CardHeader>
      <CardContent>
        {status && (
          <div className={`p-4 rounded-lg mb-6 flex items-center gap-2 text-sm font-bold ${status.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
            {status.type === 'success' ? <CheckCircle size={18}/> : <AlertCircle size={18}/>}
            {status.msg}
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Target Level</Label>
              {/* Utilisation des composants Shadcn Select correctement connectés à React Hook Form */}
              <Select onValueChange={(val) => setValue('targetLevel', val)} defaultValue="ALL">
                <SelectTrigger>
                  <SelectValue placeholder="Select Level" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">All Levels</SelectItem>
                  <SelectItem value="LEVEL_200">Level 200</SelectItem>
                  <SelectItem value="LEVEL_300">Level 300</SelectItem>
                  <SelectItem value="LEVEL_400">Level 400</SelectItem>
                  <SelectItem value="LEVEL_500">Level 500</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Target Faculty</Label>
              <Select onValueChange={(val) => setValue('targetFacultyId', val)} defaultValue="ALL">
                <SelectTrigger>
                  <SelectValue placeholder="Select Faculty" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">All Faculties</SelectItem>
                  {/* Ajouter dynamiquement les facultés ici si besoin */}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Notification Title</Label>
            <Input {...register('title')} placeholder="e.g. Class Cancelled" />
            {errors.title && <p className="text-red-500 text-xs">{errors.title.message}</p>}
          </div>

          <div className="space-y-2">
            <Label>Message Body</Label>
            <textarea 
              {...register('body')} 
              className="flex min-h-[80px] w-full rounded-md border border-slate-200 bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-slate-500 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-slate-950"
              placeholder="Enter your message here..."
            />
            {errors.body && <p className="text-red-500 text-xs">{errors.body.message}</p>}
          </div>

          <div className="bg-blue-50 p-3 rounded text-xs text-blue-700 flex items-center gap-2">
            <Users size={14} />
            This will be sent immediately to all matching devices.
          </div>

          <Button type="submit" disabled={isLoading} className="w-full bg-blue-600 hover:bg-blue-700">
            {isLoading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Sending...</> : 'Send Broadcast'}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};