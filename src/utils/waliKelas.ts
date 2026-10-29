import { Guru, UserAccount, WaliKelasAssignment } from '../types';

/**
 * Normalizes a teacher name by removing academic titles, honorary titles,
 * punctuation, and excessive whitespace for flexible, robust matching.
 */
export const normalizeTeacherName = (str: string): string => {
  if (!str) return '';
  return str
    .toLowerCase()
    .replace(/,\s*(s\.pd|m\.pd|s\.kom|s\.si|s\.t|m\.kom|m\.si|drs|dra|dr|prof|h|hj|s\.sos|m\.sc)\.?/gi, '')
    .replace(/\b(drs|dra|dr|prof|h|hj|ustadz|ustazah|bapak|ibu)\b\.?/gi, '')
    .replace(/[^a-z0-9]/gi, '')
    .trim();
};

/**
 * Robustly finds the designated Wali Kelas assignment for a given user.
 * Supports:
 * 1. Exact full name match
 * 2. Title-stripped normalized match
 * 3. Substring matching
 * 4. Username / email prefix matching
 * 5. Assigned teacher ID matching
 */
export const findWaliAssignment = (
  user: UserAccount | null | undefined,
  waliKelasList: WaliKelasAssignment[],
  guruList?: Guru[]
): WaliKelasAssignment | undefined => {
  if (!user || !waliKelasList || waliKelasList.length === 0) return undefined;

  // 1. Exact match (case-insensitive & trimmed)
  const exact = waliKelasList.find(
    (wk) => wk.namaGuru.toLowerCase().trim() === user.fullName.toLowerCase().trim()
  );
  if (exact) return exact;

  // 2. Normalized match (without academic degrees)
  const userNorm = normalizeTeacherName(user.fullName);
  if (userNorm.length > 2) {
    const normMatch = waliKelasList.find(
      (wk) => normalizeTeacherName(wk.namaGuru) === userNorm
    );
    if (normMatch) return normMatch;
  }

  // 3. Substring / contains match
  if (userNorm.length >= 3) {
    const subMatch = waliKelasList.find((wk) => {
      const wkNorm = normalizeTeacherName(wk.namaGuru);
      return (
        (wkNorm.length >= 3 && wkNorm.includes(userNorm)) ||
        (userNorm.length >= 3 && userNorm.includes(wkNorm))
      );
    });
    if (subMatch) return subMatch;
  }

  // 4. By username or email prefix
  const usernameClean = normalizeTeacherName(user.username);
  if (usernameClean.length >= 3) {
    const byUsername = waliKelasList.find((wk) => {
      const wkNorm = normalizeTeacherName(wk.namaGuru);
      return wkNorm.includes(usernameClean) || usernameClean.includes(wkNorm);
    });
    if (byUsername) return byUsername;
  }

  // 5. Match via assignedTeacherId if available
  if (user.assignedTeacherId && guruList && guruList.length > 0) {
    const matchedGuru = guruList.find((g) => g.id === user.assignedTeacherId);
    if (matchedGuru) {
      const guruNorm = normalizeTeacherName(matchedGuru.nama);
      const byGuruId = waliKelasList.find(
        (wk) => normalizeTeacherName(wk.namaGuru) === guruNorm
      );
      if (byGuruId) return byGuruId;
    }
  }

  // 6. Match via user's first name word
  const firstWord = user.fullName.trim().split(' ')[0];
  if (firstWord && firstWord.length >= 3) {
    const firstWordNorm = normalizeTeacherName(firstWord);
    const byFirstWord = waliKelasList.find((wk) =>
      normalizeTeacherName(wk.namaGuru).includes(firstWordNorm)
    );
    if (byFirstWord) return byFirstWord;
  }

  return undefined;
};
