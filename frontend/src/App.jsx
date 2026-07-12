import { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, Outlet, useLocation } from 'react-router-dom';
import Navbar from '@/components/common/Navbar';
import Footer from '@/components/common/Footer';
import ProtectedRoute from '@/components/common/ProtectedRoute';

function ScrollToTop() {
  const { pathname } = useLocation();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  return null;
}

// Public Pages
import LandingPage from '@/pages/public/LandingPage';
import RegisterPage from '@/pages/public/RegisterPage';
import CekKelulusanPage from '@/pages/public/CekKelulusanPage';
import BlogPage from '@/pages/public/BlogPage';
import BlogPostPage from '@/pages/public/BlogPostPage';
import CustomPage from '@/pages/public/CustomPage';

// Auth & Profil (Candidates)
import LoginPage from '@/pages/public/LoginPage';
import ProfilePage from '@/pages/public/ProfilePage';
import KamiPage from '@/pages/public/KamiPage';
import AnggotaPublikPage from '@/pages/public/AnggotaPublikPage';
import AlumniPage from '@/pages/public/AlumniPage';

// Admin Pages
import AdminLoginPage from '@/pages/admin/AdminLoginPage';
import AdminDashboardPage from '@/pages/admin/AdminDashboardPage';
import AdminPendaftaranPage from '@/pages/admin/AdminPendaftaranPage';
import AdminAnggotaPage from '@/pages/admin/AdminAnggotaPage';
import AdminBlogPage from '@/pages/admin/AdminBlogPage';
import AdminBlogEditorPage from '@/pages/admin/AdminBlogEditorPage';
import AdminSettingsPage from '@/pages/admin/AdminSettingsPage';
import AdminWebEditorPage from '@/pages/admin/AdminWebEditorPage';
import AdminOrgPage from '@/pages/admin/AdminOrgPage';
import AdminTestimonialsPage from '@/pages/admin/AdminTestimonialsPage';

// Admin Layout
import AdminLayout from '@/components/admin/AdminLayout';

/* Layout wrapper for public pages */
function PublicLayout() {
  return (
    <>
      <Navbar />
      <Outlet />
      <Footer />
    </>
  );
}

function App() {
  return (
    <BrowserRouter>
      <ScrollToTop />
      <Routes>
        {/* ── Public Routes (with Navbar + Footer) ── */}
        <Route element={<PublicLayout />}>
          <Route path="/" element={<LandingPage />} />
          <Route path="/daftar" element={<RegisterPage />} />
          <Route path="/cek-kelulusan" element={<CekKelulusanPage />} />
          <Route path="/blog" element={<BlogPage />} />
          <Route path="/blog/:slug" element={<BlogPostPage />} />
          <Route path="/p/:slug" element={<CustomPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/kami" element={<KamiPage />} />
          <Route path="/anggota" element={<AnggotaPublikPage />} />
          <Route path="/alumni" element={<AlumniPage />} />
          <Route
            path="/profil"
            element={
              <ProtectedRoute type="candidate">
                <ProfilePage />
              </ProtectedRoute>
            }
          />
        </Route>

        {/* ── Admin Login (standalone, no layout) ── */}
        <Route path="/admin/login" element={<AdminLoginPage />} />

        {/* ── Admin Protected Routes (with Sidebar Layout) ── */}
        <Route
          path="/admin"
          element={
            <ProtectedRoute type="admin">
              <AdminLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<AdminDashboardPage />} />
          <Route path="pendaftaran" element={<AdminPendaftaranPage />} />
          <Route path="anggota" element={<AdminAnggotaPage />} />
          <Route path="blog" element={<AdminBlogPage />} />
          <Route path="blog/new" element={<AdminBlogEditorPage />} />
          <Route path="blog/edit/:id" element={<AdminBlogEditorPage />} />
          <Route path="web-editor" element={<AdminWebEditorPage />} />
          <Route path="settings" element={<AdminSettingsPage />} />
          <Route path="org" element={<AdminOrgPage />} />
          <Route path="testimoni" element={<AdminTestimonialsPage />} />
        </Route>

        {/* ── Fallback ── */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;

