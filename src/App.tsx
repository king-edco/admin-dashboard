import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import { Login } from "./pages/Login";
import { DashboardLayout } from "./layout/DashboardLayout";
import { AdminGuard } from "./components/AdminGuard";
import { UsersPage } from "./pages/UsersPage";
import { SettingsPage } from "./pages/SettingsPage";
import { VenuesPage } from "./pages/VenuesPage";
import { TimetablePage } from "./pages/TimetablePage";
import { FacultiesPage } from "./pages/FacultiesPage";
import { CoursesPage } from "./pages/CoursesPage";
import { NotificationsPage } from "./pages/NotificationsPage";

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />

          {/* Protected Admin Routes */}
          <Route element={<AdminGuard />}>
            <Route element={<DashboardLayout />}>
              <Route
                path="/"
                element={
                  <div>
                    <h1>Dashboard Home</h1>
                  </div>
                }
              />
              <Route
                path="/faculties"
                element={
                  <div>
                    <h1>Manage Faculties</h1>
                  </div>
                }
              />
              <Route
                path="/courses"
                element={
                  <div>
                    <h1>Manage Courses</h1>
                  </div>
                }
              />
              <Route
                path="/users"
                element={
                  <div>
                    <h1>Manage Users</h1>
                  </div>
                }
              />
              <Route
                path="/"
                element={
                  <div className="p-10">
                    <h1>Welcome to Admin Dashboard</h1>
                  </div>
                }
              />
              <Route path="/faculties" element={<FacultiesPage />} />
              <Route path="/courses" element={<CoursesPage />} />
              <Route path="/venues" element={<VenuesPage />} />
              <Route path="/timetable" element={<TimetablePage />} />
              <Route path="/users" element={<UsersPage />} />
              <Route path="/settings" element={<SettingsPage />} />
              <Route path="/notifications" element={<NotificationsPage />} />
            </Route>
          </Route>
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
