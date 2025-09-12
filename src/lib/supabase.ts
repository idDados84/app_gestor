import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

let supabase;

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('Missing Supabase environment variables. Please connect to Supabase first.');
  // Create a mock client that prevents actual network requests
  supabase = {
    auth: {
      signUp: async () => ({ data: null, error: { message: 'Please connect to Supabase first' } }),
      signInWithPassword: async () => ({ data: null, error: { message: 'Please connect to Supabase first' } }),
      signOut: async () => ({ error: { message: 'Please connect to Supabase first' } }),
      getUser: async () => ({ data: { user: null }, error: { message: 'Please connect to Supabase first' } })
    },
    from: () => ({
      select: () => ({ data: [], error: null }),
      insert: () => ({ data: null, error: { message: 'Please connect to Supabase first' } }),
      update: () => ({ data: null, error: { message: 'Please connect to Supabase first' } }),
      delete: () => ({ error: { message: 'Please connect to Supabase first' } }),
      eq: function() { return this; },
      single: function() { return this; }
    })
  };
} else {
  supabase = createClient(supabaseUrl, supabaseAnonKey);
}

export { supabase };

// Auth helper functions
export const signUp = async (email: string, password: string) => {
  if (!import.meta.env.VITE_SUPABASE_URL || !import.meta.env.VITE_SUPABASE_ANON_KEY) {
    return { 
      data: null, 
      error: { message: 'Please connect to Supabase first by clicking the "Connect to Supabase" button' } 
    };
  }
  
  try {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: undefined // Disable email confirmation
      }
    });
    return { data, error };
  } catch (error) {
    return { 
      data: null, 
      error: { message: 'Please connect to Supabase first by clicking the "Connect to Supabase" button' } 
    };
  }
};

export const signIn = async (email: string, password: string) => {
  if (!import.meta.env.VITE_SUPABASE_URL || !import.meta.env.VITE_SUPABASE_ANON_KEY) {
    return { 
      data: null, 
      error: { message: 'Please connect to Supabase first by clicking the "Connect to Supabase" button' } 
    };
  }
  
  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    return { data, error };
  } catch (error) {
    return { 
      data: null, 
      error: { message: 'Please connect to Supabase first by clicking the "Connect to Supabase" button' } 
    };
  }
};

export const signOut = async () => {
  if (!import.meta.env.VITE_SUPABASE_URL || !import.meta.env.VITE_SUPABASE_ANON_KEY) {
    return { error: { message: 'Please connect to Supabase first' } };
  }
  
  try {
    const { error } = await supabase.auth.signOut();
    return { error };
  } catch (error) {
    return { error: { message: 'Please connect to Supabase first' } };
  }
};

export const getCurrentUser = async () => {
  if (!import.meta.env.VITE_SUPABASE_URL || !import.meta.env.VITE_SUPABASE_ANON_KEY) {
    return null;
  }
  
  try {
    const { data: { user } } = await supabase.auth.getUser();
    return user;
  } catch (error) {
    return null;
  }
};