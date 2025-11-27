import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { MapPin, Plus, Trash2, Image as ImageIcon } from "lucide-react";
import { getAll, create, remove } from "@/services/supabase"; // <--- CHANGÉ (Supabase)
import type { Venue } from "@/types/schema";
import { Button } from "@/components/ui/button";

export const VenuesPage = () => {
  const [venues, setVenues] = useState<Venue[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { register, handleSubmit, reset } = useForm();

  useEffect(() => {
    loadVenues();
  }, []);

  const loadVenues = async () => {
    const data = await getAll<Venue>("venues");
    setVenues(data.sort((a, b) => a.name.localeCompare(b.name)));
  };

  const onSubmit = async (data: any) => {
    // Le service Supabase gère l'ID 'AUTO' en le supprimant pour laisser Postgres générer l'UUID
    await create("venues", "AUTO", data);
    reset();
    setIsModalOpen(false);
    loadVenues();
  };

  const handleDelete = async (id: string) => {
    if (confirm("Delete this venue?")) {
      await remove("venues", id);
      loadVenues();
    }
  };

  return (
    <div className="space-y-6">
      {/* HEADER */}
      <div className="flex justify-between items-center bg-white p-6 rounded-xl shadow-sm border border-gray-200">
        <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
          <MapPin className="text-red-500" /> Campus Venues
        </h1>
        <Button onClick={() => setIsModalOpen(true)}>
          <Plus size={18} className="mr-2" /> Add Venue
        </Button>
      </div>

      {/* LISTE DES SALLES */}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {venues.map((venue) => (
          <div
            key={venue.id}
            className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden group"
          >
            <div className="h-32 bg-gray-100 flex items-center justify-center">
              {venue.imageUrl ? (
                <img
                  src={venue.imageUrl}
                  alt={venue.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <ImageIcon className="text-gray-300" size={40} />
              )}
            </div>
            <div className="p-4">
              <div className="flex justify-between items-start">
                <h3 className="font-bold text-gray-800 text-lg">
                  {venue.name}
                </h3>
                <button
                  onClick={() => handleDelete(venue.id)}
                  className="text-gray-300 hover:text-red-500 transition-colors"
                >
                  <Trash2 size={16} />
                </button>
              </div>
              <p className="text-sm text-gray-500 mt-1">
                Capacity: {venue.capacity || "N/A"}
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* MODAL D'AJOUT */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <form
            onSubmit={handleSubmit(onSubmit)}
            className="bg-white p-6 rounded-xl w-96 shadow-2xl"
          >
            <h3 className="font-bold text-lg mb-4">Add Venue</h3>
            
            <input
              {...register("name", { required: true })}
              placeholder="Venue Name (e.g. Amphi 150)"
              className="w-full border p-2 rounded mb-3"
            />
            
            <input
              type="number"
              {...register("capacity")}
              placeholder="Capacity"
              className="w-full border p-2 rounded mb-3"
            />

            <input
              {...register("imageUrl")}
              placeholder="Image URL (Optional)"
              className="w-full border p-2 rounded mb-4"
            />

            <div className="flex justify-end gap-2">
              <Button
                type="button"
                variant="ghost"
                onClick={() => setIsModalOpen(false)}
              >
                Cancel
              </Button>
              <Button type="submit">Save</Button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};