import multer from 'multer';

// Files are held in memory just long enough to forward the buffer to
// Supabase Storage — we never write them to disk on this server.
const storage = multer.memoryStorage();

export const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB cap for avatars / ID photos
  fileFilter: (req, file, cb) => {
    const allowed = ['image/jpeg', 'image/png', 'image/webp'];
    if (!allowed.includes(file.mimetype)) {
      return cb(new Error('Only JPEG, PNG, or WEBP images are allowed.'));
    }
    cb(null, true);
  },
});
