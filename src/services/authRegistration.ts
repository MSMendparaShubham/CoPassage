import { supabase } from '../supabase';
import { auth } from '../firebase';
import { updateProfile } from 'firebase/auth';

export interface TestAccount {
  phone: string;
  displayPhone: string;
  otp: string;
  name: string;
  role: string;
  tag: string;
  avatar: string;
  email?: string;
  subscription_tier: 'free' | 'plus' | 'unlimited';
  wallet_balance: number;
}

export const FIREBASE_TEST_ACCOUNTS: TestAccount[] = [
  {
    phone: '9875101054',
    displayPhone: '+91 98751 01054',
    otp: '000001',
    name: 'Shubham Mendpara',
    role: 'Rider Host (Has an Auto)',
    tag: '🛺 Pro Commuter (Unlimited)',
    avatar: 'SM',
    email: 'shubham.mendpara@copassage.in',
    subscription_tier: 'unlimited', // Pro Subscription
    wallet_balance: 0,
  },
  {
    phone: '8849350719',
    displayPhone: '+91 88493 50719',
    otp: '404040',
    name: 'Nisarg Makwana',
    role: 'Commuter Seeker (Needs Auto)',
    tag: '⭐ Plus Seeker',
    avatar: 'NM',
    email: 'nisarg.makwana@copassage.in',
    subscription_tier: 'plus', // Plus Subscription
    wallet_balance: 0,
  },
  {
    phone: '9824597605',
    displayPhone: '+91 98245 97605',
    otp: '123456',
    name: 'Priya Sharma',
    role: 'Safe Share Female Commuter',
    tag: '🛡️ Plus & ₹1 Lakh Vault',
    avatar: 'PS',
    email: 'priya.sharma@copassage.in',
    subscription_tier: 'plus', // Plus Subscription
    wallet_balance: 100000, // 1 Lakh in wallet
  },
  {
    phone: '9974144230',
    displayPhone: '+91 99741 44230',
    otp: '979797',
    name: 'Rohan Patel',
    role: 'Daily Corridor Commuter',
    tag: '💰 ₹1 Lakh Vault Rider',
    avatar: 'RP',
    email: 'rohan.patel@copassage.in',
    subscription_tier: 'free', // Standard / Normal tier
    wallet_balance: 100000, // 1 Lakh in wallet
  },
  {
    phone: '7572867636',
    displayPhone: '+91 75728 67636',
    otp: '101010',
    name: 'Ananya Kotadiya',
    role: 'Verified Campus Commuter',
    tag: '🎓 Standard Commuter (Free)',
    avatar: 'AK',
    email: 'ananya.kotadiya@copassage.in',
    subscription_tier: 'free', // Normal user
    wallet_balance: 0,
  },
];

export interface RegisteredProfile {
  uid: string;
  phone: string; // Clean 10-digit number
  fullName: string;
  role: string;
  email?: string;
  registeredAt?: string;
  subscription_tier?: 'free' | 'plus' | 'unlimited';
  wallet_balance?: number;
}

export interface RegisteredUserResult {
  isRegistered: boolean;
  user?: RegisteredProfile;
}

export interface EmailCheckResult {
  isRegistered: boolean;
  registeredUser?: RegisteredProfile;
}

const STORAGE_KEY = 'copassage_registered_users';

/**
 * Normalizes any phone string to the last 10 digits.
 */
export const normalizePhone = (rawPhone: string): string => {
  return rawPhone.replace(/\D/g, '').slice(-10);
};

/**
 * Loads registered users from localStorage.
 */
export const getLocalRegisteredUsers = (): RegisteredProfile[] => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
};

/**
 * Saves a registered profile to localStorage cache.
 */
export const saveLocalRegisteredUser = (profile: RegisteredProfile): void => {
  try {
    const current = getLocalRegisteredUsers();
    const cleanPhone = normalizePhone(profile.phone);
    const existing = current.find((u) => normalizePhone(u.phone) === cleanPhone);
    const filtered = current.filter((u) => normalizePhone(u.phone) !== cleanPhone);
    const updatedProfile: RegisteredProfile = {
      ...existing,
      ...profile,
      phone: cleanPhone,
      email: profile.email ? profile.email.trim().toLowerCase() : existing?.email,
      subscription_tier: profile.subscription_tier || existing?.subscription_tier,
      wallet_balance: profile.wallet_balance !== undefined ? profile.wallet_balance : existing?.wallet_balance,
      registeredAt: profile.registeredAt || existing?.registeredAt || new Date().toISOString(),
    };
    filtered.push(updatedProfile);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));

    // Also cache individual user profile for persistence in ProfileView
    if (profile.uid) {
      const existingProfileRaw = localStorage.getItem(`copassage_profile_${profile.uid}`);
      let existingProfile = {};
      try {
        if (existingProfileRaw) existingProfile = JSON.parse(existingProfileRaw);
      } catch {
        // ignore
      }

      localStorage.setItem(
        `copassage_profile_${profile.uid}`,
        JSON.stringify({
          ...existingProfile,
          uid: profile.uid,
          name: profile.fullName,
          phone: `+91 ${cleanPhone}`,
          role: profile.role || 'rider',
          email: profile.email ? profile.email.trim().toLowerCase() : '',
          subscription_tier: updatedProfile.subscription_tier,
        })
      );
    }
  } catch (err) {
    console.warn('Could not save user locally:', err);
  }
};

/**
 * Seeds and initializes state for a test account across localStorage keys:
 * - copassage_profile_${uid}
 * - copassage_vault_balance_${uid}
 * - copassage_vault_txs_${uid}
 * Also attempts best-effort sync to Supabase.
 */
export const initializeTestAccountState = (phone: string, customUid?: string): void => {
  const cleanPhone = normalizePhone(phone);
  const account = FIREBASE_TEST_ACCOUNTS.find((a) => normalizePhone(a.phone) === cleanPhone);
  if (!account) return;

  const uids = [
    `firebase_test_${cleanPhone}`,
    `rider_${cleanPhone}`,
  ];
  if (customUid && !uids.includes(customUid)) {
    uids.push(customUid);
  }

  uids.forEach((uid) => {
    // 1. Profile metadata
    try {
      const existingProfileRaw = localStorage.getItem(`copassage_profile_${uid}`);
      let existingProfile = {};
      try {
        if (existingProfileRaw) existingProfile = JSON.parse(existingProfileRaw);
      } catch {
        // ignore
      }

      localStorage.setItem(
        `copassage_profile_${uid}`,
        JSON.stringify({
          ...existingProfile,
          uid,
          name: account.name,
          phone: account.displayPhone,
          role: 'rider',
          email: account.email || '',
          subscription_tier: account.subscription_tier,
        })
      );
    } catch {
      // ignore
    }

    // 2. Vault balance
    try {
      localStorage.setItem(`copassage_vault_balance_${uid}`, String(account.wallet_balance));
    } catch {
      // ignore
    }

    // 3. Vault transactions ledger
    try {
      if (account.wallet_balance > 0) {
        const existingTxStr = localStorage.getItem(`copassage_vault_txs_${uid}`);
        let txs = [];
        try {
          txs = existingTxStr ? JSON.parse(existingTxStr) : [];
        } catch {
          txs = [];
        }
        if (!Array.isArray(txs) || txs.length === 0) {
          localStorage.setItem(
            `copassage_vault_txs_${uid}`,
            JSON.stringify([
              {
                id: `vault_seed_${uid}`,
                rider_uid: uid,
                amount: account.wallet_balance,
                type: 'topup',
                balance_after: account.wallet_balance,
                created_at: new Date().toISOString(),
              },
            ])
          );
        }
      }
    } catch {
      // ignore
    }
  });

  // Also ensure local registered user list has this account
  try {
    saveLocalRegisteredUser({
      uid: `firebase_test_${cleanPhone}`,
      phone: cleanPhone,
      fullName: account.name,
      role: 'rider',
      email: account.email,
      subscription_tier: account.subscription_tier,
      wallet_balance: account.wallet_balance,
    });
  } catch {
    // ignore
  }

  // Attempt async background sync to Supabase (best-effort)
  try {
    const primaryUid = customUid || `firebase_test_${cleanPhone}`;
    Promise.resolve(
      supabase
        .from('profiles')
        .upsert({
          id: primaryUid,
          phone: cleanPhone,
          full_name: account.name,
          role: 'rider',
          subscription_tier: account.subscription_tier,
        })
    ).catch(() => {});

    Promise.resolve(
      supabase
        .from('rider_wallets')
        .upsert({
          rider_uid: primaryUid,
          balance: account.wallet_balance,
        })
    ).catch(() => {});
  } catch {
    // ignore
  }
};

/**
 * Seeds all test accounts into localStorage on app init.
 */
export const seedAllTestAccounts = (): void => {
  FIREBASE_TEST_ACCOUNTS.forEach((account) => {
    initializeTestAccountState(account.phone);
  });
};

// Seed automatically on module load in browser environment
if (typeof window !== 'undefined' && typeof localStorage !== 'undefined') {
  try {
    seedAllTestAccounts();
  } catch {
    // ignore
  }
}

/**
 * Checks whether a given phone number is registered in CoPassage:
 * 1. Checks pre-configured test commuter accounts.
 * 2. Checks localStorage registered users.
 * 3. Queries Supabase `profiles` table.
 */
export const checkUserRegistration = async (rawPhone: string): Promise<RegisteredUserResult> => {
  const cleanPhone = normalizePhone(rawPhone);
  if (cleanPhone.length !== 10) {
    return { isRegistered: false };
  }

  // 1. Check pre-configured test accounts
  const matchedTest = FIREBASE_TEST_ACCOUNTS.find(
    (acc) => normalizePhone(acc.phone) === cleanPhone
  );
  if (matchedTest) {
    initializeTestAccountState(matchedTest.phone);
    return {
      isRegistered: true,
      user: {
        uid: `firebase_test_${matchedTest.phone}`,
        phone: matchedTest.phone,
        fullName: matchedTest.name,
        email: matchedTest.email,
        role: 'rider',
        subscription_tier: matchedTest.subscription_tier,
        wallet_balance: matchedTest.wallet_balance,
      },
    };
  }

  // 2. Check local storage cache
  const localUsers = getLocalRegisteredUsers();
  const localMatch = localUsers.find((u) => normalizePhone(u.phone) === cleanPhone);
  if (localMatch) {
    return {
      isRegistered: true,
      user: localMatch,
    };
  }

  // 3. Query Supabase profiles table (with 2500ms safety timeout)
  try {
    const timeoutPromise = new Promise<{ data: null }>((resolve) =>
      setTimeout(() => resolve({ data: null }), 2500)
    );

    const queryPromise = supabase
      .from('profiles')
      .select('id, phone, full_name, role, email')
      .or(`phone.eq.${cleanPhone},phone.eq.+91${cleanPhone},phone.eq.91${cleanPhone}`)
      .limit(1);

    const res = await Promise.race([queryPromise, timeoutPromise]);
    const data = (res as any)?.data;

    if (data && data.length > 0) {
      const row = data[0];
      const registeredUser: RegisteredProfile = {
        uid: row.id,
        phone: cleanPhone,
        fullName: row.full_name || 'CoPassage Rider',
        role: row.role || 'rider',
        email: row.email,
      };
      // Cache locally for next instant check
      saveLocalRegisteredUser(registeredUser);
      return {
        isRegistered: true,
        user: registeredUser,
      };
    }
  } catch (err) {
    // If column email doesn't exist, try querying without email
    try {
      const fallbackPromise = supabase
        .from('profiles')
        .select('id, phone, full_name, role')
        .or(`phone.eq.${cleanPhone},phone.eq.+91${cleanPhone},phone.eq.91${cleanPhone}`)
        .limit(1);
      const resFallback = await fallbackPromise;
      if (resFallback.data && resFallback.data.length > 0) {
        const row = resFallback.data[0];
        const registeredUser: RegisteredProfile = {
          uid: row.id,
          phone: cleanPhone,
          fullName: row.full_name || 'CoPassage Rider',
          role: row.role || 'rider',
        };
        saveLocalRegisteredUser(registeredUser);
        return { isRegistered: true, user: registeredUser };
      }
    } catch {
      // ignore
    }
  }

  return { isRegistered: false };
};

/**
 * Checks whether an email address is already registered in CoPassage:
 * Strictly enforces "one mail one time" (1 email per account).
 */
export const checkEmailRegistration = async (
  rawEmail: string,
  excludePhone?: string
): Promise<EmailCheckResult> => {
  const cleanEmail = rawEmail.trim().toLowerCase();
  if (!cleanEmail || !cleanEmail.includes('@')) {
    return { isRegistered: false };
  }

  const cleanExclude = excludePhone ? normalizePhone(excludePhone) : undefined;

  // 1. Check pre-configured test accounts
  const matchedTest = FIREBASE_TEST_ACCOUNTS.find(
    (acc) =>
      acc.email?.toLowerCase() === cleanEmail &&
      (!cleanExclude || normalizePhone(acc.phone) !== cleanExclude)
  );
  if (matchedTest) {
    return {
      isRegistered: true,
      registeredUser: {
        uid: `firebase_test_${matchedTest.phone}`,
        phone: matchedTest.phone,
        fullName: matchedTest.name,
        email: matchedTest.email,
        role: 'rider',
      },
    };
  }

  // 2. Check local storage cache
  const localUsers = getLocalRegisteredUsers();
  const matchedLocal = localUsers.find(
    (u) =>
      u.email &&
      u.email.toLowerCase() === cleanEmail &&
      (!cleanExclude || normalizePhone(u.phone) !== cleanExclude)
  );
  if (matchedLocal) {
    return {
      isRegistered: true,
      registeredUser: matchedLocal,
    };
  }

  // 3. Query Supabase profiles table (with 2500ms safety timeout)
  try {
    const timeoutPromise = new Promise<{ data: null }>((resolve) =>
      setTimeout(() => resolve({ data: null }), 2500)
    );

    const queryPromise = supabase
      .from('profiles')
      .select('id, phone, full_name, role, email')
      .ilike('email', cleanEmail)
      .limit(1);

    const res = await Promise.race([queryPromise, timeoutPromise]);
    const data = (res as any)?.data;

    if (data && data.length > 0) {
      const row = data[0];
      if (!cleanExclude || normalizePhone(row.phone || '') !== cleanExclude) {
        return {
          isRegistered: true,
          registeredUser: {
            uid: row.id,
            phone: row.phone || '',
            fullName: row.full_name || 'CoPassage Rider',
            role: row.role || 'rider',
            email: row.email,
          },
        };
      }
    }
  } catch (err) {
    // If email column doesn't exist yet in Supabase, fallback to local storage check
  }

  return { isRegistered: false };
};

/**
 * Registers a newly verified user:
 * - Stores in localStorage `copassage_registered_users` and profile cache
 * - Upserts to Supabase `profiles` table
 * - Updates Firebase displayName if currentUser is active
 */
export const registerNewUser = async (data: {
  uid: string;
  phone: string;
  fullName: string;
  email?: string;
  role?: string;
}): Promise<RegisteredProfile> => {
  const cleanPhone = normalizePhone(data.phone);
  const cleanEmail = data.email?.trim().toLowerCase() || undefined;

  const profile: RegisteredProfile = {
    uid: data.uid,
    phone: cleanPhone,
    fullName: data.fullName.trim(),
    role: data.role || 'rider',
    email: cleanEmail,
    registeredAt: new Date().toISOString(),
  };

  // 1. Save to local storage cache immediately
  saveLocalRegisteredUser(profile);

  // 2. Persist to Supabase profiles table
  try {
    const payload: Record<string, any> = {
      id: profile.uid,
      phone: cleanPhone,
      full_name: profile.fullName,
      role: profile.role,
    };
    if (cleanEmail) {
      payload.email = cleanEmail;
    }
    const res = await supabase.from('profiles').upsert(payload);
    // If upsert failed due to unknown email column, retry without email
    if (res.error && res.error.message?.includes('email')) {
      delete payload.email;
      await supabase.from('profiles').upsert(payload);
    }
  } catch (err) {
    console.warn('Supabase profile upsert warning on registration:', err);
  }

  // 3. Update Firebase Auth displayName
  try {
    if (auth?.currentUser) {
      await updateProfile(auth.currentUser, {
        displayName: profile.fullName,
      });
    }
  } catch (err) {
    console.warn('Firebase updateProfile warning on registration:', err);
  }

  return profile;
};
