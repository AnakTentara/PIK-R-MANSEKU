import { useEffect, lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate, Outlet, useLocation } from 'react-router-dom';
import Navbar from '@/components/common/Navbar';
import Footer from '@/components/common/Footer';
import AlumniBanner from '@/components/common/AlumniBanner';
import QuickLogin from '@/components/common/QuickLogin';
import ProtectedRoute from '@/components/common/ProtectedRoute';
import { PageSkeleton } from '@/components/common/SkeletonLoading';

function ScrollToTop() {
  const { pathname } = useLocation();

  useEffect(() => {
    window.scrollTo(0, 0);
    document.documentElement.toggleAttribute('data-admin', pathname.startsWith('/admin'));

    // Dynamically update Canonical Tag for Google SEO
    let canonicalLink = document.querySelector('link[rel="canonical"]');
    if (!canonicalLink) {
      canonicalLink = document.createElement('link');
      canonicalLink.setAttribute('rel', 'canonical');
      document.head.appendChild(canonicalLink);
    }
    const cleanPath = pathname === '/' ? '' : pathname;
    canonicalLink.setAttribute('href', `https://pikr-manseku.my.id${cleanPath}`);
  }, [pathname]);

  // Auto-recover from stale dynamic chunk imports on new deployments
  useEffect(() => {
    const handleError = (e) => {
      if (e?.message && (
        e.message.includes('Loading chunk') ||
        e.message.includes('Importing a module script failed') ||
        e.message.includes('Failed to fetch dynamically imported module')
      )) {
        console.warn('[CacheBuster] Stale cached module detected, reloading page automatically...');
        window.location.reload();
      }
    };
    window.addEventListener('error', handleError);
    return () => window.removeEventListener('error', handleError);
  }, []);

  return null;
}

// Public Pages — LandingPage langsung diimpor untuk instant First Paint, sisanya lazy
import LandingPage from '@/pages/public/LandingPage';
const RegisterPage = lazy(() => import('@/pages/public/RegisterPage'));
const CekKelulusanPage = lazy(() => import('@/pages/public/CekKelulusanPage'));
const BeritaPage = lazy(() => import('@/pages/public/BeritaPage'));
const BeritaPostPage = lazy(() => import('@/pages/public/BeritaPostPage'));
const ForumPage = lazy(() => import('@/pages/public/ForumPage'));
const ForumWritePage = lazy(() => import('@/pages/public/ForumWritePage'));
const ForumPostPage = lazy(() => import('@/pages/public/ForumPostPage'));
const CustomPage = lazy(() => import('@/pages/public/CustomPage'));
const NotFoundPage = lazy(() => import('@/pages/public/NotFoundPage'));

// Auth & Profil (Candidates)
const LoginPage = lazy(() => import('@/pages/public/LoginPage'));
const ProfilePage = lazy(() => import('@/pages/public/ProfilePage'));
const ResetSandiPage = lazy(() => import('@/pages/public/ResetSandiPage'));
const KamiPage = lazy(() => import('@/pages/public/KamiPage'));
const AnggotaPublikPage = lazy(() => import('@/pages/public/AnggotaPublikPage'));
const AlumniPage = lazy(() => import('@/pages/public/AlumniPage'));
const MemberProfilePage = lazy(() => import('@/pages/public/MemberProfilePage'));

// Admin Pages (Semua di-load terpisah via lazy agar pengunjung publik tidak membebani kuota & memori)
const AdminLoginPage = lazy(() => import('@/pages/admin/AdminLoginPage'));
const AdminDashboardPage = lazy(() => import('@/pages/admin/AdminDashboardPage'));
const AdminPendaftaranPage = lazy(() => import('@/pages/admin/AdminPendaftaranPage'));
const AdminPengumumanPage = lazy(() => import('@/pages/admin/AdminPengumumanPage'));
const AdminAnggotaPage = lazy(() => import('@/pages/admin/AdminAnggotaPage'));
const AdminBlogPage = lazy(() => import('@/pages/admin/AdminBlogPage'));
const AdminBlogEditorPage = lazy(() => import('@/pages/admin/AdminBlogEditorPage'));
const AdminSettingsPage = lazy(() => import('@/pages/admin/AdminSettingsPage'));
const AdminBotPage = lazy(() => import('@/pages/admin/AdminBotPage'));
const AdminDesignPage = lazy(() => import('@/pages/admin/AdminDesignPage'));
const AdminOrgPage = lazy(() => import('@/pages/admin/AdminOrgPage'));
const AdminTestimonialsPage = lazy(() => import('@/pages/admin/AdminTestimonialsPage'));
const AdminFileManagerPage = lazy(() => import('@/pages/admin/AdminFileManagerPage'));
const AdminUsersPage = lazy(() => import('@/pages/admin/AdminUsersPage'));
const AdminAbsensiPage = lazy(() => import('@/pages/admin/AdminAbsensiPage'));
const AdminReportsPage = lazy(() => import('@/pages/admin/AdminReportsPage'));
import { useAuthStore } from '@/stores/authStore';

// Admin Layout
import AdminLayout from '@/components/admin/AdminLayout';

/* Layout wrapper for public pages */
function PublicLayout() {
  return (
    <>
      <AlumniBanner />
      <Navbar />
      <Suspense fallback={<PageSkeleton />}>
        <Outlet />
      </Suspense>
      <Footer />
    </>
  );
}

/* /@slug -> profil anggota, segmen lain tanpa "@" -> 404 */
function MemberProfileGate() {
  const { pathname } = useLocation();
  return pathname.startsWith('/@') ? <MemberProfilePage /> : <NotFoundPage />;
}

function RoleProtectedRoute({ allowedRoles, children }) {
  const { adminUser } = useAuthStore();
  const role = adminUser?.role || 'KABINET_UMUM';
  if (!allowedRoles.includes(role)) {
    return <Navigate to="/admin" replace />;
  }
  return children;
}

function App() {
  return (
    <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <ScrollToTop />
      <QuickLogin />
      <Routes>
        {/* ── Public Routes (with Navbar + Footer) ── */}
        <Route element={<PublicLayout />}>
          <Route path="/" element={<LandingPage />} />
          <Route path="/daftar" element={<RegisterPage />} />
          <Route path="/cek-kelulusan" element={<CekKelulusanPage />} />
          <Route path="/berita" element={<BeritaPage />} />
          <Route path="/berita/:slug" element={<BeritaPostPage />} />
          <Route path="/blog" element={<ForumPage />} />
          <Route
            path="/blog/tulis"
            element={
              <ProtectedRoute type="any">
                <ForumWritePage />
              </ProtectedRoute>
            }
          />
          <Route path="/blog/:slug" element={<ForumPostPage />} />
          <Route path="/p/:slug" element={<CustomPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/admin/login" element={<AdminLoginPage />} />
          <Route path="/reset-sandi" element={<ResetSandiPage />} />
          <Route path="/kami" element={<KamiPage />} />
          <Route path="/anggota" element={<AnggotaPublikPage />} />
          <Route path="/alumni" element={<AlumniPage />} />
          {/* Profil dari QR ID Card. React Router tidak mendukung prefix "@" di segmen, jadi dicek di halaman */}
          <Route path="/:handle" element={<MemberProfileGate />} />
          <Route
            path="/profil"
            element={
              <ProtectedRoute type="candidate">
                <ProfilePage />
              </ProtectedRoute>
            }
          />
        </Route>

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
          <Route 
            path="pendaftaran" 
            element={
              <RoleProtectedRoute allowedRoles={['DEVELOPER', 'KABINET_UMUM']}>
                <AdminPendaftaranPage />
              </RoleProtectedRoute>
            } 
          />
          <Route 
            path="pengumuman" 
            element={
              <RoleProtectedRoute allowedRoles={['DEVELOPER', 'KABINET_UMUM', 'MEDINFO']}>
                <AdminPengumumanPage />
              </RoleProtectedRoute>
            } 
          />
          <Route path="anggota" element={<AdminAnggotaPage />} />
          <Route path="absensi" element={<AdminAbsensiPage />} />
          <Route path="blog" element={<AdminBlogPage />} />
          <Route path="blog/new" element={<AdminBlogEditorPage />} />
          <Route path="blog/edit/:id" element={<AdminBlogEditorPage />} />
          <Route 
            path="moderasi" 
            element={
              <RoleProtectedRoute allowedRoles={['DEVELOPER', 'KABINET_UMUM']}>
                <AdminReportsPage />
              </RoleProtectedRoute>
            } 
          />
          <Route
            path="desain"
            element={
              <RoleProtectedRoute allowedRoles={['DEVELOPER', 'KABINET_UMUM', 'MEDINFO']}>
                <AdminDesignPage />
              </RoleProtectedRoute>
            }
          />
          {/* Web Editor sudah digabung ke Desain */}
          <Route path="web-editor" element={<Navigate to="/admin/desain" replace />} />
          <Route 
            path="file-manager" 
            element={
              <RoleProtectedRoute allowedRoles={['DEVELOPER', 'KABINET_UMUM']}>
                <AdminFileManagerPage />
              </RoleProtectedRoute>
            } 
          />
          <Route 
            path="users" 
            element={
              <RoleProtectedRoute allowedRoles={['DEVELOPER']}>
                <AdminUsersPage />
              </RoleProtectedRoute>
            } 
          />
          <Route 
            path="settings" 
            element={
              <RoleProtectedRoute allowedRoles={['DEVELOPER']}>
                <AdminSettingsPage />
              </RoleProtectedRoute>
            } 
          />
          <Route
            path="settings/bot"
            element={
              <RoleProtectedRoute allowedRoles={['DEVELOPER']}>
                <AdminBotPage />
              </RoleProtectedRoute>
            }
          />
          <Route 
            path="org" 
            element={
              <RoleProtectedRoute allowedRoles={['DEVELOPER', 'KABINET_UMUM']}>
                <AdminOrgPage />
              </RoleProtectedRoute>
            } 
          />
          <Route 
            path="testimoni" 
            element={
              <RoleProtectedRoute allowedRoles={['DEVELOPER', 'KABINET_UMUM']}>
                <AdminTestimonialsPage />
              </RoleProtectedRoute>
            } 
          />
        </Route>

        {/* ── Fallback / Error Page ── */}
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;

