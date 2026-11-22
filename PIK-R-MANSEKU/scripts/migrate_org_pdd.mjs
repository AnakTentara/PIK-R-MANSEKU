import prisma from '../src/config/db.js';
import { saveCatalog } from '../src/utils/orgCatalog.js';

const DESCRIPTIONS_AND_TAGS = {
  'Pembina': {
    description: 'Membimbing, mengarahkan, dan mengawasi jalannya seluruh kegiatan dan kepengurusan PIK-R MANSEKU.',
    tags: ['pembina', 'pembimbing', 'guru', 'penasihat', 'pembina pik-r']
  },
  'Ketua Umum': {
    description: 'Pemimpin tertinggi PIK-R MANSEKU, bertanggung jawab atas seluruh kebijakan, program kerja, dan koordinasi internal serta eksternal.',
    tags: ['ketua', 'ketum', 'pimpinan', 'leader', 'ketua umum']
  },
  'Wakil Ketua Umum 1': {
    description: 'Mendampingi Ketua Umum dalam koordinasi bidang internal, pembinaan divisi, dan evaluasi program kerja.',
    tags: ['wakil', 'waka', 'wakil ketua', 'waka 1', 'wakil ketua umum 1']
  },
  'Wakil Ketua 2': {
    description: 'Mendampingi Ketua Umum dalam koordinasi eksternal, kemitraan, dan kelancaran operasional kegiatan.',
    tags: ['wakil 2', 'waka 2', 'wakil ketua 2']
  },
  'Sekretaris 1': {
    description: 'Mengelola administrasi persuratan, pengarsipan dokumen resmi, proposal, dan notulensi rapat.',
    tags: ['sekretaris', 'sekre', 'admin', 'sekretariat', 'sekretaris 1']
  },
  'Sekretaris 2': {
    description: 'Membantu Sekretaris 1 dalam pencatatan inventaris organisasi, pendataan anggota, dan administrasi berkala.',
    tags: ['sekretaris 2', 'sekre 2']
  },
  'Bendahara Umum': {
    description: 'Mengatur sirkulasi keuangan organisasi, pembukuan kas masuk/keluar, dan transparansi anggaran program kerja.',
    tags: ['bendahara', 'uang', 'kas', 'keuangan', 'finance', 'bendum']
  },
  'Koordinator PDD': {
    description: 'Mengkoordinir divisi Publikasi, Dekorasi, dan Dokumentasi (PDD) dalam peliputan kegiatan, desain grafis, media sosial, dan dokumentasi visual.',
    tags: ['pdd', 'medinfo', 'media', 'publikasi', 'dokumentasi', 'desain', 'desain grafis', 'konten', 'fotografi', 'videografi', 'sosmed']
  },
  'Anggota PDD': {
    description: 'Staff pelaksana publikasi, dokumentasi foto & video kegiatan, pembuatan pamflet, editing konten medsos, dan dekorasi event.',
    tags: ['anggota pdd', 'anggota medinfo', 'staff pdd', 'tim pdd', 'editor', 'fotografer', 'videografer', 'desainer']
  },
  'Koordinator Konselor Sebaya': {
    description: 'Mengkoordinir layanan konseling teman sebaya, mendengarkan curhat remaja, menjaga kerahasiaan konseling, dan kesehatan mental remaja.',
    tags: ['konselor', 'konseling', 'curhat', 'teman sebaya', 'mental health', 'konselor sebaya']
  },
  'Anggota Konselor Sebaya': {
    description: 'Konselor sebaya yang siap mendengarkan, mendampingi, dan memberikan dukungan emosional positif bagi teman sebaya.',
    tags: ['anggota konselor', 'staff konselor', 'konselor', 'pendengar']
  },
  'Koordinator Pendidik Sebaya': {
    description: 'Mengkoordinir kegiatan edukasi sebaya, penyuluhan kesehatan reproduksi, gizi remaja, pencegahan stunting, dan substansi GenRe.',
    tags: ['pendidik', 'edukasi', 'pendidik sebaya', 'sosialisasi', 'materi genre', 'penyuluhan']
  },
  'Anggota Pendidik Sebaya': {
    description: 'Fasilitator edukasi sebaya yang menyampaikan materi kesehatan remaja dan GenRe kepada siswa di kelas maupun kegiatan forum.',
    tags: ['anggota pendidik', 'staff pendidik', 'fasilitator']
  },
  'Koordinator HUMAS': {
    description: 'Membangun relasi kemitraan dengan pihak sekolah, BKKBN, instansi eksternal, alumni, dan komunikasi kemasyarakatan.',
    tags: ['humas', 'hubungan masyarakat', 'eksternal', 'pr', 'public relations', 'kemitraan']
  },
  'Anggota Humas': {
    description: 'Staff pelaksana komunikasi publik, penyebaran informasi kegiatan ke kelas-kelas, dan penghubung antarkelompok.',
    tags: ['anggota humas', 'staff humas', 'penyebar info']
  },
  'Koordinator Informasi dan Edukasi': {
    description: 'Mengembangkan media literasi remaja, leaflet, majalah dinding/buletin edukatif, dan materi informasi kesehatan terkini.',
    tags: ['kie', 'informasi', 'edukasi', 'literasi', 'mading', 'buletin']
  },
  'Anggota Informasi': {
    description: 'Staff riset materi informasi kredibel, perancang artikel buletin, dan penyusun infografis edukatif.',
    tags: ['anggota informasi', 'staff kie', 'anggota kie']
  },
  'Koordinator Konselor dan Pendamping': {
    description: 'Mengkoordinir pendampingan khusus kasus remaja, fasilitasi ruang cerita, dan mediasi rujukan lanjutan ke Guru BK.',
    tags: ['pendamping', 'pendampingan', 'advokasi', 'bk', 'ruang cerita']
  },
  'Anggota Konseling dan Pendamping': {
    description: 'Staff pendamping teman sebaya dalam ruang cerita serta pemantau perkembangan kondisi emosional anggota.',
    tags: ['anggota pendamping', 'anggota konseling', 'pendamping sebaya']
  }
};

async function run() {
  console.log('🔄 Memulai migrasi Anggota MedInfo -> Anggota PDD dan melengkapi deskripsi serta tag...');

  // 1. Ambil setting saat ini
  const row = await prisma.setting.findUnique({ where: { key: 'ORG_POSITIONS' } });
  if (!row) {
    console.error('Setting ORG_POSITIONS tidak ditemukan di DB.');
    process.exit(1);
  }

  let list = JSON.parse(row.value);

  // 2. Siapkan update list
  const updatedList = list.map(item => {
    let label = item.label;
    let was = undefined;
    let parent = item.parent;

    if (label === 'Anggota MedInfo') {
      label = 'Anggota PDD';
      was = 'Anggota MedInfo';
      parent = 'Koordinator PDD';
    }

    const info = DESCRIPTIONS_AND_TAGS[label] || {};
    return {
      ...item,
      label,
      was,
      parent,
      description: item.description || info.description || '',
      tags: item.tags || info.tags || []
    };
  });

  // 3. Simpan dengan saveCatalog agar otomatis memperbarui data anggota pengurus aktif!
  const res = await saveCatalog(updatedList);
  console.log('✅ saveCatalog berhasil!');
  console.log('Hasil renamed:', res.renamed);

  // 4. Pastikan di database semua pengurus yang sebelumnya 'Anggota MedInfo' telah menjadi 'Anggota PDD'
  const countPdd = await prisma.orgMember.count({ where: { isCurrent: true, jabatan: 'Anggota PDD' } });
  const countMedinfo = await prisma.orgMember.count({ where: { isCurrent: true, jabatan: 'Anggota MedInfo' } });
  console.log(`📊 Anggota PDD aktif saat ini: ${countPdd} orang (Anggota MedInfo tersisa: ${countMedinfo} orang)`);

  process.exit(0);
}

run().catch(err => {
  console.error('❌ Gagal:', err);
  process.exit(1);
});
