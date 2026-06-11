import TradingViewChart from '../components/TradingViewChart';

interface Indicator {
  symbol: string;
  title: string;
  tag: string;
  what: string;
  link: string;
  read: string;
}

interface Section {
  heading: string;
  desc: string;
  indicators: Indicator[];
}

const SECTIONS: Section[] = [
  {
    heading: '주가지수 — 시장 본체',
    desc: '시장이 지금 어디로 가는지 가장 직접적으로 보여주는 추세 그 자체입니다.',
    indicators: [
      {
        symbol: 'B2PRIME:SPXUSD',
        title: 'S&P 500',
        tag: '대표 지수',
        what: '미국 대형주 500개를 묶은 대표 지수로, 글로벌 위험자산의 기준점입니다.',
        link: '전체 시장의 위험선호(Risk-on)·위험회피(Risk-off) 방향을 가장 잘 대변합니다.',
        read: '추세가 우상향이면 위험선호, 무너지면 위험회피 국면으로 봅니다.',
      },
      {
        symbol: 'IG:NASDAQ',
        title: '나스닥 100',
        tag: '성장·기술주',
        what: '기술·성장주 비중이 높은 지수로 금리에 특히 민감합니다.',
        link: '금리가 오르면 할인율 부담으로 S&P500보다 더 크게 흔들리는 경향이 있습니다.',
        read: 'S&P500보다 변동이 크면 위험선호가 강한 장, 반대면 방어적인 장입니다.',
      },
      {
        symbol: 'NASDAQ:SOXX',
        title: '반도체 (SOXX)',
        tag: '경기 선행',
        what: '반도체 기업을 담은 ETF로, 경기와 위험자산의 선행 지표 역할을 합니다.',
        link: '한국 증시(수출·반도체 비중)와 특히 직결되어 흐름을 미리 알려주곤 합니다.',
        read: '지수보다 먼저 꺾이거나 먼저 반등하는지 보면 방향 전환의 단서가 됩니다.',
      },
    ],
  },
  {
    heading: '심리·신용 — 리스크 스위치',
    desc: '돈이 위험을 감수하려는지, 피하려는지를 보여주는 신호들입니다. 주가의 방향을 먼저 알려줄 때가 많습니다.',
    indicators: [
      {
        symbol: 'PEPPERSTONE:VIX',
        title: 'VIX 변동성지수',
        tag: '공포지수',
        what: 'S&P500 옵션이 예상하는 향후 변동성으로, 흔히 "공포지수"라 불립니다.',
        link: 'VIX 급등은 곧 위험회피 — 주가 하락과 거의 동시에 움직입니다.',
        read: '낮고 안정적이면 우호적, 20을 넘어 급등하면 조정·패닉 신호로 봅니다.',
      },
      {
        symbol: 'AMEX:HYG',
        title: '하이일드 채권 (HYG)',
        tag: '신용 위험',
        what: '신용등급이 낮은 기업 채권을 담은 ETF로, 신용시장의 건강 상태를 비춥니다.',
        link: 'HYG가 무너지면(신용 스프레드 확대) 신용경색 신호 — 증시에 선행하는 위험입니다.',
        read: '주가는 오르는데 HYG가 약해지면 경계 신호(다이버전스)로 읽습니다.',
      },
    ],
  },
  {
    heading: '매크로 — 유동성과 금리 환경',
    desc: '주가의 배경이 되는 돈의 값(금리)과 글로벌 유동성(달러)을 보여줍니다.',
    indicators: [
      {
        symbol: 'CAPITALCOM:DXY',
        title: '달러인덱스 (DXY)',
        tag: '글로벌 유동성',
        what: '주요 통화 대비 달러의 가치를 나타내는 지수입니다.',
        link: '강달러는 글로벌 유동성을 죄어 위험자산·신흥국 증시에 부담을 줍니다.',
        read: '달러가 가파르게 오르면 위험자산에 역풍, 안정·하락이면 순풍으로 봅니다.',
      },
      {
        symbol: 'FRED:T10Y2Y',
        title: '장단기 금리차 (10년−2년)',
        tag: '경기 신호',
        what: '미 국채 10년물에서 2년물 금리를 뺀 값으로, 경기 사이클의 대표 신호입니다.',
        link: '마이너스(역전)는 경기침체 경고로, 다시 플러스로 가파르게 전환될 때 침체가 현실화되곤 합니다.',
        read: '값보다 방향이 중요 — 역전 후 빠르게 정상화되면 경기·증시 변곡점을 의심합니다.',
      },
    ],
  },
];

function IndicatorCard({ indicator }: { indicator: Indicator }) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden flex flex-col">
      <div className="px-4 pt-4 pb-2 flex items-start justify-between gap-2">
        <div>
          <h3 className="text-lg font-bold text-gray-900">{indicator.title}</h3>
          <span className="text-xs font-mono text-gray-400">{indicator.symbol}</span>
        </div>
        <span className="shrink-0 px-2 py-1 text-xs font-semibold bg-indigo-50 text-indigo-700 rounded">
          {indicator.tag}
        </span>
      </div>
      <div className="px-4">
        <TradingViewChart symbol={indicator.symbol} height={300} />
      </div>
      <div className="px-4 py-3 space-y-1.5 text-sm border-t border-gray-100 mt-2">
        <p className="text-gray-700">{indicator.what}</p>
        <p className="text-gray-700">
          <span className="font-semibold text-gray-900">주식 흐름과의 연결 · </span>
          {indicator.link}
        </p>
        <p className="text-purple-700">
          <span className="font-semibold">이렇게 보세요 · </span>
          {indicator.read}
        </p>
      </div>
    </div>
  );
}

export default function MarketDashboard() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      <div className="mb-6">
        <h2 className="text-xl font-bold text-gray-900">시장 지표로 주식 흐름 읽기</h2>
        <p className="text-sm text-gray-600 mt-1">
          개별 지표 하나가 아니라 <strong>여러 신호를 함께</strong> 봐야 시장의 방향이 보입니다. 아래 차트들을
          묶어서 위험선호와 위험회피 중 어느 쪽인지 가늠하세요.
        </p>
      </div>

      <div className="mb-6 grid grid-cols-1 md:grid-cols-2 gap-3">
        <div className="rounded-xl border border-green-200 bg-green-50 px-4 py-3">
          <p className="text-sm font-bold text-green-800">위험선호(Risk-on) — 주식에 우호</p>
          <p className="text-sm text-green-900 mt-1">
            지수 ↑ · VIX 낮고 안정 · HYG 견조(신용 스프레드 축소) · 달러 안정
          </p>
        </div>
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3">
          <p className="text-sm font-bold text-red-800">위험회피(Risk-off) — 주식 조정</p>
          <p className="text-sm text-red-900 mt-1">
            VIX 급등 · HYG 약세(신용 스프레드 확대) · 강달러 · 금리 급변동
          </p>
        </div>
      </div>

      {SECTIONS.map((section) => (
        <section key={section.heading} className="mb-8">
          <div className="mb-3">
            <h3 className="text-lg font-bold text-gray-800">{section.heading}</h3>
            <p className="text-sm text-gray-600">{section.desc}</p>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
            {section.indicators.map((indicator) => (
              <IndicatorCard key={indicator.symbol} indicator={indicator} />
            ))}
          </div>
        </section>
      ))}

      <p className="text-xs text-gray-400 mt-4">
        차트 데이터는 TradingView 제공이며 일부는 CFD·ETF 등 간접 지표(대용)입니다. 절대 가격보다 추세·방향을
        참고하세요. 투자 판단의 책임은 본인에게 있습니다.
      </p>
    </div>
  );
}
