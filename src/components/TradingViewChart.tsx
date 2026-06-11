import { useEffect, useRef, useState } from 'react';

interface TradingViewChartProps {
  symbol: string;
  height?: number;
}

const WIDGET_SRC =
  'https://s3.tradingview.com/external-embedding/embed-widget-advanced-chart.js';

// 화면에 들어올 때만 위젯 스크립트를 로드해 초기 로딩 부담을 줄인다.
export default function TradingViewChart({ symbol, height = 360 }: TradingViewChartProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = containerRef.current;
    if (!el || visible) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          setVisible(true);
          observer.disconnect();
        }
      },
      { rootMargin: '200px' }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [visible]);

  useEffect(() => {
    if (!visible) return;
    const container = containerRef.current;
    if (!container) return;

    container.innerHTML = '';

    const widget = document.createElement('div');
    widget.className = 'tradingview-widget-container__widget';
    widget.style.height = 'calc(100% - 32px)';
    widget.style.width = '100%';

    const copyright = document.createElement('div');
    copyright.className = 'tradingview-widget-copyright';
    const link = document.createElement('a');
    link.href = `https://kr.tradingview.com/symbols/${symbol.replace(':', '-')}/`;
    link.rel = 'noopener nofollow';
    link.target = '_blank';
    const span = document.createElement('span');
    span.className = 'blue-text';
    span.textContent = 'TradingView에서 전체 시장 보기';
    link.appendChild(span);
    copyright.appendChild(link);

    const script = document.createElement('script');
    script.type = 'text/javascript';
    script.src = WIDGET_SRC;
    script.async = true;
    script.innerHTML = JSON.stringify({
      allow_symbol_change: false,
      calendar: false,
      details: false,
      hide_side_toolbar: true,
      hide_top_toolbar: true,
      hide_legend: false,
      hide_volume: true,
      hotlist: false,
      interval: 'D',
      locale: 'kr',
      save_image: false,
      style: '1',
      symbol,
      theme: 'light',
      timezone: 'Etc/UTC',
      backgroundColor: '#ffffff',
      gridColor: 'rgba(46, 46, 46, 0.06)',
      watchlist: [],
      withdateranges: false,
      compareSymbols: [],
      studies: [],
      autosize: true,
    });

    container.appendChild(widget);
    container.appendChild(copyright);
    container.appendChild(script);

    return () => {
      container.innerHTML = '';
    };
  }, [visible, symbol]);

  return (
    <div
      ref={containerRef}
      className="tradingview-widget-container"
      style={{ height, width: '100%' }}
    >
      {!visible && (
        <div className="flex items-center justify-center h-full text-sm text-gray-400">
          차트 불러오는 중…
        </div>
      )}
    </div>
  );
}
