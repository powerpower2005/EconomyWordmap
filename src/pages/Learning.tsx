import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  loadCurriculum,
  getTermById,
  getStarRating,
  getPropositionById,
  getPropositionsByTermId,
} from '../utils/dataLoader';
import { CurriculumPart, CurriculumSection } from '../types';
import MarkdownProse from '../components/MarkdownProse';
import PropositionBody from '../components/PropositionBody';
import { stripMarkdownInline } from '../utils/termDisplay';
import { loadBookmarks, toggleBookmark } from '../utils/learningProgress';
import { useLearnedItems } from '../hooks/useLearnedItems';
import LearnedToggle from '../components/LearnedToggle';
import { loadReadingState, saveReadingState, loadReaderPreference, saveReaderPreference } from '../utils/readingState';

export type LearnBodyFormat = 'dialogue' | 'prose';

interface LearningProps {
  isActive?: boolean;
  onOpenTerm: (termId: string) => void;
  onOpenMarket?: () => void;
  onOpenAllPropositions?: () => void;
  focusSectionId?: string | null;
  onFocusHandled?: () => void;
}

export default function Learning({
  onOpenTerm,
  onOpenMarket,
  onOpenAllPropositions,
  focusSectionId = null,
  onFocusHandled,
  isActive = true,
}: LearningProps) {
  const curriculum = useMemo(() => loadCurriculum(), []);
  const [selectedSectionId, setSelectedSectionId] = useState<string | null>(null);
  const [learnFormat, setLearnFormat] = useState<LearnBodyFormat>(() =>
    loadReaderPreference('format', 'dialogue') === 'prose' ? 'prose' : 'dialogue');
  const [largeText, setLargeText] = useState(() => loadReaderPreference('size', 'standard') === 'large');
  const [expandedTermId, setExpandedTermId] = useState<string | null>(null);
  const [expandedPropId, setExpandedPropId] = useState<string | null>(null);
  const [bookmarks, setBookmarks] = useState<Set<string>>(() => loadBookmarks());
  const [lastRead, setLastRead] = useState(loadReadingState);
  const [activePartId, setActivePartId] = useState<string | null>(null);
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState('전체');
  const pendingPart = useRef<string | null>(null);
  const { isLearned, toggleLearned } = useLearnedItems();
  const selectedSection = curriculum?.sections.find(s => s.id === selectedSectionId) ?? null;

  const remember = useCallback((sectionId: string, partId: string | null) => {
    const value = { sectionId, partId };
    setLastRead(value);
    saveReadingState(value);
  }, []);

  const openSection = useCallback((sectionId: string, partId: string | null = null) => {
    pendingPart.current = partId;
    setActivePartId(partId);
    setExpandedTermId(null);
    setExpandedPropId(null);
    setSelectedSectionId(sectionId);
    remember(sectionId, partId);
  }, [remember]);

  useEffect(() => {
    if (!focusSectionId || !curriculum?.sections.some(s => s.id === focusSectionId)) return;
    openSection(focusSectionId);
    onFocusHandled?.();
  }, [focusSectionId, curriculum, onFocusHandled, openSection]);

  useEffect(() => {
    if (!selectedSectionId || !isActive) return;
    const frame = requestAnimationFrame(() => {
      if (pendingPart.current) {
        document.getElementById(pendingPart.current)?.scrollIntoView({ block: 'start' });
        pendingPart.current = null;
      }
    });
    return () => cancelAnimationFrame(frame);
  }, [selectedSectionId, isActive]);

  useEffect(() => {
    if (!selectedSection || !isActive || !('IntersectionObserver' in window)) return;
    const observer = new IntersectionObserver(entries => {
      const entry = entries.find(item => item.isIntersecting);
      if (!entry) return;
      setActivePartId(entry.target.id);
      remember(selectedSection.id, entry.target.id);
    }, { rootMargin: '-15% 0px -65% 0px', threshold: 0 });
    selectedSection.parts.forEach(part => {
      const element = document.getElementById(part.id);
      if (element) observer.observe(element);
    });
    return () => observer.disconnect();
  }, [selectedSection, isActive, remember]);

  if (!curriculum) return <p className="learning-library">학습 내용을 불러올 수 없습니다.</p>;

  const handleBookmark = (id: string) => setBookmarks(toggleBookmark(id, bookmarks));
  const chooseFormat = (format: LearnBodyFormat) => {
    setLearnFormat(format);
    saveReaderPreference('format', format);
  };
  const chooseSection = (id: string, part: string | null = null) => {
    openSection(id, part);
    if (!part) window.scrollTo({ top: 0 });
  };
  const jumpToPart = (id: string) => {
    const element = document.getElementById(id);
    element?.scrollIntoView({ behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth', block: 'start' });
    element?.focus({ preventScroll: true });
    setActivePartId(id);
    if (selectedSection) remember(selectedSection.id, id);
  };

  if (selectedSection) {
    const showDialogue = sectionHasFormat(selectedSection, 'dialogue');
    const showProse = sectionHasFormat(selectedSection, 'prose');
    const activeFormat: LearnBodyFormat = learnFormat === 'prose' && showProse ? 'prose' : showDialogue ? 'dialogue' : 'prose';
    const nextSection = curriculum.sections[curriculum.sections.findIndex(s => s.id === selectedSection.id) + 1];
    const contents = <nav aria-label="이 이야기의 목차" className="reader-contents">
      <p className="eyebrow">이 이야기의 흐름</p>
      {selectedSection.parts.map((part, index) => (
        <button type="button" key={part.id} aria-current={activePartId === part.id ? 'location' : undefined}
          onClick={() => jumpToPart(part.id)} className={activePartId === part.id ? 'is-current' : ''}>
          <span>{String(index + 1).padStart(2, '0')}</span><span>{part.title.replace(/^\d+\.\s*/, '')}</span>
        </button>
      ))}
      <p className="reader-save-note">읽던 위치는 이 브라우저에 자동 저장돼요.</p>
    </nav>;
    return (
      <div className={`reader-layout ${largeText ? 'reader-large' : ''}`}>
        <aside className="reader-sidebar">
          <button type="button" className="text-action" onClick={() => { setSelectedSectionId(null); window.scrollTo({ top: 0 }); }}>← 모든 학습 주제</button>
          {contents}
        </aside>
        <div className="reader-main">
          <div className="reader-toolbar">
            <button type="button" className="text-action reader-mobile-back" onClick={() => { setSelectedSectionId(null); window.scrollTo({ top: 0 }); }}>← 학습 목록</button>
            {showDialogue && showProse && <LearnFormatToggle format={activeFormat} onChange={chooseFormat} />}
            <button type="button" className="reader-text-size" aria-pressed={largeText} onClick={() => {
              setLargeText(!largeText); saveReaderPreference('size', largeText ? 'standard' : 'large');
            }}><span aria-hidden="true">가</span> {largeText ? '기본 글씨' : '큰 글씨'}</button>
          </div>
          <article className="reader-article">
            <header className="reader-heading">
              <p className="eyebrow">{sectionTopic(selectedSection)} · 약 {readingMinutes(selectedSection)}분</p>
              <h1>{selectedSection.title}</h1>
              <p>{selectedSection.subtitle}</p>
            </header>
            <details className="reader-mobile-contents"><summary>목차 · {selectedSection.parts.length}개의 이야기</summary>{contents}</details>
            <MarkdownProse source={resolveSectionBody(selectedSection, activeFormat)} className="reader-opening" mode={activeFormat} />
            {selectedSection.parts.map(part => (
              <PartBlock key={part.id} part={part} format={activeFormat} markdownMode={activeFormat}
                expandedTermId={expandedTermId} expandedPropId={expandedPropId} bookmarks={bookmarks}
                isLearned={isLearned} onToggleLearned={toggleLearned}
                onToggleTerm={id => setExpandedTermId(expandedTermId === id ? null : id)}
                onToggleProp={id => setExpandedPropId(expandedPropId === id ? null : id)}
                onBookmark={handleBookmark} onOpenTerm={onOpenTerm} />
            ))}
            <footer className="reader-finish">
              <p className="eyebrow">읽은 내용을 나의 판단으로</p>
              <h2>어떤 조건에서 이 설명이 달라질까요?</h2>
              <p>각 이야기의 명제를 펼쳐 성립 조건과 반례를 비교해 보세요. 기억하고 싶은 용어는 별표로 남길 수 있어요.</p>
              <div className="reader-finish-actions">
                {onOpenAllPropositions && <button className="secondary-action" onClick={onOpenAllPropositions}>명제로 생각해 보기 ↗</button>}
                {onOpenMarket && <button className="secondary-action" onClick={onOpenMarket}>실제 시장 지표 보기 ↗</button>}
              </div>
              {nextSection && <button className="next-story" onClick={() => chooseSection(nextSection.id)}>
                <span>이어서 읽어도 좋아요<strong>{nextSection.title}</strong></span><span aria-hidden="true">→</span>
              </button>}
              <button type="button" className="text-action" onClick={() => { setSelectedSectionId(null); window.scrollTo({ top: 0 }); }}>모든 주제로 돌아가기</button>
            </footer>
          </article>
        </div>
      </div>
    );
  }

  const normalizedQuery = query.trim().toLocaleLowerCase();
  const visibleSections = curriculum.sections.filter(section => {
    if (filter === '저장한 주제') {
      if (!countSectionBookmarks(section, bookmarks)) return false;
    } else if (filter !== '전체' && sectionTopic(section) !== filter) return false;
    if (!normalizedQuery) return true;
    const text = [section.title, section.subtitle, ...section.parts.flatMap(part => [
      part.title, ...part.termIds.map(id => getTermById(id)?.name || id),
      ...(part.propositionIds || []).map(id => getPropositionById(id)?.statement || id),
    ])].join(' ').toLocaleLowerCase();
    return text.includes(normalizedQuery);
  });
  const resumeSection = curriculum.sections.find(s => s.id === lastRead?.sectionId);
  const resumePart = resumeSection?.parts.find(p => p.id === lastRead?.partId);
  const firstSection = curriculum.sections[0];
  const topics = ['전체', ...new Set(curriculum.sections.map(sectionTopic)), '저장한 주제'];
  return (
    <div className="learning-library">
      <header className="library-hero">
        <div>
          <p className="eyebrow">투자자를 위한 경제 읽기</p>
          <h1>뉴스 속 숫자를,<br /><em>이해하는 힘으로.</em></h1>
          <p className="hero-description">하나의 질문에서 시작해 원리를 읽고,<br className="desktop-break" /> 관계를 연결하고, 명제의 반례까지 생각해 보세요.</p>
          <div className="hero-meta"><span>{curriculum.sections.length}개의 학습 주제</span><span>대화와 설명, 두 가지 읽기</span></div>
        </div>
        <div className="start-panel">
          <span className="eyebrow">{resumeSection ? '이어서 읽기' : '처음이라면 여기부터'}</span>
          <h2>{resumeSection?.title || firstSection?.title}</h2>
          <p>{resumePart ? resumePart.title : '구매력에서 출발해 은행과 금리, 내 자산까지 연결해 봅니다.'}</p>
          {(resumeSection || firstSection) && <button className="primary-action" onClick={() =>
            chooseSection((resumeSection || firstSection).id, resumePart?.id || null)}>
            {resumeSection ? '읽던 곳으로' : '첫 이야기 읽기'} <span aria-hidden="true">→</span>
          </button>}
          <span className="start-note">{resumeSection ? '마지막으로 읽은 위치가 저장되어 있어요' : '선행 지식 없이, 내 속도대로'}</span>
        </div>
      </header>
      <section className="library-catalog" aria-labelledby="catalog-heading">
        <div className="catalog-heading"><div><p className="eyebrow">나의 질문에서 시작하기</p><h2 id="catalog-heading">오늘은 무엇이 궁금한가요?</h2></div>
          <label className="learning-search"><span aria-hidden="true">⌕</span><span className="sr-only">학습 주제·용어·명제 검색</span>
            <input type="search" placeholder="금리, 인플레이션, 주가…" value={query} onChange={e => setQuery(e.target.value)} />
          </label>
        </div>
        <div className="topic-filters" role="group" aria-label="학습 주제 분류">
          {topics.map(topic => <button type="button" key={topic} aria-pressed={filter === topic}
            className={filter === topic ? 'is-selected' : ''} onClick={() => setFilter(topic)}>{topic}</button>)}
        </div>
        <div className="catalog-status"><p aria-live="polite">{visibleSections.length}개의 이야기{normalizedQuery && ` · “${query.trim()}” 검색 결과`}</p><span>순서와 관계없이 자유롭게 읽으세요</span></div>
        {visibleSections.length ? <div className="story-grid">
          {visibleSections.map(section => <SectionCard key={section.id} section={section}
            bookmarkCount={countSectionBookmarks(section, bookmarks)} onSelect={() => chooseSection(section.id)} />)}
        </div> : <div className="learning-empty"><h3>{filter === '저장한 주제' ? '아직 저장한 주제가 없어요' : '맞는 이야기를 찾지 못했어요'}</h3>
          <p>{filter === '저장한 주제' ? '본문 아래 용어·명제에서 별표를 누르면 이곳에서 다시 찾을 수 있어요.' : '다른 용어로 검색하거나 주제 분류를 바꿔 보세요.'}</p>
          <button className="secondary-action" onClick={() => { setQuery(''); setFilter('전체'); }}>모든 이야기 보기</button></div>}
      </section>
      <section className="learning-method" aria-label="학습 방법">
        <div><span>01</span><h3>질문으로 읽고</h3><p>내 자산과 연결되는 질문으로<br />경제 원리를 이해해요.</p></div>
        <div><span>02</span><h3>관계를 연결하고</h3><p>용어를 펼쳐 뜻을 확인하고<br />원인과 결과를 따라가요.</p></div>
        <div><span>03</span><h3>조건을 생각해요</h3><p>명제의 성립 조건과 반례로<br />나의 판단을 점검해요.</p></div>
      </section>
    </div>
  );
}

function sectionTopic(section: CurriculumSection): string {
  if (section.id === 'sec-theory-history') return '이론과 판단';
  if (section.id === 'sec-investor-judgment') return '이론과 판단';
  if (['sec-valuation', 'sec-portfolio-risk'].includes(section.id)) return '주식과 위험';
  if (section.id === 'sec-fiscal-trade') return '재정과 무역';
  if (['sec-macro-dashboard', 'sec-real-economy', 'sec-inflation-shocks'].includes(section.id)) return '경제지표';
  return '돈과 금리';
}

function readingMinutes(section: CurriculumSection): number {
  const body = [resolveSectionBody(section, 'prose'), ...section.parts.map(p => resolvePartBody(p, 'prose'))].join(' ');
  return Math.max(1, Math.ceil(stripMarkdownInline(body).length / 550));
}

function resolveSectionBody(section: CurriculumSection, format: LearnBodyFormat): string {
  if (format === 'dialogue') {
    if (section.bodyDialogue?.trim()) return section.bodyDialogue.trim();
  } else if (section.bodyProse?.trim()) {
    return section.bodyProse.trim();
  }
  if (section.body?.trim()) return section.body.trim();

  const chunks: string[] = [];
  if (section.hook?.trim()) chunks.push(section.hook.trim());
  if (section.overview?.trim()) chunks.push(section.overview.trim());
  if (section.episode?.body?.trim()) {
    const ep = section.episode;
    const head = [ep.title, ep.period].filter(Boolean).join(' · ');
    chunks.push(head ? `### ${head}\n\n${ep.body.trim()}` : ep.body.trim());
  }
  return chunks.join('\n\n');
}

function resolvePartBody(part: CurriculumPart, format: LearnBodyFormat): string {
  if (format === 'dialogue') {
    if (part.bodyDialogue?.trim()) return part.bodyDialogue.trim();
  } else if (part.bodyProse?.trim()) {
    return part.bodyProse.trim();
  }
  if (part.body?.trim()) return part.body.trim();

  const chunks: string[] = [];
  if (part.lead?.trim()) chunks.push(part.lead.trim());

  for (const ex of part.examples ?? []) {
    const head = [ex.title, ex.period].filter(Boolean).join(' · ');
    chunks.push(head ? `### ${head}\n\n${ex.body.trim()}` : ex.body.trim());
  }

  if (part.takeaway?.trim()) chunks.push(`**정리:** ${part.takeaway.trim()}`);

  if (part.investorActions?.length) {
    const bullets = part.investorActions.map(a => `- ${a}`).join('\n');
    chunks.push(bullets);
  }

  return chunks.join('\n\n');
}

function sectionHasFormat(section: CurriculumSection, format: LearnBodyFormat): boolean {
  if (format === 'dialogue') {
    if (section.bodyDialogue?.trim()) return true;
    return section.parts.some(
      p => !!(p.bodyDialogue?.trim() || (p.body?.trim() && !p.bodyProse?.trim()))
    );
  }
  if (section.bodyProse?.trim()) return true;
  return section.parts.some(p => !!p.bodyProse?.trim());
}

function LearnFormatToggle({
  format,
  onChange,
  className = '',
}: {
  format: LearnBodyFormat;
  onChange: (format: LearnBodyFormat) => void;
  className?: string;
}) {
  return (
    <div
      className={`inline-flex rounded-lg border border-gray-200 bg-gray-50 p-1 text-sm ${className}`}
      role="group"
      aria-label="읽기 방식"
    >
      <button
        type="button"
        aria-pressed={format === 'dialogue'}
        onClick={() => onChange('dialogue')}
        className={`rounded-md px-4 py-2 font-medium transition-colors ${
          format === 'dialogue'
            ? 'bg-white text-violet-700 shadow-sm'
            : 'text-gray-600 hover:text-gray-900'
        }`}
      >
        대화로
      </button>
      <button
        type="button"
        aria-pressed={format === 'prose'}
        onClick={() => onChange('prose')}
        className={`rounded-md px-4 py-2 font-medium transition-colors ${
          format === 'prose'
            ? 'bg-white text-violet-700 shadow-sm'
            : 'text-gray-600 hover:text-gray-900'
        }`}
      >
        설명으로
      </button>
    </div>
  );
}

function countSectionBookmarks(section: CurriculumSection, bookmarks: Set<string>): number {
  const ids = section.parts.flatMap(part => [...part.termIds, ...(part.propositionIds ?? [])]);
  return new Set(ids.filter(id => bookmarks.has(id))).size;
}

function SectionCard({ section, bookmarkCount, onSelect }: {
  section: CurriculumSection; bookmarkCount: number; onSelect: () => void;
}) {
  const previews = section.parts.slice(0, 3).map(p => p.title.replace(/^\d+\.\s*/, ''));
  return (
    <button type="button" onClick={onSelect} className="story-card">
      <div className="story-card-top"><span className="story-number">{String(section.order).padStart(2, '0')}</span><span>{sectionTopic(section)}</span><span className="story-arrow" aria-hidden="true">↗</span></div>
      <h3>{section.title}</h3>
      <p className="story-subtitle">{section.subtitle}</p>
      <div className="story-preview">{previews.map((text, index) => <span key={text}>{index > 0 && <i aria-hidden="true"> / </i>}{text}</span>)}</div>
      <div className="story-card-footer"><span>약 {readingMinutes(section)}분 · {section.parts.length}개 파트</span><span>{bookmarkCount > 0 ? `★ ${bookmarkCount}개 저장` : '읽어 보기 →'}</span></div>
    </button>
  );
}

function PartBlock({
  part,
  format,
  markdownMode,
  expandedTermId,
  expandedPropId,
  bookmarks,
  isLearned,
  onToggleLearned,
  onToggleTerm,
  onToggleProp,
  onBookmark,
  onOpenTerm,
}: {
  part: CurriculumPart;
  format: LearnBodyFormat;
  markdownMode: LearnBodyFormat;
  expandedTermId: string | null;
  expandedPropId: string | null;
  bookmarks: Set<string>;
  isLearned: (id: string) => boolean;
  onToggleLearned: (id: string) => void;
  onToggleTerm: (termId: string) => void;
  onToggleProp: (propId: string) => void;
  onBookmark: (id: string) => void;
  onOpenTerm: (id: string) => void;
}) {
  const body = resolvePartBody(part, format);
  const terms = part.termIds
    .map(tid => getTermById(tid))
    .filter((t): t is NonNullable<typeof t> => t != null);
  const propositions = (part.propositionIds ?? [])
    .map(pid => getPropositionById(pid))
    .filter((p): p is NonNullable<typeof p> => p != null);

  if (!body && terms.length === 0 && propositions.length === 0) return null;

  let rowIndex = 0;
  const refCount = terms.length + propositions.length;

  return (
    <section id={part.id} tabIndex={-1} className="reader-part">
      <h2 className="text-xl font-bold text-gray-900">{part.title}</h2>
      {part.subtitle && <p className="text-sm text-gray-500 mt-1">{part.subtitle}</p>}

      {body && <MarkdownProse source={body} className="mt-4" mode={markdownMode} />}

      {refCount > 0 && (
        <details className="learning-references mt-6 group">
          <summary className="cursor-pointer text-sm text-gray-500 hover:text-gray-700 select-none list-none flex items-center gap-1.5">
            <span className="text-gray-400 group-open:rotate-90 transition-transform inline-block">▶</span>
            더 깊이 이해하기 · 용어 {terms.length} · 명제 {propositions.length}
          </summary>
          <div className="mt-3 space-y-2 border-l-2 border-gray-100 pl-4">
            {terms.map(term => {
              const index = rowIndex++;
              return (
                <TermRow
                  key={term.id}
                  index={index}
                  term={term}
                  expanded={expandedTermId === term.id}
                  bookmarked={bookmarks.has(term.id)}
                  learned={isLearned(term.id)}
                  onToggle={() => onToggleTerm(term.id)}
                  onBookmark={() => onBookmark(term.id)}
                  onToggleLearned={() => onToggleLearned(term.id)}
                  onOpenTerm={onOpenTerm}
                />
              );
            })}
            {propositions.map(prop => {
              const index = rowIndex++;
              return (
                <PropositionRow
                  key={prop.id}
                  index={index}
                  proposition={prop}
                  expanded={expandedPropId === prop.id}
                  bookmarked={bookmarks.has(prop.id)}
                  learned={isLearned(prop.id)}
                  onToggle={() => onToggleProp(prop.id)}
                  onBookmark={() => onBookmark(prop.id)}
                  onToggleLearned={() => onToggleLearned(prop.id)}
                  onOpenTerm={onOpenTerm}
                />
              );
            })}
          </div>
        </details>
      )}
    </section>
  );
}

function TermRow({
  index,
  term,
  expanded,
  bookmarked,
  learned,
  onToggle,
  onBookmark,
  onToggleLearned,
  onOpenTerm,
}: {
  index: number;
  term: NonNullable<ReturnType<typeof getTermById>>;
  expanded: boolean;
  bookmarked: boolean;
  learned: boolean;
  onToggle: () => void;
  onBookmark: () => void;
  onToggleLearned: () => void;
  onOpenTerm: (id: string) => void;
}) {
  const relatedProps = getPropositionsByTermId(term.id);

  return (
    <div
      className={`rounded-lg border overflow-hidden ${
        learned ? 'bg-emerald-50/60 border-emerald-100' : 'bg-gray-50/80 border-gray-100'
      }`}
    >
      <div className="flex items-center gap-2 px-3 py-2.5">
        <LearnedToggle learned={learned} onToggle={onToggleLearned} size="sm" />
        <span className="text-xs text-gray-400 w-5 shrink-0">{index + 1}</span>
        <button type="button" onClick={onToggle} className="flex-1 text-left min-w-0">
          <div
            className={`text-sm font-medium break-words ${learned ? 'text-gray-600' : 'text-gray-900'}`}
          >
            {term.name}
          </div>
          {!expanded && (
            <p className="text-xs text-gray-500 line-clamp-1 mt-0.5">{stripMarkdownInline(term.description)}</p>
          )}
        </button>
        {term.stockMarketImportance != null && (
          <span className="text-xs shrink-0 hidden sm:inline" title="주식시장 중요도">
            {getStarRating(term.stockMarketImportance)}
          </span>
        )}
        <button
          type="button"
          onClick={e => {
            e.stopPropagation();
            onBookmark();
          }}
          className={`shrink-0 text-base ${bookmarked ? 'text-amber-500' : 'text-gray-300 hover:text-amber-400'}`}
          aria-label={bookmarked ? `${term.name} 저장 해제` : `${term.name} 저장`}
          aria-pressed={bookmarked}
        >
          ★
        </button>
        <button type="button" onClick={onToggle} aria-label={`${term.name} ${expanded ? '설명 접기' : '설명 펼치기'}`} aria-expanded={expanded} className="text-gray-400 shrink-0 text-xs px-1">
          {expanded ? '▼' : '▶'}
        </button>
      </div>

      {expanded && (
        <div className="px-3 pb-3 border-t border-gray-100 pt-2 space-y-2">
          <p className="concept-breadcrumb">학습 › 용어 이해</p>
          <MarkdownProse source={term.description} mode="prose" className="text-sm text-gray-700" />
          {relatedProps.length > 0 && (
            <p className="text-xs text-gray-500">관련 명제 {relatedProps.length}개</p>
          )}
          <button
            type="button"
            onClick={() => onOpenTerm(term.id)}
            className="text-xs px-2.5 py-1 rounded bg-blue-600 text-white hover:bg-blue-700"
          >
            관계도에서 보기
          </button>
          <button type="button" className="text-action ml-3" onClick={onToggle}>용어 접고 학습 계속 읽기</button>
        </div>
      )}
    </div>
  );
}

function PropositionRow({
  index,
  proposition,
  expanded,
  bookmarked,
  learned,
  onToggle,
  onBookmark,
  onToggleLearned,
  onOpenTerm,
}: {
  index: number;
  proposition: NonNullable<ReturnType<typeof getPropositionById>>;
  expanded: boolean;
  bookmarked: boolean;
  learned: boolean;
  onToggle: () => void;
  onBookmark: () => void;
  onToggleLearned: () => void;
  onOpenTerm: (id: string) => void;
}) {
  return (
    <div
      className={`rounded-lg border overflow-hidden ${
        learned ? 'bg-emerald-50/50 border-emerald-100' : 'bg-indigo-50/40 border-indigo-100/80'
      }`}
    >
      <div className="flex items-start gap-2 px-3 py-2.5">
        <LearnedToggle learned={learned} onToggle={onToggleLearned} size="sm" className="mt-0.5" />
        <span className="text-xs text-gray-400 w-5 shrink-0 mt-0.5">{index + 1}</span>
        <button type="button" onClick={onToggle} className="flex-1 text-left min-w-0">
          <div className="text-[10px] text-indigo-600 font-medium mb-0.5">명제</div>
          <div className={`text-sm font-medium ${learned ? 'text-gray-600' : 'text-gray-900'}`}>
            {proposition.statement}
          </div>
          {!expanded && (
            <p className="text-xs text-gray-500 line-clamp-1 mt-0.5">{proposition.verdict}</p>
          )}
        </button>
        <button
          type="button"
          onClick={e => {
            e.stopPropagation();
            onBookmark();
          }}
          className={`shrink-0 text-base ${bookmarked ? 'text-amber-500' : 'text-gray-300 hover:text-amber-400'}`}
          aria-label={bookmarked ? `${proposition.statement} 저장 해제` : `${proposition.statement} 저장`}
          aria-pressed={bookmarked}
        >
          ★
        </button>
        <button type="button" onClick={onToggle} aria-label={`${proposition.statement} ${expanded ? '명제 접기' : '명제 펼치기'}`} aria-expanded={expanded} className="text-gray-400 shrink-0 text-xs px-1">
          {expanded ? '▼' : '▶'}
        </button>
      </div>

      {expanded && (
        <div className="px-3 pb-3 border-t border-indigo-100/60 pt-2 space-y-3">
          <p className="concept-breadcrumb">학습 › 명제 이해</p>
          <PropositionBody proposition={proposition} onOpenTerm={onOpenTerm} />
          <button type="button" className="text-action" onClick={onToggle}>명제 접고 학습 계속 읽기</button>
        </div>
      )}
    </div>
  );
}
