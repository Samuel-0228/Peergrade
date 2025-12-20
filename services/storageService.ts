
import { Session, QuestionAnalysis } from '../types';
import { supabase } from './supabaseClient';

const handleSupabaseError = (context: string, error: any) => {
  if (error?.message === 'Failed to fetch') {
    console.error(`${context}: Network connection blocked. Please check if an adblocker or firewall is blocking 'supabase.co'.`);
  } else if (error?.message?.includes('Bucket not found')) {
    console.error(`${context}: The 'csv-archives' bucket does not exist. Please create it in your Supabase Storage dashboard.`);
  } else if (error?.message?.includes('violates row-level security policy')) {
    console.error(`${context}: RLS Policy violation. Ensure you have added INSERT/SELECT policies for 'anon' or 'authenticated' roles on the bucket/table.`);
  } else {
    console.error(`${context}:`, error?.message || error);
  }
};

export const storageService = {
  getSessions: async (onlyPublic = false): Promise<Session[]> => {
    try {
      let query = supabase
        .from('sessions')
        .select(`
          *,
          question_analysis (
            id,
            question,
            chart_type,
            data,
            summary
          )
        `);
      
      if (onlyPublic) {
        query = query.eq('is_public', true);
      }

      const { data, error } = await query.order('created_at', { ascending: false });
      
      if (error) {
        handleSupabaseError('Fetch Sessions', error);
        return [];
      }

      return (data || []).map(s => ({
        ...s,
        createdAt: s.created_at,
        responseCount: s.response_count,
        isPublic: s.is_public,
        analyses: (s.question_analysis || []).map((a: any) => ({
          ...a,
          chartType: a.chart_type
        }))
      }));
    } catch (err: any) {
      handleSupabaseError('Unexpected Fetch Error', err);
      return [];
    }
  },

  getPublicSessions: async (): Promise<Session[]> => {
    return storageService.getSessions(true);
  },

  getSessionById: async (id: string): Promise<Session | null> => {
    try {
      const { data, error } = await supabase
        .from('sessions')
        .select(`
          *,
          question_analysis (
            id,
            question,
            chart_type,
            data,
            summary
          )
        `)
        .eq('id', id)
        .single();

      if (error) {
        handleSupabaseError('Fetch Session by ID', error);
        return null;
      }

      if (!data) return null;

      return {
        ...data,
        createdAt: data.created_at,
        responseCount: data.response_count,
        isPublic: data.is_public,
        analyses: (data.question_analysis || []).map((a: any) => ({
          ...a,
          chartType: a.chart_type
        }))
      };
    } catch (err: any) {
      handleSupabaseError('Unexpected Session Fetch Error', err);
      return null;
    }
  },

  saveSession: async (session: Session, file?: File): Promise<{ success: boolean; error?: string }> => {
    try {
      let csvUrl = '';
      if (file) {
        const fileName = `${session.id}-${file.name.replace(/[^a-zA-Z0-9._-]/g, '_')}`;
        const { error: uploadError } = await supabase.storage
          .from('csv-archives')
          .upload(fileName, file, {
            cacheControl: '3600',
            upsert: true
          });
        
        if (uploadError) {
          if (uploadError.message.includes('Bucket not found')) {
            return { 
              success: false, 
              error: "Storage Configuration Required: The bucket 'csv-archives' was not found. Please create a 'Public' bucket named 'csv-archives' in your Supabase Storage dashboard." 
            };
          }
          if (uploadError.message.includes('row-level security policy')) {
            return {
              success: false,
              error: "Security Policy Error: The 'csv-archives' bucket has RLS enabled but no upload policy for 'anon' users. Please add an 'INSERT' policy in the Supabase Storage dashboard."
            };
          }
          return { success: false, error: `Storage Error: ${uploadError.message}` };
        }
        csvUrl = fileName;
      }

      const { error: sessionError } = await supabase
        .from('sessions')
        .upsert({
          id: session.id,
          title: session.title,
          description: session.description,
          response_count: session.responseCount,
          is_public: session.isPublic,
          csv_url: csvUrl,
          created_at: session.createdAt
        });

      if (sessionError) {
        if (sessionError.message.includes('row-level security policy')) {
          return {
            success: false,
            error: "Database Policy Error: The 'sessions' table has RLS enabled but no insert policy for 'anon' users. Please enable 'INSERT' for the 'anon' role."
          };
        }
        return { success: false, error: `Database Error (Session): ${sessionError.message}` };
      }

      const analysesToInsert = session.analyses.map(a => ({
        session_id: session.id,
        question: a.question,
        chart_type: a.chartType,
        data: a.data,
        summary: a.summary
      }));

      const { error: analysisError } = await supabase
        .from('question_analysis')
        .insert(analysesToInsert);

      if (analysisError) {
        return { success: false, error: `Database Error (Analysis): ${analysisError.message}` };
      }

      return { success: true };
    } catch (err: any) {
      if (err.message === 'Failed to fetch') {
        return { success: false, error: "Network blocked: Could not reach Supabase API. Check for Adblockers." };
      }
      return { success: false, error: err.message };
    }
  },

  deleteSession: async (id: string): Promise<void> => {
    const { error } = await supabase.from('sessions').delete().eq('id', id);
    if (error) handleSupabaseError('Delete Session', error);
  },

  togglePublicStatus: async (id: string, currentStatus: boolean): Promise<void> => {
    const { error } = await supabase
      .from('sessions')
      .update({ is_public: !currentStatus })
      .eq('id', id);
    if (error) handleSupabaseError('Toggle Public Status', error);
  }
};
