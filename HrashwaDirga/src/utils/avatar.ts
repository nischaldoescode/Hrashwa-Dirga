/**
 * Avatar utility using DiceBear v9 personas API.
 */

type AvatarStyle = 'personas' | 'lorelei' | 'avataaars-neutral' | 'micah';

// Weighted list so personas is used for almost all usernames
const AVATAR_STYLES: AvatarStyle[] = [
  'personas',
  'personas',
  'personas',
  'lorelei',
  'avataaars-neutral',
  'micah',
];

const getStyleForUsername = (username: string): AvatarStyle => {
  const sum = username.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0);

  return AVATAR_STYLES[sum % AVATAR_STYLES.length];
};

export const getAvatarUrl = (username: string, size: number = 80): string => {
  if (!username) return '';
  const style = getStyleForUsername(username);
  const seed = encodeURIComponent(username.toLowerCase());

  return `https://api.dicebear.com/9.x/${style}/png?seed=${seed}&size=${size}&scale=70`;
};

// small + large convenience helpers
export const getSmallAvatarUrl = (username: string): string =>
  getAvatarUrl(username, 40);

export const getLargeAvatarUrl = (username: string): string =>
  getAvatarUrl(username, 100);

// placeholder colors stay unchanged
const PLACEHOLDER_COLORS = [
  '#C4B49A',
  '#7B9E7B',
  '#4ABFBF',
  '#B8956A',
  '#A0785A',
  '#6B8B50',
];

export const getAvatarPlaceholderColor = (username: string): string => {
  const sum = username.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0);
  return PLACEHOLDER_COLORS[sum % PLACEHOLDER_COLORS.length];
};
