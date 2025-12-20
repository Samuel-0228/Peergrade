
import { Session, QuestionAnalysis } from '../types';
import { supabase } from './supabaseClient';

export const storageService = {
  getSessions: async (onlyPublic = false): Promise<Session[]> => {
    let query = supabase
      .from('sessions')
      .select('*, question_analysis(*)');
    
    if (onlyPublic) {
      query = query.eq('is_public', true);
    }

    const { data, error } = await query.order('created_at', { ascending: false });
    
    if (error) {
      console.error('Error fetching sessions:', error);
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
  },

  getPublicSessions: async (): Promise<Session[]> => {
    return storageService.getSessions(true);
  },

  getSessionById: async (id: string): Promise<Session | null> => {
    const { data, error } = await supabase
      .from('sessions')
      .select('*, question_analysis(*)')
      .eq('id', id)
      .single();

    if (error || !data) {
      console.error('Error fetching session:', error);
      return null;
    }

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
  },

  saveSession: async (session: Session, file?: File): Promise<boolean> => {
    // 1. Upload CSV to storage if provided
    let csvUrl = '';
    if (file) {
      const fileName = `${session.id}-${file.name}`;
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('csv-archives')
        .upload(fileName, file);
      
      if (!uploadError) {
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
      console.error('Session Insert Error:', sessionError);
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
      console.error('Analysis Insert Error:', analysisError);
      return false;
    }

    return true;
  },

  deleteSession: async (id: string): Promise<void> => {
    await supabase.from('sessions').delete().eq('id', id);
  },

  togglePublicStatus: async (id: string, currentStatus: boolean): Promise<void> => {
    await supabase
      .from('sessions')
      .update({ is_public: !currentStatus })
      .eq('id', id);
  }
};
