import { useEffect, useRef } from 'react';
import RelationGraph, { RelationGraphHandle } from '../components/RelationGraph';
import '../graph-explorer.css';

interface HomeProps {
  focusTermId?: string | null;
  focusPartId?: string | null;
  onFocusHandled?: () => void;
}

export default function Home({ focusTermId = null, focusPartId = null, onFocusHandled }: HomeProps = {}) {
  const graphRef = useRef<RelationGraphHandle>(null);
  useEffect(() => {
    if (!focusTermId || !graphRef.current) return;
    graphRef.current.clickNode(focusTermId, focusPartId);
    onFocusHandled?.();
  }, [focusTermId, focusPartId, onFocusHandled]);
  return <div className="map-page"><RelationGraph ref={graphRef} /></div>;
}
