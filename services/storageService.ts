
import { Session, QuestionAnalysis } from '../types';
import { supabase } from './supabaseClient';

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
        console.error('Supabase Error (Fetch Sessions):', error.message, '| Hint:', error.hint, '| Details:', error.details);
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
      console.error('Unexpected Error in getSessions:', err.message);
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
        console.error('Supabase Error (Fetch Session by ID):', error.message, '| Hint:', error.hint);
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
      console.error('Unexpected Error in getSessionById:', err.message);
      return null;
    }
  },

  saveSession: async (session: Session, file?: File): Promise<boolean> => {
    try {
      // 1. Upload CSV to storage if provided
      let csvUrl = '';
      if (file) {
        const fileName = `${session.id}-${file.name.replace(/[^a-zA-Z0-9._-]/g, '_')}`;
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('csv-archives')
          .upload(fileName, file);
        
        if (uploadError) {
          console.error('Storage Upload Error:', uploadError.message);
        } else {
          csvUrl = fileName;
        }
      }

      // 2. Insert Session
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
        console.error('Session Upsert Error:', sessionError.message, sessionError.details);
        return false;
      }

      // 3. Insert Analyses
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
        console.error('Analysis Insert Error:', analysisError.message);
        return false;
      }

      return true;
    } catch (err: any) {
      console.error('Unexpected Error in saveSession:', err.message);
      return false;
    }
  },

  deleteSession: async (id: string): Promise<void> => {
    const { error } = await supabase.from('sessions').delete().eq('id', id);
    if (error) console.error('Delete Session Error:', error.message);
  },

  togglePublicStatus: async (id: string, currentStatus: boolean): Promise<void> => {
    const { error } = await supabase
      .from('sessions')
      .update({ is_public: !currentStatus })
      .eq('id', id);
    if (error) console.error('Toggle Public Status Error:', error.message);
  }
};
