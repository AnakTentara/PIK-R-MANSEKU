import pandas as pd
import openpyxl
from openpyxl.styles import Font, PatternFill, Alignment, Border, Side
from openpyxl.utils import get_column_letter

# Load original Excel file
excel_path = r'D:\Downloads\rekap_pendaftaran_pikr.xlsx'
raw_df = pd.read_excel(excel_path)
print("Raw columns:", raw_df.columns)

# We know header starts at row index 2 (1-based line 4)
df = pd.read_excel(excel_path, skiprows=2)
df.columns = [str(c).strip() for c in df.columns]
df = df.dropna(subset=['Nama']).copy()

# Mapping between PNG (presensi) and Excel (pendaftaran)
# Items in PNG: 51 people
mapping = [
    (1, 'Nadia Al-Hafizho', 'X.2', 23, 'Nama di PNG ditulis "Nadia Al-Hafizho", nama resmi pendaftar "Nadira Al Hafizho Selimat"'),
    (2, 'Syakira Atiqah Ikhansa Novacia', 'XI.2', 66, 'Nama di PNG ditulis "Syakira Atiqah Ikhansa Novacia", nama resmi pendaftar "Syakira Ariqah Khansa Novalia"'),
    (3, 'Zahra Wahyuni', 'X.6', 49, 'Nama di PNG ditulis "Zahra Wahyuni", nama resmi pendaftar "Zahira Wahyuni"'),
    (4, 'Naila Oratia Dwiani', 'X.8', 62, 'Nama di PNG ditulis "Naila Oratia Dwiani" (X.8), nama resmi pendaftar "Naila Dratia Dwiani" (X-9)'),
    (5, 'Aletya Dwi Putri', 'X.6', 46, 'Nama di PNG ditulis "Aletya Dwi Putri", nama resmi pendaftar "Altya Dwi Putri"'),
    (6, 'Mishelni Hafizah', 'X.7', 54, 'Nama sesuai'),
    (7, 'Elisya Dwi Fitriani', 'X.2', 16, 'Nama sesuai'),
    (8, 'Cecilia Audia Merzyta', 'X.2', 15, 'Nama sesuai'),
    (9, 'Nabila Ayu Lestari', 'X.2', 21, 'Nama di PNG ditulis "Nabila Ayu Lestari", nama resmi pendaftar "Nabila Ayu Lastari"'),
    (10, 'Rani Sebrina', 'X.9', 63, 'Nama sesuai'),
    (11, 'Kaya Salsabila', 'X.9', 61, 'Nama di PNG ditulis "Kaya Salsabila", nama resmi pendaftar "Kayla Salsabila"'),
    (12, 'Nadiya Al-Hafizhoh', 'X.1', 6, 'Nama sesuai'),
    (13, 'Nayyara Nur Artanty', 'X.4', 33, 'Nama sesuai'),
    (14, 'Naila Izzah Sabilillah', 'X.4', 31, 'Nama sesuai'),
    (15, 'Adrinne Anandya Arsya', 'X.2', 12, 'Nama sesuai'),
    (16, 'Yasmin Qanitah', 'X.2', 8, 'Kelas di PNG ditulis X.2, nama resmi di Excel kelas X-1'),
    (17, 'Zalwa Nur Afifa Putri', 'X.1', 10, 'Nama sesuai'),
    (18, 'Ghisa Fawzah Putri', 'X.1', 2, 'Nama sesuai'),
    (19, 'Naira Khoirunnisa', 'X.1', 7, 'Nama sesuai'),
    (20, 'Ahza Shoagurdeia', 'X.1', 11, 'Nama di PNG ditulis "Ahza Shoagurdeia", nama resmi pendaftar "Ahza Sholaqurdelia"'),
    (21, 'Inayah Salsabilah Tanjung', 'X.2', 18, 'Nama di PNG ditulis "Inayah Salsabilah Tanjung", nama resmi pendaftar "Inayah Salsabillah Tanjung"'),
    (22, 'Annisa Almadinah', 'X.2', 13, 'Nama sesuai'),
    (23, 'Chika Azzah Afifah', 'X.1', 0, 'Nama sesuai'),
    (24, 'Nurul Dhiya Niffah', 'XI.1', 65, 'Nama di PNG ditulis "Nurul Dhiya Niffah", nama resmi pendaftar "Aurel Dhiya Rifqah"'),
    (25, 'Naya Fitri Ramadhani', 'X.4', 32, 'Nama di PNG ditulis "Naya Fitri Ramadhani", nama resmi pendaftar "Nayla Fitri Ramadhani"'),
    (26, 'Windi Catur Ratri', 'X.4', 36, 'Nama sesuai'),
    (27, 'Wsnda Naisa Revita', 'X.5', 41, 'Nama di PNG ditulis "Wsnda Naisa Revita", nama resmi pendaftar "Wanda Naira Revita"'),
    (28, 'Anggraini Jenia Novianti', 'X.3', 27, 'Nama di PNG ditulis "Anggraini Jenia Novianti", nama resmi pendaftar "Anggraini Junia Novianti"'),
    (29, 'Putri Khoirpa Chotunnisa', 'X.3', 30, 'Nama di PNG ditulis "Putri Khoirpa Chotunnisa", nama resmi pendaftar "Putri Kholipa Choironisa"'),
    (30, 'Okta Regina Putri', 'X.9', 34, 'Nama di PNG ditulis "Okta Regina Putri" (X.9), nama resmi pendaftar "Oktia Regina Putri" (X-4)'),
    (31, 'Siipa Enselina', 'X.2', 26, 'Nama di PNG ditulis "Siipa Enselina", nama resmi pendaftar "Silpa Enjelita"'),
    (32, 'Aisyah Munawaroh', 'X.6', 44, 'Nama sesuai'),
    (33, 'Adila Bilqis', 'X.6', 43, 'Nama di PNG ditulis "Adila Bilqis", nama resmi pendaftar "Adilah Bilqis"'),
    (34, 'Deby Adella Herlino', 'X.6', 47, 'Nama di PNG ditulis "Deby Adella Herlino", nama resmi pendaftar "Deby Adelia Herlino"'),
    (35, 'Ririn Utra Lestari', 'X.7', 56, 'Nama di PNG ditulis "Ririn Utra Lestari", nama resmi pendaftar "Ririn Citra Lestari"'),
    (36, 'Alpina Puspitasari', 'X.6', 45, 'Nama sesuai'),
    (37, 'Evi Rahmadhani', 'X.1', 1, 'Nama sesuai'),
    (38, 'Aisyah Denaka', 'X.7', 50, 'Nama di PNG ditulis "Aisyah Denaka", nama resmi pendaftar "Aisyah Denata"'),
    (39, 'Kareni Laura Rahmadani', 'X.7', 52, 'Nama sesuai'),
    (40, 'Mellani Ananta', 'X.7', 53, 'Nama sesuai'),
    (41, 'Janeeta', 'X.3', 29, 'Nama sesuai'),
    (42, 'Kanista Syarifatulzzahra', 'X.8', 58, 'Nama di PNG ditulis "Kanista Syarifatulzzahra", nama resmi pendaftar "Kalista Syarifatuzzahra"'),
    (43, 'Muhammad Amirul Amin', 'X.1', 5, 'Nama sesuai'),
    (44, 'M. Berlian Almirafi', 'X.1', 3, 'Nama sesuai'),
    (45, 'Yusuf Athallah', 'X.7', 9, 'Kelas di PNG ditulis X.7, nama resmi di Excel kelas X-1'),
    (46, 'Kenzie Favian Mahardika Ramaay', 'X.8', 59, 'Nama di PNG ditulis "Kenzie Favian Mahardika Ramaay", nama resmi pendaftar "Kenzie Favian Mahardika Ramaqy"'),
    (47, 'Kioshi Azka Azzukra', 'X.9', 64, 'Nama di PNG ditulis "Kioshi Azka Azzukra", nama resmi pendaftar "Kioshi Azka Azzikra"'),
    (48, 'Rifqi Al Habsyi', 'X.5', 40, 'Nama sesuai'),
    (49, 'M. Aziz Al Hady', 'X.2', 19, 'Nama sesuai'),
    (50, 'Muhammad Iqbal Syahputra', 'X.1', 4, 'Nama di PNG ditulis "Muhammad Iqbal Syahputra", nama resmi pendaftar "Muhammad Arzal Sya\'bani"'),
    (51, 'Ahmad Bagas Pratama', 'XI.5', 70, 'Nama di PNG ditulis "Ahmad Bagas Pratama", nama resmi pendaftar "Rahmad Bagas Pratama"')
]

hadir_indices = {item[3]: item for item in mapping}

# Build status & typo note for df
status_list = []
typo_notes = []
png_names = []

for idx in range(len(df)):
    if idx in hadir_indices:
        status_list.append('Hadir')
        item = hadir_indices[idx]
        png_names.append(item[1])
        typo_notes.append(item[4])
    else:
        status_list.append('Tidak Hadir')
        png_names.append('-')
        typo_notes.append('-')

df['Status Kehadiran'] = status_list
df['Nama Presensi (PNG)'] = png_names
df['Keterangan Koreksi / Typo'] = typo_notes

print("\n--- STATISTIK KEHADIRAN ---")
print("Total Pendaftar:", len(df))
print("Total Hadir:", len(df[df['Status Kehadiran'] == 'Hadir']))
print("Total Tidak Hadir:", len(df[df['Status Kehadiran'] == 'Tidak Hadir']))

# Display non-attended list
tidak_hadir_df = df[df['Status Kehadiran'] == 'Tidak Hadir'].copy()
print("\n=== DAFTAR PENDAFTAR YANG TIDAK HADIR (20 SISWA) ===")
print(tidak_hadir_df[['No.', 'NISN', 'Nama', 'Kelas']].to_string(index=False))

# Display typo corrections list
typo_df = df[df['Keterangan Koreksi / Typo'].str.contains('PNG')].copy()
print(f"\n=== DAFTAR KOREKSI TYPO / BEDA PENULISAN NAMA ({len(typo_df)} SISWA) ===")
print(typo_df[['No.', 'Nama', 'Nama Presensi (PNG)', 'Kelas', 'Keterangan Koreksi / Typo']].to_string(index=False))

