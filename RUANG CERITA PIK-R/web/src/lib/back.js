import { useEffect, useRef } from 'react';

/**
 * Tombol Kembali di HP (PWA terpasang) menutup popup dulu, bukan halaman/aplikasi.
 * Tiap popup terbuka menambah satu entri riwayat; Kembali menutup popup teratas.
 * Menutup popup lewat tombol × juga menghapus entri itu, jadi riwayat tetap rapi.
 *
 * Pergantian layar dalam satu render (mis. kamera → penyunting) tidak boleh memanggil
 * history.back() lalu pushState(): back() berjalan belakangan dan akan menutup layar baru.
 * Karena itu penghapusan entri ditunda ke microtask; bila ada popup baru di render yang sama,
 * entri lama dipakai ulang.
 */
const stack = [];
let pendingBack = 0;
let selfPops = 0;        // popstate yang kita picu sendiri lewat history.go(): jangan dianggap tombol Kembali

window.addEventListener('popstate', () => {
  if (selfPops > 0) { selfPops--; return; }
  const top = stack[stack.length - 1];
  if (top && !top.closing) {
    top.closing = true;
    stack.pop();
    top.close();
  }
});

function flush() {
  const n = pendingBack;
  pendingBack = 0;
  if (n > 0 && window.history.state?.rcSheet) {
    selfPops++;
    window.history.go(-n);
    setTimeout(() => { selfPops = 0; }, 600);   // jaga-jaga bila popstate tidak pernah datang
  }
}

export function useBackClose(open, onClose) {
  const closeRef = useRef(onClose);
  closeRef.current = onClose;
  useEffect(() => {
    if (!open) return undefined;
    const entry = { close: () => closeRef.current?.(), closing: false };
    stack.push(entry);
    if (pendingBack > 0) pendingBack--; // pakai ulang entri popup yang baru ditutup
    else window.history.pushState({ rcSheet: stack.length }, '');
    return () => {
      // Ditutup bukan lewat tombol Kembali: buang entri riwayat milik popup ini
      if (!entry.closing) {
        entry.closing = true;
        const i = stack.indexOf(entry);
        if (i >= 0) stack.splice(i, 1);
        pendingBack++;
        queueMicrotask(flush);
      }
    };
  }, [open]);
}
