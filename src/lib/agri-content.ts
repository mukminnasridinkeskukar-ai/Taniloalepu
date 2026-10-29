// Konten statis platform Tani Loa Lepu (gambar & panduan)
import MRaw from "@/lib/image-manifest.json";

const M = MRaw as Record<string, string[]>;
const A = (k: string, i: number): string => M[k]?.[i] ?? M[k]?.[0] ?? "";

export const HERO_IMAGES = {
  farmer: A("hero_farmer", 0),
  farmer2: A("hero_farmer", 1),
  sawah: A("hero_sawah", 0),
  sawah2: A("hero_sawah", 2),
  sawah3: A("hero_sawah", 3),
  sawah4: A("hero_sawah", 4),
};

export const LAND_PRESET_IMAGES: string[] = [
  A("hero_sawah", 0), A("hero_sawah", 1), A("hero_sawah", 2), A("hero_sawah", 3), A("hero_sawah", 4), A("crop_padi", 2),
];

// Pilihan gambar produk hasil panen — 24 foto: sayur, buah, beras, bumbu, hasil ternak & olahan
export const PRODUCT_PRESET_IMAGES: string[] = [
  A("prod_sayur", 0), A("prod_sayurmix", 0), A("prod_sayurmix", 1), A("prod_sayurmix", 2),
  A("prod_beras", 0), A("prod_beras", 2), A("prod_tomat", 1), A("prod_cabai", 2),
  A("prod_cabai", 1), A("prod_jagung", 3), A("prod_jagung", 0), A("prod_kangkung", 0),
  A("prod_pisang", 1), A("prod_pisang", 2), A("prod_mangga", 2), A("prod_buahmix", 0),
  A("prod_buahmix", 1), A("prod_ubijalar", 0), A("prod_bumbu", 0), A("prod_bumbu", 1),
  A("prod_bumbu", 3), A("prod_madu", 1), A("prod_telur", 2), A("prod_telur", 0),
];

export type PrepStep = {
  id: string;
  title: string;
  duration: string;
  image: string;
  description: string;
  tips: string[];
};

export const PREP_STEPS: PrepStep[] = [
  {
    id: "survey",
    title: "1. Survei & Analisis Lahan",
    duration: "1–2 hari",
    image: A("hero_sawah", 4),
    description:
      "Kenali karakter lahan Anda sebelum bertindak: ukur luas wilayah, amati sumber air terdekat, arah sinar matahari, serta jenis tanah yang dimiliki. Analisis sederhana ini menentukan komoditas apa yang paling cocok dan berapa biaya awal yang dibutuhkan.",
    tips: [
      "Uji pH tanah dengan kertas lakmus murah — mayoritas tanaman ideal di pH 6–7",
      "Pastikan akses jalan untuk angkutan hasil panen",
      "Catat area yang tergenang saat hujan untuk dijadikan saluran drainase",
    ],
  },
  {
    id: "bersih",
    title: "2. Pembersihan & Perbaikan Tanah",
    duration: "2–3 hari",
    image: A("prep_fertilizer", 2),
    description:
      "Bersihkan semak, batu, dan sisa akar lama dari lahan. Bekas vegetasi bisa dikomposkan menjadi pupuk organik gratis. Jika tanah terlalu padat atau masam, taburkan dolomit dan diamkan beberapa hari agar pH menyeimbang.",
    tips: [
      "Komposkan rumput & jerami — hemat biaya pupuk hingga 30%",
      "Dolomit 1–2 ton/ha untuk tanah masam (pH < 5,5)",
      "Bakar/singkirkan sisa tanaman sakit agar penyakit tidak menular",
    ],
  },
  {
    id: "olah",
    title: "3. Pengolahan Tanah (Bajak & Garu)",
    duration: "1–2 hari",
    image: A("prep_tractor", 1),
    description:
      "Bajak tanah sedalam 20–30 cm membalik lapisan atas yang subur ke bawah dan membunuh larva hama terkena matahari. Setelah itu garu hingga gembur dan buat bedengan sesuai komoditas yang akan ditanam.",
    tips: [
      "Sewa traktor gotong royong lebih murah daripada membeli",
      "Tunggu tanah cukup lembap — terlalu basah membuat tanah menggumpal",
      "Bedengan tinggi 30 cm cocok untuk cabai, tomat, dan bawang",
    ],
  },
  {
    id: "irigasi",
    title: "4. Irigasi & Drainase",
    duration: "2–4 hari",
    image: A("prep_irrigation", 0),
    description:
      "Air adalah nyawa pertanian: siapkan saluran masuk untuk penggenangan dan saluran keluar (drainase) untuk membuang kelebihan air. Lahan yang tergenang terus adalah sarang penyakit busuk akar.",
    tips: [
      "Gunakan sistem tetes atau sprinkler hemat air di lahan kering",
      "Drainase ideal sedalam 40–50 cm untuk sayuran",
      "Buat kolam penampung kecil untuk cadangan musim kering",
    ],
  },
  {
    id: "pupuk",
    title: "5. Pemupukan Dasar",
    duration: "1 hari",
    image: A("prep_fertilizer", 0),
    description:
      "Aplikasikan pupuk kandang matang 1–2 minggu sebelum tanam agar nutrisi sempat terurai dan diserap tanah. Pupuk dasar yang cukup membuat bibit tumbuh serempak dan kuat sejak awal.",
    tips: [
      "Pupuk kandang 10–20 ton/ha untuk sayuran daun dan buah",
      "Campurkan Trichoderma ke pupuk kandang untuk cegah layu",
      "Pupuk NPK dasar diletakkan di lubang tanam, bukan disebar acak",
    ],
  },
  {
    id: "benih",
    title: "6. Pembenihan & Penanaman",
    duration: "Berlanjut",
    image: A("prep_planting", 0),
    description:
      "Pilih benih/bibit bersertifikat dari penjual resmi. Rendam benih sebelum semai untuk mempercepat kecambah, rawat di persemaian 2–3 minggu, lalu tatham di lahan dengan jarak tanam yang direkomendasikan.",
    tips: [
      "Benih unggul menentukan 40% keberhasilan panen",
      "Tatham sore hari agar bibit tidak stres terik",
      "Sisakan bibit cadangan 10% untuk penyulaman",
    ],
  },
];

export type SeasonRow = {
  crop: string;
  image: string;
  months: number[]; // 1-12
  note: string;
};

// Rekomendasi pola tanam musiman (ilustrasi umum Kalimantan Timur)
export const SEASON_CALENDAR: SeasonRow[] = [
  { crop: "Padi", image: A("crop_padi", 0), months: [11, 12, 1, 2, 3], note: "MT-1 musim hujan, produktivitas tertinggi" },
  { crop: "Jagung", image: A("crop_jagung", 1), months: [4, 5, 6, 10, 11, 12], note: "MT-2 setelah padi atau lahan kering" },
  { crop: "Cabai", image: A("crop_cabai", 0), months: [4, 5, 6, 7, 8], note: "Musim kemarau — harga paling baik" },
  { crop: "Bawang Merah", image: A("crop_bawang", 0), months: [5, 6, 7, 8, 9], note: "Butuh irigasi terkontrol" },
  { crop: "Kangkung", image: A("crop_kangkung", 0), months: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12], note: "Sepanjang tahun, panen 25 hari" },
  { crop: "Tomat", image: A("crop_tomat", 0), months: [3, 4, 9, 10, 11], note: "Hindari puncak musim hujan" },
];

export const MONTH_LABELS = ["Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Agu", "Sep", "Okt", "Nov", "Des"];

export const FAQ_ITEMS = [
  {
    q: "Berapa modal awal untuk menyiapkan 1.000 m² lahan?",
    a: "Untuk lahan sema tanah dan komoditas sayuran, kebutuhan umumnya Rp 2–4 juta mencakup bajak, pupuk dasar, benih, dan mulsa. Biaya bisa ditekan dengan kompos sendiri dan traktor gotong royong. Gunakan kalkulator di halaman Kelola Lahan untuk merencanakan anggaran tiap tahap.",
  },
  {
    q: "Kapan waktu terbaik menanam?",
    a: "Padi paling optimal di awal musim hujan (Oktober–Desember), sedangkan cabai, bawang, dan jagung justru menguntungkan di musim kemarau karena pasokan menurun dan harga naik. Sayuran daun seperti kangkung bisa ditanam sepanjang tahun.",
  },
  {
    q: "Tanah saya kapur dan sulit meng air, apa solusinya?",
    a: "Tanah kapur (litosol) cocok untuk singkong, jagung, dan kedelai. Perbaiki dengan bahan organik 10–20 ton/ha, buat teras/gulud untuk menahan air hujan, dan gunakan mulsa jerami agar kelembapan tidak cepat menguap.",
  },
  {
    q: "Bagaimana cara mendapatkan bibit unggul?",
    a: "Beli dari Balai Benih (BBI/BPSB) dinas pertanian setempat atau distributor resmi bertanda sertifikat. Untuk padi, banyak kabupaten menyediakan bantuan benih subsidi bagi kelompok tani — tanyakan ke penyuluh desa Anda.",
  },
  {
    q: "Apakah wajib punya traktor sendiri?",
    a: "Tidak. Mayoritas petani kecil menyewa jasa traktor (Rp 150–300 ribu per 1.000 m²) atau bergabung kelompok tani untuk berbagi alat. Sewa jauh lebih ekonomis untuk lahan di bawah 1 hektar.",
  },
];
