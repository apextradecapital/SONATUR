
import { createClient } from '@supabase/supabase-js';

// ------------------------------------------------------------------
// CONFIGURATION DE LA CONNEXION SUPABASE
// ------------------------------------------------------------------

// Fonction utilitaire pour lire les variables d'environnement
const getEnv = (key: string) => {
  if (typeof import.meta !== 'undefined' && (import.meta as any).env?.[key]) {
    return (import.meta as any).env[key];
  }
  if (typeof process !== 'undefined' && process.env?.[key]) {
    return process.env[key];
  }
  return null;
};

// ------------------------------------------------------------------
// ⚠️ ÉTAPE CRUCIALE : REMPLACEZ CES VALEURS PAR LES VÔTRES ⚠️
// ------------------------------------------------------------------
// Allez dans Supabase > Settings > API pour trouver ces infos.

// 1. L'URL de votre projet (Project URL)
const YOUR_SUPABASE_URL = "https://nxzevhczynlsvuqnanas.supabase.co"; 

// 2. La clé publique (anon public key)
const YOUR_SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im54emV2aGN6eW5sc3Z1cW5hbmFzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjM4MzAyNzEsImV4cCI6MjA3OTQwNjI3MX0.I-ueBLjpHlumY1NZralh3js60C8hPzATzxGEPfMSoKE";

// ------------------------------------------------------------------

const supabaseUrl = 
  getEnv('VITE_SUPABASE_URL') || 
  YOUR_SUPABASE_URL;

const supabaseAnonKey = 
  getEnv('VITE_SUPABASE_ANON_KEY') || 
  YOUR_SUPABASE_ANON_KEY;

// Vérification console pour aider au débogage
if (!supabaseUrl || !supabaseAnonKey) {
  console.log("ℹ️ INFO : Clés Supabase manquantes. Vérifiez lib/supabaseClient.ts");
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

/**
 * Fonction utilitaire pour exécuter des requêtes Supabase avec une gestion d'erreur standardisée.
 */
export const safeSupabaseQuery = async <T>(
  promise: Promise<{ data: T | null; error: any }>
): Promise<{ data: T | null; error: string | null }> => {
  try {
    const { data, error } = await promise;
    
    if (error) {
      console.error('Erreur Supabase détectée:', error);
      return { 
        data, 
        error: "Impossible de communiquer avec le serveur. Vérifiez votre connexion internet." 
      };
    }
    
    return { data, error: null };
  } catch (err) {
    console.error('Erreur inattendue:', err);
    return { data: null, error: "Une erreur inattendue s'est produite." };
  }
};
