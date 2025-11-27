import { Link, Outlet } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { Megaphone } from "lucide-react";
import {
  LayoutDashboard,
  BookOpen,
  Users,
  LogOut,
  Building2,
  MapPin,
  Calendar,
} from "lucide-react";
import { Settings } from "lucide-react";

export const DashboardLayout = () => {
  const { logout, user } = useAuth();

  return (
    <div className="flex min-h-screen bg-gray-50">
      {/* Sidebar */}
      <aside className="w-64 bg-slate-900 text-white">
        <div className="p-6">
          <h2 className="text-xl font-bold">UniAdmin</h2>
          <p className="text-xs text-slate-400">{user?.email}</p>
        </div>

        <nav className="mt-6 space-y-2 px-4">
          <NavItem
            to="/"
            icon={<LayoutDashboard size={20} />}
            label="Overview"
          />
          <NavItem
            to="/faculties"
            icon={<Building2 size={20} />}
            label="Faculties"
          />
          <NavItem
            to="/courses"
            icon={<BookOpen size={20} />}
            label="Courses"
          />
          <NavItem to="/users" icon={<Users size={20} />} label="Students" />

          <NavItem
            to="/notifications"
            icon={<Megaphone size={20} />}
            label="Broadcasts"
          />

          <div className="pt-4 mt-4 border-t border-slate-700">
            <NavItem to="/venues" icon={<MapPin size={20} />} label="Venues" />
            <NavItem
              to="/timetable"
              icon={<Calendar size={20} />}
              label="Timetable"
            />
            <NavItem
              to="/settings"
              icon={<Settings size={20} />}
              label="Settings"
            />
          </div>
        </nav>

        <div className="absolute bottom-0 w-64 p-4">
          <button
            onClick={() => logout()}
            className="flex w-full items-center gap-2 rounded-md bg-red-600 px-4 py-2 text-sm hover:bg-red-700"
          >
            <LogOut size={16} /> Logout
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-8">
        <Outlet />
      </main>
    </div>
  );
};

const NavItem = ({ to, icon, label }: any) => (
  <Link
    to={to}
    className="flex items-center gap-3 rounded-md px-4 py-3 text-slate-300 transition hover:bg-slate-800 hover:text-white"
  >
    {icon}
    <span>{label}</span>
  </Link>
);
