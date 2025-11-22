import { createClient } from '@supabase/supabase-js';

// ------------------------------------------------------------------
// CONFIGURATION DE LA CONNEXION SUPABASE
// ------------------------------------------------------------------

// Fonction utilitaire pour lire les variables d'environnement (compatible Vite, Next.js, CRA)
const getEnv = (key: string) => {
  // Vite
  if (typeof import.meta !== 'undefined' && (import.meta as any).env?.[key]) {
    return (import.meta as any).env[key];
  }
  // Next.js / CRA / Node
  if (typeof process !== 'undefined' && process.env?.[key]) {
    return process.env[key];
  }
  return null;
};

// Configuration avec Fallback sur les valeurs fournies par l'utilisateur
// Priorité : VITE_ > NEXT_PUBLIC_ > REACT_APP_ > Valeurs en dur
const supabaseUrl = 
  getEnv('VITE_SUPABASE_URL') || 
  getEnv('NEXT_PUBLIC_SUPABASE_URL') || 
  getEnv('REACT_APP_SUPABASE_URL') || 
  'https://nmettlzbnqzfwpozepen.supabase.co';

const supabaseAnonKey = 
  getEnv('VITE_SUPABASE_ANON_KEY') || 
  getEnv('NEXT_PUBLIC_SUPABASE_ANON_KEY') || 
  getEnv('REACT_APP_SUPABASE_ANON_KEY') || 
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5tZXR0bHpibnF6Zndwb3plcGVuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjM2NzMwNDcsImV4cCI6MjA3OTI0OTA0N30.BhzSrsmmDjGSprDNK0yTlGPONXD7mBv_FEliMEfmWto';

// Si les clés sont vides, le client ne fonctionnera pas correctement
if (!supabaseUrl || !supabaseAnonKey) {
  console.warn("⚠️ ATTENTION : Clés Supabase non détectées.");
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

/**
 * Fonction utilitaire pour exécuter des requêtes Supabase avec une gestion d'erreur standardisée.
 */
export const safeSupabaseQuery = async <T>(
  promise: Promise<{ data: T | null; error: any }>
): Promise<{ data: T | null; error: string | null }> => {
  try {
    if (!supabaseUrl) {
      return { data: null, error: "Mode démo : Pas de base de données connectée" };
    }

    const { data, error } = await promise;
    
    if (error) {
      console.error('Erreur Supabase détectée:', error);
      return { 
        data, 
        error: "Une erreur de connexion est survenue. Veuillez vérifier votre connexion internet." 
      };
    }
    
    return { data, error: null };
  } catch (err) {
    console.error('Erreur inattendue:', err);
    return { data: null, error: "Une erreur inattendue s'est produite." };
  }
};