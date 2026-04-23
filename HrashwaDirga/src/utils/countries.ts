import * as RNLocalize from 'react-native-localize';

/**
 * country list for username setup.
 * iso 3166-1 alpha-2 codes with flag emoji and display name.
 */

export const COUNTRY_LIST = [
  { code: 'AF', name: 'Afghanistan', flag: '🇦🇫' },
  { code: 'AL', name: 'Albania', flag: '🇦🇱' },
  { code: 'DZ', name: 'Algeria', flag: '🇩🇿' },
  { code: 'AR', name: 'Argentina', flag: '🇦🇷' },
  { code: 'AU', name: 'Australia', flag: '🇦🇺' },
  { code: 'AT', name: 'Austria', flag: '🇦🇹' },
  { code: 'BD', name: 'Bangladesh', flag: '🇧🇩' },
  { code: 'BE', name: 'Belgium', flag: '🇧🇪' },
  { code: 'BR', name: 'Brazil', flag: '🇧🇷' },
  { code: 'CA', name: 'Canada', flag: '🇨🇦' },
  { code: 'CN', name: 'China', flag: '🇨🇳' },
  { code: 'CO', name: 'Colombia', flag: '🇨🇴' },
  { code: 'HR', name: 'Croatia', flag: '🇭🇷' },
  { code: 'CZ', name: 'Czech Republic', flag: '🇨🇿' },
  { code: 'DK', name: 'Denmark', flag: '🇩🇰' },
  { code: 'EG', name: 'Egypt', flag: '🇪🇬' },
  { code: 'FI', name: 'Finland', flag: '🇫🇮' },
  { code: 'FR', name: 'France', flag: '🇫🇷' },
  { code: 'DE', name: 'Germany', flag: '🇩🇪' },
  { code: 'GH', name: 'Ghana', flag: '🇬🇭' },
  { code: 'GR', name: 'Greece', flag: '🇬🇷' },
  { code: 'HU', name: 'Hungary', flag: '🇭🇺' },
  { code: 'IN', name: 'India', flag: '🇮🇳' },
  { code: 'ID', name: 'Indonesia', flag: '🇮🇩' },
  { code: 'IE', name: 'Ireland', flag: '🇮🇪' },
  { code: 'IL', name: 'Israel', flag: '🇮🇱' },
  { code: 'IT', name: 'Italy', flag: '🇮🇹' },
  { code: 'JP', name: 'Japan', flag: '🇯🇵' },
  { code: 'KE', name: 'Kenya', flag: '🇰🇪' },
  { code: 'KR', name: 'South Korea', flag: '🇰🇷' },
  { code: 'MY', name: 'Malaysia', flag: '🇲🇾' },
  { code: 'MX', name: 'Mexico', flag: '🇲🇽' },
  { code: 'MA', name: 'Morocco', flag: '🇲🇦' },
  { code: 'NP', name: 'Nepal', flag: '🇳🇵' },
  { code: 'NL', name: 'Netherlands', flag: '🇳🇱' },
  { code: 'NZ', name: 'New Zealand', flag: '🇳🇿' },
  { code: 'NG', name: 'Nigeria', flag: '🇳🇬' },
  { code: 'NO', name: 'Norway', flag: '🇳🇴' },
  { code: 'PK', name: 'Pakistan', flag: '🇵🇰' },
  { code: 'PH', name: 'Philippines', flag: '🇵🇭' },
  { code: 'PL', name: 'Poland', flag: '🇵🇱' },
  { code: 'PT', name: 'Portugal', flag: '🇵🇹' },
  { code: 'RO', name: 'Romania', flag: '🇷🇴' },
  { code: 'RU', name: 'Russia', flag: '🇷🇺' },
  { code: 'SA', name: 'Saudi Arabia', flag: '🇸🇦' },
  { code: 'ZA', name: 'South Africa', flag: '🇿🇦' },
  { code: 'ES', name: 'Spain', flag: '🇪🇸' },
  { code: 'LK', name: 'Sri Lanka', flag: '🇱🇰' },
  { code: 'SE', name: 'Sweden', flag: '🇸🇪' },
  { code: 'CH', name: 'Switzerland', flag: '🇨🇭' },
  { code: 'TW', name: 'Taiwan', flag: '🇹🇼' },
  { code: 'TH', name: 'Thailand', flag: '🇹🇭' },
  { code: 'TR', name: 'Turkey', flag: '🇹🇷' },
  { code: 'UA', name: 'Ukraine', flag: '🇺🇦' },
  { code: 'GB', name: 'United Kingdom', flag: '🇬🇧' },
  { code: 'US', name: 'United States', flag: '🇺🇸' },
  { code: 'VN', name: 'Vietnam', flag: '🇻🇳' },
].sort((a, b) => a.name.localeCompare(b.name));

/**
 * map common timezones to ISO country codes
 * not perfect but works well for most users
 */
const TIMEZONE_TO_COUNTRY: Record<string, string> = {
  'Asia/Kolkata': 'IN',
  'Asia/Kathmandu': 'NP',
  'Asia/Dhaka': 'BD',
  'Asia/Karachi': 'PK',
  'Asia/Colombo': 'LK',

  'Europe/London': 'GB',
  'Europe/Paris': 'FR',
  'Europe/Berlin': 'DE',
  'Europe/Rome': 'IT',

  'America/New_York': 'US',
  'America/Los_Angeles': 'US',
  'America/Chicago': 'US',

  'Australia/Sydney': 'AU',
  'Australia/Melbourne': 'AU',

  'Asia/Tokyo': 'JP',
  'Asia/Seoul': 'KR',
  'Asia/Shanghai': 'CN',
};

/**
 * synchronous country detection from timezone and locale.
 * safe to use in useState initializer — no async, no network call.
 * covers most common cases accurately.
 */
export const getDeviceCountrySync = (): string => {
  try {
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
    if (tz && TIMEZONE_TO_COUNTRY[tz]) {
      return TIMEZONE_TO_COUNTRY[tz];
    }
    const locale = Intl.DateTimeFormat().resolvedOptions().locale;
    if (locale.includes('-')) {
      const region = locale.split('-').pop();
      if (region && region.length === 2) {
        return region.toUpperCase();
      }
    }
  } catch {
    // silent
  }
  return 'US';
};

/**
 * async country refinement using ip geolocation.
 * call this in useEffect to improve accuracy after initial render.
 * falls back to sync result if network unavailable.
 */
export const getDeviceCountryAsync = async (): Promise<string> => {
  try {
    const res = await fetch('https://ipapi.co/json/');
    const data = await res.json();
    if (data?.country_code && data.country_code.length === 2) {
      return data.country_code.toUpperCase();
    }
  } catch {
    // silent fallback to sync
  }
  return getDeviceCountrySync();
};

/** kept for backward compatibility */
export const getDeviceCountry = getDeviceCountrySync;

/** get flag emoji from ISO country code */
export const getFlagEmoji = (countryCode: string): string => {
  if (!countryCode || countryCode.length !== 2) return '';
  const code = countryCode.toUpperCase();
  /**
   * flag emoji = regional indicator letters.
   * each letter maps to unicode 0x1F1E6 + (charCode - 65).
   */
  const chars = [...code].map(c =>
    String.fromCodePoint(0x1f1e6 + c.charCodeAt(0) - 65),
  );
  return chars.join('');
};

/** get country name from code */
export const getCountryName = (code: string): string => {
  return COUNTRY_LIST.find(c => c.code === code.toUpperCase())?.name ?? code;
};
