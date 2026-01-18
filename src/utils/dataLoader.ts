import { Term, Relation, TermWithRelations } from '../types';
import termsData from '../data/terms.json';

export const loadTerms = (): Term[] => {
  return termsData.terms as Term[];
};

export const loadRelations = (): Relation[] => {
  return termsData.relations as Relation[];
};

export const getTermById = (id: string): Term | undefined => {
  return termsData.terms.find(term => term.id === id);
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
  return termsData.terms.filter(
    term => 
      term.name.toLowerCase().includes(lowerQuery) ||
      term.description.toLowerCase().includes(lowerQuery) ||
      (term.category && term.category.toLowerCase().includes(lowerQuery))
  );
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

// 한글 초성 추출 함수
const getKoreanInitial = (text: string): string => {
  const firstChar = text.charAt(0);
  const charCode = firstChar.charCodeAt(0);
  
  // 한글 유니코드 범위: 0xAC00 ~ 0xD7A3
  if (charCode >= 0xAC00 && charCode <= 0xD7A3) {
    const initialIndex = Math.floor((charCode - 0xAC00) / 28 / 21);
    const initials = ['ㄱ', 'ㄲ', 'ㄴ', 'ㄷ', 'ㄸ', 'ㄹ', 'ㅁ', 'ㅂ', 'ㅃ', 'ㅅ', 'ㅆ', 'ㅇ', 'ㅈ', 'ㅉ', 'ㅊ', 'ㅋ', 'ㅌ', 'ㅍ', 'ㅎ'];
    return initials[initialIndex];
  }
  return '';
};

// 영문 첫 글자 추출 함수
const getEnglishInitial = (text: string): string => {
  const firstChar = text.charAt(0).toUpperCase();
  if (firstChar >= 'A' && firstChar <= 'Z') {
    return firstChar;
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
