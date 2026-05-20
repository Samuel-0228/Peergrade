import React, { useEffect, useMemo, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  ArrowLeft,
  Users,
  Calendar,
  FileSpreadsheet,
  Loader2,
  Sparkles,
  FileX,
  ChevronRight,
  ListFilter,
  LayoutPanelTop,
  BarChart3,
  Activity,
  Database,
} from 'lucide-react';
import { storageService } from '../services/storageService';
import { supabase } from '../services/supabaseClient';
import { Session } from '../types';
import ChartComponent from './ChartComponent';

type ChartView = 'distribution' | 'comparison' | 'trend';

const isSummaryMissing = (summary?: string) =>
  !summary ||
  summary.includes('No summary available') ||
  summary.includes('not available') ||
  summary.includes('unavailable');

const SessionDashboard: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isDownloading, setIsDownloading] = useState(false);
  const [downloadError, setDownloadError] = useState<string | null>(null);
  const [selectedAnalysisIndex, setSelectedAnalysisIndex] = useState(0);
  const [chartView, setChartView] = useState<ChartView>('distribution');
  const [expandedCards, setExpandedCards] = useState<Record<number, boolean>>({});

  useEffect(() => {
    const fetchSession = async () => {
      if (!id) return;
      setIsLoading(true);
      const data = await storageService.getSessionById(id);
      setSession(data);
      setIsLoading(false);
    };

    fetchSession();
  }, [id]);

  const handleDownload = async () => {
    if (!session || !id) return;
    setDownloadError(null);

    const { data, error } = await supabase.from('sessions').select('csv_url').eq('id', id).single();

    if (error || !data?.csv_url) {
      setDownloadError('Dataset reference not found.');
      return;
    }

    setIsDownloading(true);

    try {
      const { data: fileData, error: storageError } = await supabase.storage.from('csv-archives').download(data.csv_url);

      if (storageError) throw storageError;

      const url = window.URL.createObjectURL(fileData);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `${session.title.replace(/\s+/g, '_')}_data.csv`);
      document.body.appendChild(link);
      link.click();
      link.parentNode?.removeChild(link);
    } catch {
      setDownloadError('Unable to retrieve dataset.');
    } finally {
      setIsDownloading(false);
    }
  };

  const analytics = useMemo(() => {
    if (!session) return null;

    const totalQuestions = session.analyses.length;
    const totalResponseVolume = session.analyses.reduce(
      (sum, analysis) => sum + analysis.data.reduce((innerSum, item) => innerSum + item.value, 0),
      0
    );
    const summarizedCount = session.analyses.filter((analysis) => !isSummaryMissing(analysis.summary)).length;
    const dominantSignals = session.analyses
      .map((analysis) => {
        const top = [...analysis.data].sort((a, b) => Number(b.percentage) - Number(a.percentage))[0];
        return top ? { question: analysis.question, ...top } : null;
      })
      .filter(Boolean)
      .sort((a, b) => Number((b as any).percentage) - Number((a as any).percentage));

    const topSignal = dominantSignals[0] as { question: string; name: string; percentage: string } | undefined;
    const chartMix = session.analyses.reduce(
      (count, analysis) => {
        count[analysis.chartType] = (count[analysis.chartType] || 0) + 1;
        return count;
      },
      {} as Record<string, number>
    );

    return {
      totalQuestions,
      totalResponseVolume,
      summarizedCount,
      topSignal,
      chartMix,
      detailFeed: dominantSignals.slice(0, 4) as Array<{ question: string; name: string; percentage: string }>,
    };
  }, [session]);

  useEffect(() => {
    if (!session) return;
    setSelectedAnalysisIndex(0);
  }, [session]);

  if (isLoading) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center px-6">
        <Loader2 className="mb-4 h-10 w-10 animate-spin text-white" />
        <p className="text-sm font-medium uppercase tracking-[0.22em] text-neutral-400">Loading insight workspace</p>
      </div>
    );
  }

  if (!session || !analytics) {
    return (
      <div className="mx-auto max-w-4xl px-6 py-20 text-center font-sans bg-black">
        <h1 className="mb-4 text-2xl font-bold tracking-tight text-white uppercase">Session not found</h1>
        <p className="mb-8 text-neutral-400">The requested research archive is currently unavailable.</p>
        <Link to="/" className="text-sm font-bold uppercase tracking-widest text-white underline hover:text-neutral-400">
          Back to archives
        </Link>
      </div>
    );
  }

  const selectedAnalysis = session.analyses[selectedAnalysisIndex] ?? session.analyses[0];

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 py-10 lg:px-8 xl:max-w-screen-2xl bg-black font-sans text-white">
      <Link to="/" className="mb-6 inline-flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-neutral-500 transition-colors hover:text-white">
        <ArrowLeft className="h-4 w-4" />
        All research sessions
      </Link>

      <section className="fade-up rounded-none border border-neutral-800 bg-black p-6 lg:p-8">
        <div className="grid grid-cols-12 gap-6">
          <div className="col-span-12 lg:col-span-8">
            <div className="mb-4 inline-flex items-center gap-2 rounded-none border border-neutral-800 bg-neutral-900 px-3 py-1.5 text-[10px] font-bold uppercase tracking-widest text-neutral-400">
              <Sparkles className="h-3.5 w-3.5" />
              Research summary panel
            </div>
            <h1 className="max-w-4xl text-4xl font-bold tracking-tighter text-white md:text-5xl uppercase">
              {session.title}
            </h1>
            <p className="mt-4 max-w-3xl text-base leading-7 text-neutral-400 md:text-lg">{session.description}</p>

            <div className="mt-8 grid grid-cols-1 gap-4 md:grid-cols-3">
              <div className="rounded-none border border-neutral-800 bg-neutral-950 p-4 transition-colors hover:bg-neutral-900">
                <p className="text-[10px] font-semibold uppercase tracking-widest text-neutral-500">Response base</p>
                <p className="mt-2 flex items-end gap-2">
                  <span className="font-mono text-3xl font-bold text-white">{session.responseCount}</span>
                  <span className="pb-1 text-xs font-semibold uppercase tracking-widest text-neutral-500">participants</span>
                </p>
              </div>
              <div className="rounded-none border border-neutral-800 bg-neutral-950 p-4 transition-colors hover:bg-neutral-900">
                <p className="text-[10px] font-semibold uppercase tracking-widest text-neutral-500">Question groups</p>
                <p className="mt-2 flex items-end gap-2">
                  <span className="font-mono text-3xl font-bold text-white">{analytics.totalQuestions}</span>
                  <span className="pb-1 text-xs font-semibold uppercase tracking-widest text-neutral-500">tracked areas</span>
                </p>
              </div>
              <div className="rounded-none border border-neutral-800 bg-neutral-950 p-4 transition-colors hover:bg-neutral-900">
                <p className="text-[10px] font-semibold uppercase tracking-widest text-neutral-500">Narrative coverage</p>
                <p className="mt-2 flex items-end gap-2">
                  <span className="font-mono text-3xl font-bold text-white">{analytics.summarizedCount}</span>
                  <span className="pb-1 text-xs font-semibold uppercase tracking-widest text-neutral-500">with summaries</span>
                </p>
              </div>
            </div>
          </div>

          <div className="col-span-12 lg:col-span-4">
            <div className="flex h-full flex-col justify-between rounded-none border border-neutral-800 bg-neutral-950 p-5">
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-widest text-neutral-500">Primary takeaway</p>
                <p className="mt-3 text-lg leading-7 text-white font-medium">
                  {analytics.topSignal
                    ? `${analytics.topSignal.name} leads the strongest visible preference at ${analytics.topSignal.percentage}% of responses.`
                    : 'This session is ready for review across all recorded question groups.'}
                </p>
                <p className="mt-3 text-sm leading-6 text-neutral-400">
                  {analytics.topSignal?.question ?? 'Use the analysis workspace below to compare distributions and inspect the strongest patterns.'}
                </p>
              </div>
              <div className="mt-6 grid grid-cols-2 gap-3 text-xs text-neutral-400">
                <div className="rounded-none border border-neutral-800 bg-black p-3">
                  <div className="mb-1 flex items-center gap-2 font-semibold uppercase tracking-widest text-neutral-500">
                    <Users className="h-3.5 w-3.5" />
                    Population
                  </div>
                  <span className="font-mono text-sm font-bold text-white">{session.responseCount}</span>
                </div>
                <div className="rounded-none border border-neutral-800 bg-black p-3">
                  <div className="mb-1 flex items-center gap-2 font-semibold uppercase tracking-widest text-neutral-500">
                    <Calendar className="h-3.5 w-3.5" />
                    Published
                  </div>
                  <span className="font-mono text-sm font-bold text-white">
                    {new Date(session.createdAt).toLocaleDateString()}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="mt-6 grid grid-cols-12 gap-6">
        <div className="fade-up col-span-12 lg:col-span-8" style={{ animationDelay: '0.08s' }}>
          <div className="rounded-none border border-neutral-800 bg-black p-6">
            <div className="mb-6 flex flex-col gap-4 border-b border-neutral-800 pb-5 lg:flex-row lg:items-end lg:justify-between">
              <div>
                <div className="mb-2 inline-flex items-center gap-2 text-[10px] font-semibold uppercase tracking-widest text-neutral-500">
                  <LayoutPanelTop className="h-3.5 w-3.5" />
                  Data visualization area
                </div>
                <h2 className="text-2xl font-bold tracking-tight text-white uppercase">{selectedAnalysis.question}</h2>
                <p className="mt-2 text-sm text-neutral-400">
                  Switch views to inspect raw distribution, category comparisons, or a rank-based trend line.
                </p>
              </div>

              <div className="flex flex-wrap gap-2">
                {([
                  ['distribution', 'Distribution'],
                  ['comparison', 'Comparison'],
                  ['trend', 'Trend'],
                ] as const).map(([value, label]) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => setChartView(value)}
                    className={`rounded-none border px-4 py-2 text-xs font-bold uppercase tracking-widest transition-colors duration-300 ${
                      chartView === value
                        ? 'border-white bg-white text-black'
                        : 'border-neutral-800 bg-black text-neutral-400 hover:border-neutral-600 hover:text-white'
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>

            <ChartComponent analysis={selectedAnalysis} variant={chartView} />
          </div>
        </div>

        <div className="fade-up col-span-12 lg:col-span-4" style={{ animationDelay: '0.14s' }}>
          <div className="rounded-none border border-neutral-800 bg-black p-5">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <div className="inline-flex items-center gap-2 text-[10px] font-semibold uppercase tracking-widest text-neutral-500">
                  <ListFilter className="h-3.5 w-3.5" />
                  Question filters
                </div>
                <h2 className="mt-2 text-lg font-bold tracking-tight text-white uppercase">Analysis queue</h2>
              </div>
              <span className="rounded-none border border-neutral-800 bg-neutral-900 px-2.5 py-1 text-[10px] font-bold uppercase tracking-widest text-white">
                {session.analyses.length} items
              </span>
            </div>

            <div className="space-y-3">
              {session.analyses.map((analysis, index) => {
                const topItem = [...analysis.data].sort((a, b) => Number(b.percentage) - Number(a.percentage))[0];
                const isActive = index === selectedAnalysisIndex;

                return (
                  <button
                    key={`${analysis.question}-${index}`}
                    type="button"
                    onClick={() => setSelectedAnalysisIndex(index)}
                    className={`w-full rounded-none border p-4 text-left transition-colors duration-300 ${
                      isActive
                        ? 'border-white bg-neutral-900'
                        : 'border-neutral-800 bg-black hover:border-neutral-600'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-sm font-bold leading-6 text-white uppercase tracking-tight">{analysis.question}</p>
                        <p className="mt-2 text-xs text-neutral-400">
                          {topItem ? `${topItem.name} leads at ${topItem.percentage}%` : 'Awaiting categorized results'}
                        </p>
                      </div>
                      <ChevronRight className={`mt-0.5 h-4 w-4 shrink-0 ${isActive ? 'text-white' : 'text-neutral-600'}`} />
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      <section className="mt-6 grid grid-cols-12 gap-6">
        <div className="fade-up col-span-12 lg:col-span-8" style={{ animationDelay: '0.2s' }}>
          <div className="rounded-none border border-neutral-800 bg-black p-6">
            <div className="mb-5 flex items-center justify-between">
              <div>
                <div className="inline-flex items-center gap-2 text-[10px] font-semibold uppercase tracking-widest text-neutral-500">
                  <BarChart3 className="h-3.5 w-3.5" />
                  Insight cards
                </div>
                <h2 className="mt-2 text-2xl font-bold tracking-tight text-white uppercase">Key findings at a glance</h2>
              </div>
            </div>

            <div className="grid grid-cols-12 gap-4">
              {session.analyses.map((analysis, index) => {
                const topItem = [...analysis.data].sort((a, b) => Number(b.percentage) - Number(a.percentage))[0];

                return (
                  <article
                    key={`${analysis.question}-insight-${index}`}
                    className="fade-up col-span-12 md:col-span-6 rounded-none border border-neutral-800 bg-neutral-950 p-5 transition-colors duration-300 hover:bg-neutral-900"
                    style={{ animationDelay: `${0.24 + index * 0.05}s` }}
                  >
                    <p className="text-[10px] font-semibold uppercase tracking-widest text-neutral-500">Finding {String(index + 1).padStart(2, '0')}</p>
                    <h3 className="mt-3 text-lg font-bold leading-7 text-white uppercase tracking-tight">{analysis.question}</h3>
                    <p className="mt-3 text-sm leading-6 text-neutral-400">
                      {topItem
                        ? `${topItem.name} is the leading response, representing ${topItem.percentage}% of the recorded answers for this question.`
                        : 'No dominant category was detected for this question.'}
                    </p>
                    <div className="mt-4 flex items-center justify-between border-t border-neutral-800 pt-4">
                      <span className="text-xs font-semibold uppercase tracking-widest text-neutral-500">
                        {analysis.data.length} categories
                      </span>
                      <button
                        type="button"
                        onClick={() => setSelectedAnalysisIndex(index)}
                        className="text-xs font-bold uppercase tracking-widest text-white transition-colors hover:text-neutral-400"
                      >
                        Inspect
                      </button>
                    </div>
                  </article>
                );
              })}
            </div>
          </div>
        </div>

        <div className="fade-up col-span-12 lg:col-span-4" style={{ animationDelay: '0.26s' }}>
          <div className="rounded-none border border-neutral-800 bg-black p-5">
            <div className="inline-flex items-center gap-2 text-[10px] font-semibold uppercase tracking-widest text-neutral-500">
              <Activity className="h-3.5 w-3.5" />
              Activity feed
            </div>
            <h2 className="mt-2 text-lg font-bold tracking-tight text-white uppercase">Trend notes</h2>

            <div className="mt-5 space-y-4">
              {analytics.detailFeed.map((item, index) => (
                <div key={`${item.question}-${index}`} className="rounded-none border border-neutral-800 bg-neutral-950 p-4">
                  <div className="mb-2 flex items-center justify-between">
                    <span className="text-[10px] font-semibold uppercase tracking-widest text-neutral-500">Signal {index + 1}</span>
                    <span className="font-mono text-xs font-bold text-white">{item.percentage}%</span>
                  </div>
                  <p className="text-sm font-bold leading-6 text-white uppercase tracking-tight">{item.name}</p>
                  <p className="mt-2 text-xs leading-5 text-neutral-400">{item.question}</p>
                </div>
              ))}

              <div className="rounded-none border border-neutral-800 bg-black p-4">
                <div className="mb-2 flex items-center gap-2 text-neutral-400">
                  <Database className="h-4 w-4 text-white" />
                  <span className="text-xs font-bold uppercase tracking-widest">Session coverage</span>
                </div>
                <p className="text-sm leading-6 text-neutral-300">
                  {analytics.totalResponseVolume} categorized selections were processed across this session, with a chart mix of{' '}
                  {Object.entries(analytics.chartMix)
                    .map(([key, value]) => `${value} ${key.toLowerCase()}`)
                    .join(' and ')}
                  .
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="fade-up mt-6 rounded-none border border-neutral-800 bg-black p-6" style={{ animationDelay: '0.32s' }}>
        <div className="mb-5 flex items-center justify-between">
          <div>
            <div className="inline-flex items-center gap-2 text-[10px] font-semibold uppercase tracking-widest text-neutral-500">
              <LayoutPanelTop className="h-3.5 w-3.5" />
              Detailed analysis
            </div>
            <h2 className="mt-2 text-2xl font-bold tracking-tight text-white uppercase">Expanded findings</h2>
          </div>
        </div>

        <div className="space-y-4">
          {session.analyses.map((analysis, index) => {
            const expanded = expandedCards[index] ?? index === selectedAnalysisIndex;
            const topItems = [...analysis.data]
              .sort((a, b) => Number(b.percentage) - Number(a.percentage))
              .slice(0, 3);
            const summaryUnavailable = isSummaryMissing(analysis.summary);

            return (
              <article key={`${analysis.question}-detail-${index}`} className="rounded-none border border-neutral-800 bg-black">
                <button
                  type="button"
                  onClick={() => setExpandedCards((current) => ({ ...current, [index]: !expanded }))}
                  className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left hover:bg-neutral-900 transition-colors"
                >
                  <div>
                    <p className="text-[10px] font-semibold uppercase tracking-widest text-neutral-500">Analysis {String(index + 1).padStart(2, '0')}</p>
                    <h3 className="mt-2 text-base font-bold text-white uppercase tracking-tight">{analysis.question}</h3>
                  </div>
                  <ChevronRight className={`h-4 w-4 shrink-0 text-neutral-500 transition-transform ${expanded ? 'rotate-90' : ''}`} />
                </button>

                {expanded ? (
                  <div className="grid grid-cols-12 gap-5 border-t border-neutral-800 px-5 py-5 bg-neutral-950">
                    <div className="col-span-12 lg:col-span-7">
                      {summaryUnavailable ? (
                        <div className="flex gap-3 rounded-none border border-neutral-800 bg-black p-4 text-neutral-400">
                          <FileX className="mt-0.5 h-4 w-4 shrink-0 text-neutral-500" />
                          <p className="text-sm leading-6">
                            This question does not yet have an automated narrative summary. Use the leading categories and chart comparison above to interpret the pattern.
                          </p>
                        </div>
                      ) : (
                        <div className="rounded-none border border-neutral-800 bg-black p-4">
                          <p className="text-sm leading-7 text-white">{analysis.summary}</p>
                        </div>
                      )}
                    </div>

                    <div className="col-span-12 lg:col-span-5">
                      <div className="rounded-none border border-neutral-800 bg-black p-4">
                        <p className="text-[10px] font-semibold uppercase tracking-widest text-neutral-500">Top categories</p>
                        <div className="mt-4 space-y-3">
                          {topItems.map((item, itemIndex) => (
                            <div key={`${item.name}-${itemIndex}`} className="flex items-center justify-between gap-4">
                              <div className="min-w-0">
                                <p className="truncate text-sm font-bold text-white uppercase tracking-tight">{item.name}</p>
                                <p className="text-[10px] font-semibold uppercase tracking-widest text-neutral-500">{item.value} responses</p>
                              </div>
                              <span className="font-mono text-sm font-bold text-white">{item.percentage}%</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                ) : null}
              </article>
            );
          })}
        </div>
      </section>

      <footer className="fade-up mt-8 rounded-none border border-neutral-800 bg-black p-6 text-center" style={{ animationDelay: '0.38s' }}>
        <p className="mx-auto max-w-2xl text-sm leading-6 text-neutral-400">
          Raw datasets remain available for authorized institutional research workflows and downstream review.
        </p>

        <div className="mt-5 flex flex-col items-center gap-3">
          <button
            onClick={handleDownload}
            disabled={isDownloading}
            className="inline-flex items-center gap-3 rounded-none border border-neutral-800 bg-black px-6 py-3 text-xs font-bold uppercase tracking-widest text-white transition-colors hover:bg-white hover:text-black disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isDownloading ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileSpreadsheet className="h-4 w-4" />}
            {isDownloading ? 'Preparing export' : 'Export raw dataset'}
          </button>
          {downloadError ? <p className="text-sm font-bold text-white">{downloadError}</p> : null}
        </div>
      </footer>
    </div>
  );
};

export default SessionDashboard;
