
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
  }, 

  mapNameToCategory:(name: string | null):  string | null => {
    if (!name || typeof name !== "string") return null;
    const n = name.trim().toUpperCase();
    // Mortgage / auto loans
    if (
      n.includes("ROUNDPOINT MTG") ||
      n.includes("MORTGAGE") ||
      n.includes("MAZDA FINANCIAL")
    ) {
      return "LOAN_PAYMENTS";
    }
    // Credit card payments
    if (
      n.includes("PAYMENT TO CHASE CARD") ||
      n.includes("CHASE CREDIT CRD AUTOPAY") ||
      n.includes("LOAN_PMT") ||
      n.includes("CRCARDPMT") ||
      (n.includes("DISCOVER") && n.includes("E-PAYMENT")) ||
      n.includes("CRCARDPMT")
    ) {
      return "PAYMENT_CREDIT_CARD";
    }
    // Property management / rent
    if (n.includes("ELITEHOMEMANA") || n.includes("PL*ELITE")) {
      return "RENT_AND_UTILITIES";
    }
    // HOA
    if (n.includes("HOA") || n.includes("SCARLET HOA")) {
      return "RENT_AND_UTILITIES";
    }
    // Telecom
    if (n.includes("ATT") && n.includes("PAYMENT")) {
      return "RENT_AND_UTILITIES";
    }
    // Bank / wire fees
    if (n.includes("WIRE FEE") || n.includes("DOMESTIC WIRE FEE")) {
      return "BANK_FEES";
    }
    // Wire transfers
    if (n.includes("WIRE TRANSFER") || n.includes("WIRE_OUTGOING")) {
      return "TRANSFER";
    }
    // Internal transfers (savings, account-to-account)
    if (
      n.includes("APPLE GS SAVINGS TRANSFER") ||
      n.includes("ONLINE TRANSFER") ||
      n.includes("TELEPHONE TRANSFER") ||
      n.includes("CBP TRANSFER") ||
      n.includes("ACCT_XFER") ||
      n.includes("REALTIME TRANSFER") ||
      n.includes("AMERICAN EXPRESS TRANSFER")
    ) {
      return "TRANSFER";
    }
    // Apple Card: ACH deposit from bank (payment to card)
    if (n.includes("ACH DEPOSIT INTERNET TRANSFER")) {
      return "TRANSFER";
    }
    // BOA: Keep the Change, Capital One transfer, online transfer
    if (
      n.includes("KEEP THE CHANGE TRANSFER") ||
      (n.includes("CAPITAL ONE") && n.includes("DES:TRANSFER")) ||
      n.includes("ONLINE SCHEDULED TRANSFER FROM CHK")
    ) {
      return "TRANSFER";
    }
    // Capital One: Apple Card payment, preauthorized withdrawal to other bank
    if (
      n.includes("WITHDRAWAL FROM APPLECARD GSBANK PAYMENT") ||
      n.includes("PREAUTHORIZED WITHDRAWAL TO BANK OF AMERICA")
    ) {
      return "TRANSFER";
    }
    // P2P - Zelle
    if (n.includes("ZELLE PAYMENT") || n.includes("ZELLE MONEY RECEIVED")) {
      return "TRANSFER";
    }
    // P2P - Venmo
    if (n.includes("VENMO")) {
      return "TRANSFER";
    }
    // Investment (Webull, Moomoo, etc.)
    if (
      n.includes("WEBULL") ||
      n.includes("MOOMOO") ||
      n.includes("FUTUINC")
    ) {
      return "INVESTMENT";
    }
    // Utilities (Gas South, Marietta Power, City of Marietta)
    if (
      n.includes("GAS SOUTH") ||
      n.includes("MARIETTA POWER") ||
      n.includes("CITY OF MARIETTA")
    ) {
      return "RENT_AND_UTILITIES";
    }
    // Landscaping / lawn care
    if (
      n.includes("LAWNSTARTER") ||
      n.includes("LAWNCARE") ||
      n.includes("MAPLE LEAF LANDSCAPE")
    ) {
      return "SERVICE_HOME_IMPROVEMENT";
    }
    // Home services
    if (n.includes("ADVANTA CLEAN")) return "SERVICE_CLEANING";
    if (n.includes("ROOTER PLUMBER") || n.includes("PLUMBER")) {
      return "SERVICE_HOME_IMPROVEMENT";
    }
    // Legal
    if (n.includes("BAILEY") && n.includes("HUNTER")) {
      return "SERVICE_LEGAL";
    }
    // Software / AI subscriptions (Cursor, Claude, OpenAI, Openphone, Adobe, Google One, Uber One)
    if (
      n.includes("CURSOR") ||
      n.includes("CLAUDE.AI") ||
      n.includes("OPENAI") ||
      n.includes("OPENPHONE") ||
      n.includes("ADOBE INC") ||
      n.includes("GOOGLE ONE") ||
      n.includes("UBER *ONE MEMB") ||
      n.includes("UBER ONE")
    ) {
      return "SERVICE_SUBSCRIPTION";
    }
    // Airlines
    if (n.includes("UNITED") || n.includes("DELTA") || n.includes("AIRLINES")) {
      return "TRAVEL";
    }
    // Public transport
    if (n.includes("TRENORD") || n.includes("FNM*")) {
      return "TRAVEL";
    }
    // Grocery / supermarkets
    if (
      n.includes("CRF EXP") ||
      n.includes("PAM LOCAL") ||
      n.includes("TO.MARKET") ||
      n.includes("2VN S.R.L")
    ) {
      return "FOOD_AND_DRINK";
    }
    // Restaurants (common chains + Italian patterns)
    if (
      n.includes("MC DONALDS") ||
      n.includes("KFC") ||
      n.includes("MCDONALD") ||
      n.includes("ZIA ESTERINA") ||
      n.includes("BERNI") ||
      n.includes("JIANG SHUZHOU") ||
      n.includes("PASTICCERIA") ||
      n.includes("STUZZICHERIA") ||
      n.includes("PIZZERIA") ||
      n.includes("ROSTICCERIA") ||
      n.includes("MERCATO CENTRALE") ||
      n.includes("FERRARO FRANCESCA") ||
      n.includes("MAXELA CHALET") ||
      n.includes("RIGADRITTO") ||
      n.includes("ARGANA") ||
      n.includes("ILLYCAFFE")
    ) {
      return "FOOD_AND_DRINK";
    }
    // Food
    if (n.includes("ENERGY JUICE")) return "FOOD_AND_DRINK";
    // Education
    if (n.includes("SUPERLINEAR ACADEMY")) {
      return "COMMUNITY_EDUCATION";
    }
    // Donations / charity
    if (n.includes("WIKIMEDIA")) {
      return "COMMUNITY";
    }
    // Construction / contractor
    if (n.includes("MMORNEAULT") || n.includes("& SONS")) {
      return "SERVICE_CONSTRUCTION";
    }
    // Apple Store / electronics
    if (n.includes("APPLE STORE") || n.includes("APPLE CANTON")) {
      return "SHOPS";
    }
    // Apple subscriptions
    if (n.includes("APPLE.COM/BILL") || n.includes("APPLE SERVICES")) {
      return "SERVICE_SUBSCRIPTION";
    }
    // Gaming / entertainment
    if (n.includes("PLAYSTATION") || n.includes("NINTENDO")) {
      return "RECREATION";
    }
    // Translation / professional services
    if (n.includes("RUSHTRANSLATE")) {
      return "SERVICE";
    }
    // Retail / cosmetics (Douglas)
    if (n.includes("DOUGLAS")) {
      return "SHOPS";
    }
    // Amazon
    if (n.includes("AMAZON")) {
      return "SHOPS";
    }
    // Apple Daily Cash (cashback)
    if (n.includes("DAILY CASH ADJUSTMENT")) {
      return "REFUND";
    }
    // Refunds / credits (e.g. Delta... (RETURN), Rushtranslate... (return))
    if (n.includes("(RETURN)")) {
      return "REFUND";
    }
    // Interest (Capital One: Monthly Interest Paid)
    if (n.includes("MONTHLY INTEREST PAID")) {
      return "INTEREST";
    }
    // Bill pay (generic)
    if (n.includes("BILLPAY") || n.includes("ONLINE PAYMENT")) {
      return "PAYMENT";
    }
    // Bank P2P
    if (n.includes("BANK OF AMERICA P2P")) return "TRANSFER";
    return null;
  }
}

