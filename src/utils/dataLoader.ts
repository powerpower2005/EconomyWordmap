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
