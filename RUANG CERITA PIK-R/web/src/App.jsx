import { Suspense, lazy, useCallback, useEffect, useState } from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import toast from 'react-hot-toast';
import { Snowflake } from 'lucide-react';
import { rc, errMsg } from '@/lib/api.js';
import { useSession } from '@/lib/session.js';
import { connectLive, disconnectLive, useLive } from '@/lib/live.js';
import { initPushSubscription } from '@/lib/pushSubscription.js';
import Shell from '@/components/Shell.jsx';
import { Spinner } from '@/components/ui.jsx';
import OfflineIndicator from '@/components/OfflineIndicator.jsx';
import InAppToast from '@/components/InAppToast.jsx';
import Login from '@/pages/Login.jsx';
import Home from '@/pages/Home.jsx';

// Halaman selain Beranda dimuat saat dibuka: pembukaan pertama tetap ringan di HP kelas menengah
const Profile = lazy(() => import('@/pages/Profile.jsx'));
const Messages = lazy(() => import('@/pages/Messages.jsx'));
const Counsel = lazy(() => import('@/pages/Counsel.jsx'));
const AiCounsel = lazy(() => import('@/pages/AiCounsel.jsx'));
const Create = lazy(() => import('@/components/Create.jsx'));
const More = {
  Search: lazy(() => import('@/pages/More.jsx').then((m) => ({ default: m.SearchPage }))),
  Explore: lazy(() => import('@/pages/More.jsx').then((m) => ({ default: () => <m.SearchPage explore /> }))),
  Activity: lazy(() => import('@/pages/More.jsx').then((m) => ({ default: m.ActivityPage }))),
  Post: lazy(() => import('@/pages/More.jsx').then((m) => ({ default: m.PostPage }))),
  Likers: lazy(() => import('@/pages/More.jsx').then((m) => ({ default: m.LikersPage }))),
  Saved: lazy(() => import('@/pages/More.jsx').then((m) => ({ default: m.SavedPage }))),
  Archive: lazy(() => import('@/pages/More.jsx').then((m) => ({ default: m.ArchivePage }))),
  Settings: lazy(() => import('@/pages/More.jsx').then((m) => ({ default: m.SettingsPage })))
};

/** Pengingat lembut di jam tenang (bukan blokir): remaja tetap memegang kendali. */
function useQuietHours(settings) {
  useEffect(() => {
    if (!settings?.quietStart || !settings?.quietEnd) return undefined;
    const check = () => {
      const now = new Date();
      const m = now.getHours() * 60 + now.getMinutes();
      const [sh, sm] = settings.quietStart.split(':').map(Number);
      const [eh, em] = settings.quietEnd.split(':').map(Number);
      const s = sh * 60 + sm, e = eh * 60 + em;
      const inQuiet = s < e ? m >= s && m < e : m >= s || m < e;
      const key = `rc_quiet_${now.toDateString()}`;
      try {
        if (inQuiet && !sessionStorage.getItem(key)) {
          sessionStorage.setItem(key, '1');
          toast('Sudah jam tenangmu. Istirahat dulu, ceritanya masih ada besok 🌙', { duration: 7000 });
        }
      } catch { /* abaikan */ }
    };
    check();
    const t = setInterval(check, 60_000);
    return () => clearInterval(t);
  }, [settings?.quietStart, settings?.quietEnd]);
}

export default function App() {
  const token = useSession((s) => s.token);
  const me = useSession((s) => s.me);
  const setMe = useSession((s) => s.setMe);
  const logout = useSession((s) => s.logout);
  const [create, setCreate] = useState(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const { pathname } = useLocation();

  useEffect(() => {
    if (!token) { disconnectLive(); return; }
    rc.me().then((r) => { setMe(r.data); connectLive(); }).catch((err) => {
      if (err.response?.status === 403) { toast.error(errMsg(err)); logout(); }
    });
  }, [token, setMe, logout]);
  useEffect(() => { window.scrollTo(0, 0); }, [pathname]);
  useQuietHours(me?.settings);

  // Minta izin notifikasi & daftarkan perangkat ke server secara otomatis
  useEffect(() => {
    const timer = setTimeout(() => {
      initPushSubscription(token);
    }, 1200);
    return () => clearTimeout(timer);
  }, [token]);

  // Dismiss custom toast via event (dari InAppToast close button)
  useEffect(() => {
    const handler = (e) => toast.dismiss(e.detail);
    window.addEventListener('toast-dismiss', handler);
    return () => window.removeEventListener('toast-dismiss', handler);
  }, []);

  // Notifikasi realtime konseling jika tidak sedang berada di sesi terkait
  useLive('counsel', useCallback((e) => {
    if (pathname.includes(`/konseling/${e.sessionId}`)) return;
    if (e.type === 'CLAIMED') {
      toast('Konselor sebaya telah bergabung ke sesimu 🤝', { icon: '🤝', duration: 5000 });
    } else if (e.type === 'NEW') {
      toast('Sesi konseling baru dibuka di antrean', { icon: '💬', duration: 4000 });
    } else if (e.type === 'HUMAN_REQUESTED') {
      toast('Siswa meminta konselor sebaya langsung', { icon: '🙋', duration: 5000 });
    } else if (e.type === 'LIMIT_FALLBACK') {
      toast('Sesi dialihkan ke konselor (kuota AI habis)', { icon: '⏳', duration: 5000 });
    }
  }, [pathname]));

  // Notifikasi in-app untuk follow, follow request, DM, like, comment
  useLive('notification', useCallback((e) => {
    if (!e?.type || !e?.actor) return;
    const actor = e.actor;
    let text = '';
    let href = '/aktivitas';
    let type = 'FOLLOW';

    if (e.type === 'FOLLOW') {
      text = 'mulai mengikutimu';
      href = `/${actor.username}`;
      type = 'FOLLOW';
    } else if (e.type === 'FOLLOW_REQUEST') {
      text = 'meminta mengikutimu';
      href = '/aktivitas';
      type = 'FOLLOW_REQUEST';
    } else if (e.type === 'MESSAGE') {
      text = e.text || 'Mengirim pesan baru';
      href = e.threadId ? `/pesan/${e.threadId}` : '/pesan';
      type = 'DM';
    } else if (e.type === 'LIKE') {
      text = e.text || 'menyukai postinganmu';
      href = e.postId ? `/p/${e.postId}` : '/aktivitas';
      type = 'LIKE';
    } else if (e.type === 'COMMENT') {
      text = e.text || 'mengomentari postinganmu';
      href = e.postId ? `/p/${e.postId}` : '/aktivitas';
      type = 'COMMENT';
    } else {
      return;
    }

    if (pathname.startsWith(href)) return;

    toast.custom(
      (t) => (
        <InAppToast
          type={type}
          actor={actor}
          text={text}
          href={href}
          t={t}
          createdAt={e.createdAt}
        />
      ),
      { duration: 5000 }
    );
  }, [pathname]));

  // create = { kind, stage }; stage 'camera' = langsung ke kamera (tanpa popup laci)
  const onCreate = useCallback((kind = 'post', stage = 'drawer') => setCreate({ kind: typeof kind === 'string' ? kind : 'post', stage }), []);

  if (!token) return <Login />;
  if (!me) return <div style={{ minHeight: '100dvh', display: 'grid', placeItems: 'center' }}><img src="/logo-192.png" alt="" width="72" height="72" /></div>;
  if (me.frozen) {
    return (
      <div style={{ minHeight: '100dvh', display: 'grid', placeItems: 'center', padding: 24, textAlign: 'center' }}>
        <div style={{ maxWidth: 400 }}>
          <Snowflake size={42} style={{ color: 'var(--accent-ink)', margin: '0 auto 10px' }} />
          <h1 style={{ fontFamily: 'var(--font-d)', fontSize: '1.4rem' }}>Akun dibekukan sementara</h1>
          <p style={{ color: 'var(--text-2)', marginTop: 8, lineHeight: 1.55 }}>
            {me.frozen.reason || 'Akunmu dibekukan oleh pengurus.'} Bisa dipakai lagi pada {new Date(me.frozen.until).toLocaleString('id-ID', { dateStyle: 'long', timeStyle: 'short' })}.
            Bilik Konseling tetap bisa kamu buka kapan saja lewat pengurus PIK-R.
          </p>
          <button type="button" className="btn btn-soft" style={{ marginTop: 16 }} onClick={logout}>Keluar</button>
        </div>
      </div>
    );
  }

  return (
    <Shell onCreate={() => onCreate('story')}>
      <Suspense fallback={<Spinner />}>
        <Routes>
          <Route path="/" element={<Home onCreate={onCreate} refreshKey={refreshKey} />} />
          <Route path="/cari" element={<More.Search />} />
          <Route path="/jelajah" element={<More.Explore />} />
          <Route path="/aktivitas" element={<More.Activity />} />
          <Route path="/pesan" element={<Messages />} />
          <Route path="/pesan/:id" element={<Messages />} />
          <Route path="/konseling/ai" element={<AiCounsel />} />
          <Route path="/konseling/ai/:id" element={<AiCounsel />} />
          <Route path="/konseling" element={<Counsel />} />
          <Route path="/konseling/:id" element={<Counsel />} />
          <Route path="/p/:id" element={<More.Post />} />
          <Route path="/p/:id/suka" element={<More.Likers />} />
          <Route path="/disimpan" element={<More.Saved />} />
          <Route path="/arsip" element={<More.Archive />} />
          <Route path="/pengaturan" element={<More.Settings />} />
          <Route path="/profil" element={<Profile />} />
          <Route path="/:username" element={<Profile />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Suspense>
      {create && (
        <Suspense fallback={null}>
          <Create open={!!create} initialKind={create.kind} initialStage={create.stage} onClose={() => setCreate(null)} onCreated={() => setRefreshKey((k) => k + 1)} />
        </Suspense>
      )}
      <OfflineIndicator />
    </Shell>
  );
}
