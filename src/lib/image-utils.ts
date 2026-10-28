/**
 * Utilitas gambar sisi klien: kompresi berkas menjadi data URL
 * agar dapat disimpan langsung ke basis data (tanpa layanan penyimpanan terpisah).
 */

export function fileToDataUrl(
  file: File,
  opts: { maxSide?: number; quality?: number } = {}
): Promise<string> {
  const maxSide = opts.maxSide ?? 1000;
  const quality = opts.quality ?? 0.75;
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error("Gagal membaca berkas"));
    reader.onload = () => {
      const img = new Image();
      img.onerror = () => reject(new Error("Berkas bukan gambar yang valid"));
      img.onload = () => {
        const scale = Math.min(1, maxSide / Math.max(img.width, img.height));
        const w = Math.max(1, Math.round(img.width * scale));
        const h = Math.max(1, Math.round(img.height * scale));
        const canvas = document.createElement("canvas");
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext("2d");
        if (!ctx) return reject(new Error("Peramban tidak mendukung pengolah gambar"));
        ctx.drawImage(img, 0, 0, w, h);
        resolve(canvas.toDataURL("image/jpeg", quality));
      };
      img.src = String(reader.result);
    };
    reader.readAsDataURL(file);
  });
}
