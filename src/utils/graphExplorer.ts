import type { Relation, Term } from '../types';

export type ConnectionGroup = 'incoming' | 'outgoing' | 'related';
export interface Connection { term: Term; relations: Relation[]; group: ConnectionGroup }

export function createGraphIndex(terms: Term[], relations: Relation[]) {
  const byId = new Map(terms.map(term => [term.id, term]));
  const adjacency = new Map<string, Relation[]>(terms.map(term => [term.id, []]));
  for (const relation of relations) {
    if (!byId.has(relation.term1Id) || !byId.has(relation.term2Id)) continue;
    adjacency.get(relation.term1Id)!.push(relation);
    if (relation.term1Id !== relation.term2Id) adjacency.get(relation.term2Id)!.push(relation);
  }
  return { byId, adjacency };
}

export function connectionGroup(relations: Relation[], centerId: string): ConnectionGroup {
  // Missing nature, correlation, definition, hierarchy and feedback are not one-way causality.
  if (relations.some(r => r.bidirectional || !['causal', 'policy'].includes(r.nature || ''))) return 'related';
  const directions = new Set(relations.map(r => r.term2Id === centerId ? 'incoming' : 'outgoing'));
  return directions.size === 1 ? [...directions][0] as ConnectionGroup : 'related';
}

export function getConnections(index: ReturnType<typeof createGraphIndex>, centerId: string, preferredIds: string[] = []): Connection[] {
  const grouped = new Map<string, Relation[]>();
  for (const relation of index.adjacency.get(centerId) || []) {
    const otherId = relation.term1Id === centerId ? relation.term2Id : relation.term1Id;
    if (otherId === centerId) continue;
    grouped.set(otherId, [...(grouped.get(otherId) || []), relation]);
  }
  const preferred = new Set(preferredIds);
  const strength = (r: Relation) => r.strength === 'strong' ? 3 : r.strength === 'weak' ? 1 : 2;
  return [...grouped].map(([id, relations]) => ({ term: index.byId.get(id)!, relations, group: connectionGroup(relations, centerId) }))
    .sort((a, b) => Number(preferred.has(b.term.id)) - Number(preferred.has(a.term.id))
      || Math.max(...b.relations.map(strength)) - Math.max(...a.relations.map(strength))
      || (b.term.stockMarketImportance || 0) - (a.term.stockMarketImportance || 0)
      || a.term.id.localeCompare(b.term.id));
}

// Append-only coordinates within each lane: revealing more never shuffles existing nodes.
export function placeConnections(connections: Connection[]) {
  const counts = { incoming: 0, outgoing: 0, related: 0 };
  return connections.map(connection => {
    const row = counts[connection.group]++;
    return { ...connection, x: connection.group === 'incoming' ? 10 : connection.group === 'outgoing' ? 650 : 330,
      y: (connection.group === 'related' ? 280 : 60) + row * 100 };
  });
}
