import { useParams } from 'react-router-dom';
import { useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useAnalysisStatus } from '../hooks/useAnalysisStatus';
import { useDiffSocket } from '../hooks/useDiffSocket';
import { getReview } from '../lib/reviewApi';
import ReactDiffViewer from 'react-diff-viewer-continued';
import type { ReactElement } from 'react';

interface ParsedDiff {
  oldValue: string;
  newValue: string;
}

function parseUnifiedDiff(diff: string): ParsedDiff {
  const oldLines: string[] = [];
  const newLines: string[] = [];
  let inHunk = false;
  let oldLineNumber = 0;
  let newLineNumber = 0;

  for (const line of diff.split(/\r?\n/)) {
    const hunk = line.match(/^@@ -(\d+)(?:,\d+)? \+(\d+)(?:,\d+)? @@/);
    if (hunk) {
      inHunk = true;
      oldLineNumber = Number(hunk[1]);
      newLineNumber = Number(hunk[2]);
      while (oldLines.length < oldLineNumber - 1) oldLines.push('');
      while (newLines.length < newLineNumber - 1) newLines.push('');
      continue;
    }
    if (!inHunk || line.startsWith('\\')) continue;

    if (line.startsWith('+')) {
      newLines[newLineNumber - 1] = line.slice(1);
      newLineNumber += 1;
    } else if (line.startsWith('-')) {
      oldLines[oldLineNumber - 1] = line.slice(1);
      oldLineNumber += 1;
    }
    else if (line.startsWith(' ')) {
      const value = line.slice(1);
      oldLines[oldLineNumber - 1] = value;
      newLines[newLineNumber - 1] = value;
      oldLineNumber += 1;
      newLineNumber += 1;
    }
  }

  if (!inHunk) return { oldValue: '', newValue: diff };
  return { oldValue: oldLines.join('\n'), newValue: newLines.join('\n') };
}

export function ReviewDetailPage() {
  const { reviewId } = useParams();
  const queryClient = useQueryClient();
  const { isConnected, lastEvent } = useDiffSocket(reviewId ?? null);
  const reviewQuery = useQuery({
    queryKey: ['review', reviewId],
    queryFn: () => getReview(reviewId as string),
    enabled: Boolean(reviewId),
  });
  const statusQuery = useAnalysisStatus(reviewId ?? null, Boolean(reviewId));

  useEffect(() => {
    if (!reviewId || !lastEvent) return;
    if (lastEvent.type === 'findings_ready' || lastEvent.type === 'annotation_added') {
      void queryClient.invalidateQueries({ queryKey: ['review', reviewId] });
    }
    if (lastEvent.type === 'findings_ready') {
      void queryClient.invalidateQueries({ queryKey: ['review-status', reviewId] });
    }
  }, [lastEvent, queryClient, reviewId]);

  if (!reviewId) {
    return <div className="text-on-surface">Review not found.</div>;
  }

  if (reviewQuery.isLoading) {
    return <div className="text-on-surface">Loading review...</div>;
  }

  if (reviewQuery.isError || !reviewQuery.data) {
    return <div className="text-on-surface">Unable to load review.</div>;
  }

  const review = reviewQuery.data;
  const status = statusQuery.data?.status ?? review.status;
  const parsedDiff = parseUnifiedDiff(review.diff);
  const findingsByLine = new Map(
    review.findings.map((finding) => [`${finding.side === 'left' ? 'L' : 'R'}${finding.line_number}`, finding]),
  );
  const highlightedLines = review.findings.map((finding) => `${finding.side === 'left' ? 'L' : 'R'}${finding.line_number}`);

  function renderFinding(lineNumber: number, prefix: 'L' | 'R'): ReactElement {
    const finding = findingsByLine.get(`${prefix}${lineNumber}`);
    if (!finding) return <span />;

    return (
      <div className="my-1 max-w-[260px] rounded-md border border-warning/30 bg-warning/10 px-2 py-1.5 text-left">
        <div className="flex items-center justify-between gap-2">
          <span className="font-mono text-[10px] font-bold uppercase text-warning">{finding.severity}</span>
          <span className="font-mono text-[10px] text-on-surface-variant">{finding.category}</span>
        </div>
        <p className="mt-1 text-xs leading-snug text-on-surface">{finding.message}</p>
        <p className="mt-1 text-[11px] leading-snug text-on-surface-variant">{finding.suggestion}</p>
      </div>
    );
  }

  return (
    <>
      <div className="flex max-w-7xl flex-col gap-space-lg mx-auto">
        <div className="rounded-xl bg-surface-container-low p-space-lg border border-outline-variant/30">
          <div className="flex items-center justify-between gap-space-md">
            <div>
              <p className="font-mono text-label-md text-on-surface-variant">Review</p>
              <h1 className="text-headline-lg font-semibold text-on-surface">{review.title}</h1>
            </div>
            <div className="flex items-center gap-space-sm">
              <span className="rounded-full border border-outline-variant/50 bg-surface-container px-space-sm py-1 font-mono text-label-sm text-on-surface-variant">{status}</span>
              <span className={`flex items-center gap-1.5 font-mono text-code-sm ${isConnected ? 'text-primary' : 'text-on-surface-variant'}`}>
                <span className={`h-1.5 w-1.5 rounded-full ${isConnected ? 'bg-primary' : 'bg-outline'}`} />
                {isConnected ? 'Live' : 'Connecting...'}
              </span>
            </div>
          </div>
        </div>

        <div className="overflow-hidden rounded-xl border border-outline-variant/30 bg-surface-container-low shadow-xl">
          <div className="flex items-center justify-between border-b border-outline-variant/30 px-space-lg py-space-md">
            <div>
              <h2 className="text-headline-sm font-semibold text-on-surface">Diff review</h2>
              <p className="font-mono text-code-sm text-on-surface-variant">{review.findings.length} inline finding{review.findings.length === 1 ? '' : 's'}</p>
            </div>
            <span className="font-mono text-label-sm text-on-surface-variant">old / new</span>
          </div>
          <div className="overflow-x-auto">
            <ReactDiffViewer
              oldValue={parsedDiff.oldValue}
              newValue={parsedDiff.newValue}
              splitView
              useDarkTheme
              disableWorker
              showDiffOnly={false}
              leftTitle="Base"
              rightTitle="Proposed"
              highlightLanguage="typescript"
              highlightLines={highlightedLines}
              renderGutter={({ lineNumber, prefix }) => renderFinding(lineNumber, prefix)}
              styles={{
                variables: {
                  dark: {
                    diffViewerBackground: '#17191c',
                    addedBackground: '#123524',
                    removedBackground: '#3a1d24',
                    wordAddedBackground: '#1d6b3c',
                    wordRemovedBackground: '#7d2d3b',
                    addedColor: '#c7f9d4',
                    removedColor: '#ffd0d7',
                    gutterBackground: '#121416',
                    gutterColor: '#737b87',
                    codeFoldGutterBackground: '#121416',
                    codeFoldBackground: '#17191c',
                    codeFoldContentColor: '#aab2bf',
                  },
                },
                contentText: { fontFamily: 'JetBrains Mono, monospace', fontSize: '12px' },
                gutter: { minWidth: '44px' },
              }}
            />
          </div>
        </div>
      </div>
    </>
  );
}
