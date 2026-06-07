import { Term, Relation, TermWithRelations, Proposition } from '../types';
import { compareTermsByUpdated, isTermUpdatedWithinDays } from './termDisplay';
import termsData from '../data/terms.json';

export type TermSortOrder = 'default' | 'updated-desc' | 'updated-asc';

const allTerms = termsData.terms as Term[];
const allPropositions = ((termsData as { propositions?: Proposition[] }).propositions ?? []) as Proposition[];

export const loadTerms = (): Term[] => {
  return allTerms;
};

export const loadRelations = (): Relation[] => {
  return termsData.relations as Relation[];
};

export const loadPropositions = (): Proposition[] => {
  return allPropositions;
};

export const getPropositionById = (id: string): Proposition | undefined => {
  return allPropositions.find(p => p.id === id);
};

// 특정 용어가 등장하는(termIds에 포함된) 명제 목록
export const getPropositionsByTermId = (termId: string): Proposition[] => {
  return allPropositions.filter(p => p.termIds.includes(termId));
};

export const getTermById = (id: string): Term | undefined => {
  return allTerms.find(term => term.id === id);
};

export const getRelationsForTerm = (termId: string): Relation[] => {
  return termsData.relations.filter(
    relation => relation.term1Id === termId || relation.term2Id === termId
  ) as Relation[];
};

export const getTermWithRelations = (termId: string): TermWithRelations | null => {
  const term = getTermById(termId);
  if (!term) return null;

  const relations = getRelationsForTerm(termId);
  const termWithRelations: TermWithRelations = {
    ...term,
    relations: relations.map(relation => {
      const relatedTermId = relation.term1Id === termId 
        ? relation.term2Id 
        : relation.term1Id;
      const relatedTerm = getTermById(relatedTermId);
      return {
        term: relatedTerm!,
        relation
      };
    })
  };

  return termWithRelations;
};

export const searchTerms = (query: string): Term[] => {
  const lowerQuery = query.toLowerCase();
  return allTerms.filter(
    term => 
      term.name.toLowerCase().includes(lowerQuery) ||
      term.description.toLowerCase().includes(lowerQuery) ||
      (term.category && term.category.toLowerCase().includes(lowerQuery))
  );
};

export interface TermListOptions {
  sortOrder?: TermSortOrder;
  updatedWithinDays?: number | null;
}

export const filterAndSortTerms = (
  terms: Term[],
  options: TermListOptions = {}
): Term[] => {
  const { sortOrder = 'default', updatedWithinDays = null } = options;
  let results = [...terms];

  if (updatedWithinDays != null && updatedWithinDays > 0) {
    results = results.filter((term) => isTermUpdatedWithinDays(term, updatedWithinDays));
  }

  if (sortOrder === 'updated-desc') {
    results.sort((a, b) => compareTermsByUpdated(a, b, false));
  } else if (sortOrder === 'updated-asc') {
    results.sort((a, b) => compareTermsByUpdated(a, b, true));
  }

  return results;
};

export const queryTerms = (
  query: string,
  allTerms: Term[],
  options: TermListOptions = {}
): Term[] => {
  const base = query.trim().length > 0 ? searchTerms(query) : allTerms;
  return filterAndSortTerms(base, options);
};

export const getAllRelations = (): Array<{ term1: Term; term2: Term; relation: Relation }> => {
  return termsData.relations.map(relation => {
    const term1 = getTermById(relation.term1Id);
    const term2 = getTermById(relation.term2Id);
    return {
      term1: term1!,
      term2: term2!,
      relation: relation as Relation
    };
  });
};

// 한글 초성 추출 함수 (쌍자음을 기본 자음으로 매핑)
const getKoreanInitial = (text: string): string => {
  const firstChar = text.charAt(0);
  const charCode = firstChar.charCodeAt(0);
  
  // 한글 유니코드 범위: 0xAC00 ~ 0xD7A3
  if (charCode >= 0xAC00 && charCode <= 0xD7A3) {
    const initialIndex = Math.floor((charCode - 0xAC00) / 28 / 21);
    const allInitials = ['ㄱ', 'ㄲ', 'ㄴ', 'ㄷ', 'ㄸ', 'ㄹ', 'ㅁ', 'ㅂ', 'ㅃ', 'ㅅ', 'ㅆ', 'ㅇ', 'ㅈ', 'ㅉ', 'ㅊ', 'ㅋ', 'ㅌ', 'ㅍ', 'ㅎ'];
    const initial = allInitials[initialIndex];
    
    // 쌍자음을 기본 자음으로 매핑
    const initialMapping: Record<string, string> = {
      'ㄲ': 'ㄱ',
      'ㄸ': 'ㄷ',
      'ㅃ': 'ㅂ',
      'ㅆ': 'ㅅ',
      'ㅉ': 'ㅈ'
    };
    
    return initialMapping[initial] || initial;
  }
  return '';
};

// 영문 첫 글자 추출 함수 (괄호 안 영어도 포함)
const getEnglishInitial = (text: string): string => {
  // 먼저 첫 글자가 영문인지 확인
  const firstChar = text.charAt(0).toUpperCase();
  if (firstChar >= 'A' && firstChar <= 'Z') {
    return firstChar;
  }
  
  // 괄호 안의 영어 단어 찾기 (예: "인플레이션 (Inflation)")
  const match = text.match(/\(([A-Z][a-zA-Z\s]+)\)/);
  if (match && match[1]) {
    const englishWord = match[1].trim();
    if (englishWord.length > 0) {
      const initial = englishWord.charAt(0).toUpperCase();
      if (initial >= 'A' && initial <= 'Z') {
        return initial;
      }
    }
  }
  
  return '';
};

// 한글 인덱스 생성
export const getKoreanIndex = (): Record<string, Term[]> => {
  const index: Record<string, Term[]> = {};
  const terms = loadTerms();
  
  terms.forEach(term => {
    const initial = getKoreanInitial(term.name);
    if (initial) {
      if (!index[initial]) {
        index[initial] = [];
      }
      index[initial].push(term);
    }
  });
  
  // 정렬
  Object.keys(index).forEach(key => {
    index[key].sort((a, b) => a.name.localeCompare(b.name, 'ko'));
  });
  
  return index;
};

// 영문 인덱스 생성
export const getEnglishIndex = (): Record<string, Term[]> => {
  const index: Record<string, Term[]> = {};
  const terms = loadTerms();
  
  terms.forEach(term => {
    const initial = getEnglishInitial(term.name);
    if (initial) {
      if (!index[initial]) {
        index[initial] = [];
      }
      index[initial].push(term);
    }
  });
  
  // 정렬
  Object.keys(index).forEach(key => {
    index[key].sort((a, b) => a.name.localeCompare(b.name, 'en'));
  });
  
  return index;
};

// 주식시장 중요도를 별로 변환하는 함수
// 1-10 스케일: 작은별 2개 = 큰별 1개
// 예: 1=☆, 2=★, 3=★☆, 4=★★, 5=★★☆, ..., 10=★★★★★
export const getStarRating = (importance: number): string => {
  if (!importance || importance < 1 || importance > 10) return '';
  
  const bigStars = Math.floor(importance / 2);
  const smallStar = importance % 2;
  
  return '★'.repeat(bigStars) + (smallStar ? '☆' : '');
};

// 주식시장 중요도로 용어 필터링
export const filterTermsByImportance = (importance: number): Term[] => {
  return allTerms.filter(term => term.stockMarketImportance === importance);
};
