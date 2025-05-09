import { createClient } from '@supabase/supabase-js';
import { Database } from '@/types/supabase';

if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
  throw new Error('Manca la variabile d\'ambiente NEXT_PUBLIC_SUPABASE_URL');
}

if (!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
  throw new Error('Manca la variabile d\'ambiente NEXT_PUBLIC_SUPABASE_ANON_KEY');
}

/**
 * Crea un client Supabase con le credenziali dell'ambiente
 * Questo client può essere utilizzato in componenti client e server
 */
export const supabase = createClient<Database>(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

/**
 * Funzione helper per ottenere un client Supabase con il contesto utente corrente
 * Utile per operazioni autenticate
 */
export const getSupabaseClient = async () => {
  return supabase;
};

/**
 * Funzione helper per caricare un file su Supabase Storage
 * @param bucket Nome del bucket di storage
 * @param path Percorso del file nel bucket
 * @param file File da caricare
 */
export const uploadFile = async (bucket: string, path: string, file: File) => {
  const { data, error } = await supabase.storage.from(bucket).upload(path, file, {
    upsert: true,
  });

  if (error) {
    throw error;
  }

  return data;
};

/**
 * Funzione helper per ottenere un URL pubblico per un file su Supabase Storage
 * @param bucket Nome del bucket di storage
 * @param path Percorso del file nel bucket
 */
export const getPublicUrl = (bucket: string, path: string) => {
  const { data } = supabase.storage.from(bucket).getPublicUrl(path);
  return data.publicUrl;
};