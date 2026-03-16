
export const csvUtil = {
  normalizeUsDate:(postingDate: string): string => {
    const parts = postingDate.split('/');
    if (parts.length !== 3) {
      throw new Error(`Invalid date format: ${postingDate}`);
    }
    const [mm, dd, yyyy] = parts;
    console.log('normalized date: ', `${yyyy}-${mm?.padStart(2, '0')}-${dd?.padStart(2, '0')}`)
    return `${yyyy}-${mm?.padStart(2, '0')}-${dd?.padStart(2, '0')}`;
  },

  normalizeUsShortDate:(postingDate: string): string => {
    const parts = postingDate.split('/');
    if (parts.length !== 3) {
      throw new Error(`Invalid date format: ${postingDate}`);
    }
    let [mm, dd, yyyy] = parts;
    // Handle 2-digit year (25 → 2025, 99 → 1999)
    if (yyyy?.length === 2) {
      const yy = parseInt(yyyy, 10);
      yyyy = yy >= 0 && yy <= 29 ? `20${yyyy}` : `19${yyyy}`;
    }
    return `${yyyy}-${mm?.padStart(2, '0')}-${dd?.padStart(2, '0')}`;
  },

  cleanMerchant:(description: string): string => {
    return description
      .trim()
      .replace(/\s+/g, ' ')  // collapse multiple spaces
      .replace(/^["']|["']$/g, '');  // strip surrounding quotes
  }
}

