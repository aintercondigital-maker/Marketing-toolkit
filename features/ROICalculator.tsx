
import React, { useState, useMemo } from 'react';
import { Language } from '../types';
import { getGeminiBasicTask } from '../services/geminiService';
import { MarkdownView } from '../components/MarkdownView';

interface Props {
  language: Language;
}

export const ROICalculator: React.FC<Props> = ({ language }) => {
  const [invested, setInvested] = useState<number>(5000);
  const [mql, setMql] = useState<number>(100);
  const [sqlRate, setSqlRate] = useState<number>(20);
  const [dealRate, setDealRate] = useState<number>(25);
  const [avgDealValue, setAvgDealValue] = useState<number>(50000);
  const [wonRate, setWonRate] = useState<number>(40);
  
  const [aiAnalysis, setAiAnalysis] = useState('');
  const [loading, setLoading] = useState(false);

  const stats = useMemo(() => {
    const cpl = mql > 0 ? invested / mql : 0;
    const sqlCount = Math.round(mql * (sqlRate / 100));
    const dealCount = Math.round(sqlCount * (dealRate / 100));
    const pipeline = dealCount * avgDealValue;
    const wonCount = Math.round(dealCount * (wonRate / 100));
    const revenue = wonCount * avgDealValue;
    const roi = invested > 0 ? revenue / invested : 0;

    return {
      cpl,
      sqlCount,
      dealCount,
      pipeline,
      wonCount,
      revenue,
      roi
    };
  }, [invested, mql, sqlRate, dealRate, avgDealValue, wonRate]);

  const handleAiAnalysis = async () => {
    setLoading(true);
    const system = "You are a Senior Advantech Marketing Strategist. Analyze the JMF (Joint Marketing Fund) ROI calculation results and provide a compelling, professional B2B executive summary evaluating the campaign's effectiveness.";
    const user = `Campaign Data:
    - Invested: $${invested}
    - MQLs Generated: ${mql}
    - Cost Per Lead (CPL): $${stats.cpl.toFixed(2)}
    - SQL Conversion Rate: ${sqlRate}% (${stats.sqlCount} SQLs)
    - Deal Registration Rate: ${dealRate}% (${stats.dealCount} Deals)
    - Average Deal Value: $${avgDealValue}
    - Total Pipeline: $${stats.pipeline}
    - Win Rate: ${wonRate}% (${stats.wonCount} Won Deals)
    - Estimated Revenue: $${stats.revenue}
    - ROI Multiplier: ${stats.roi.toFixed(2)}x
    
    Provide a concise, persuasive 3-paragraph summary evaluating the campaign's performance, highlighting strengths, and suggesting one area for optimization.`;
    
    try {
      const res = await getGeminiBasicTask(system, user, language);
      setAiAnalysis(res || 'No analysis generated.');
    } catch (e) {
      setAiAnalysis('Error generating AI analysis.');
    } finally {
      setLoading(false);
    }
  };

  const translations = {
    'English': {
      title: 'Advantech JMF ROI Calculator',
      subtitle: 'Focus on Pipeline & CPL, not just attendance.',
      invested: 'JMF Invested (USD)',
      mql: 'MQL (Marketing Leads)',
      sqlRate: 'MQL to SQL Conversion (%)',
      dealRate: 'SQL to Deal Reg (%)',
      avgValue: 'Avg. Deal Value (USD)',
      wonRate: 'Deal to Won (%)',
      results: 'Campaign Results',
      cpl: 'Cost Per Lead (CPL)',
      pipeline: 'Total Pipeline',
      revenue: 'Estimated Revenue',
      roi: 'ROI Multiplier',
      funnel: 'Conversion Funnel',
      f_mql: 'MQL',
      f_sql: 'SQL',
      f_deal: 'Deal Reg',
      f_won: 'Closed Won'
    },
    'Traditional Chinese': {
      title: '研華 JMF 行銷投資回報計算機',
      subtitle: '關注 Pipeline 與 CPL，而非僅僅是參加人數。',
      invested: 'JMF投入金額 (USD)',
      mql: 'MQL (行銷合格名單)',
      sqlRate: 'MQL 轉 SQL 轉換率 (%)',
      dealRate: 'SQL 轉 商機登錄率 (%)',
      avgValue: '平均訂單價值 (USD)',
      wonRate: '商機轉贏單率 (%)',
      results: '活動成效',
      cpl: '獲客成本 (CPL)',
      pipeline: '總 Pipeline 價值',
      revenue: '預估營收',
      roi: 'ROI 投資回報倍數',
      funnel: '轉換漏斗',
      f_mql: '行銷名單',
      f_sql: '業務名單',
      f_deal: '商機登錄',
      f_won: '贏單'
    },
    'Simplified Chinese': {
      title: '研华 JMF 营销投资回报计算器',
      subtitle: '关注 Pipeline 与 CPL，而非仅仅是参加人数。',
      invested: 'JMF 投入金额 (USD)',
      mql: 'MQL (营销合格名单)',
      sqlRate: 'MQL 转 SQL 转换率 (%)',
      dealRate: 'SQL 转 商机登录率 (%)',
      avgValue: '平均订单价值 (USD)',
      wonRate: '商机转赢单率 (%)',
      results: '活动成效',
      cpl: '获客成本 (CPL)',
      pipeline: '总 Pipeline 价值',
      revenue: '预估营收',
      roi: 'ROI 投资回报倍数',
      funnel: '转换漏斗',
      f_mql: '营销名单',
      f_sql: '业务名单',
      f_deal: '商机登录',
      f_won: '赢单'
    },
    'Japanese': {
      title: 'アドバンテック JMF ROI 計算機',
      subtitle: '参加者数だけでなく、パイプラインとCPLに注目します。',
      invested: 'JMF 投資額 (USD)',
      mql: 'MQL (マーケティングリード)',
      sqlRate: 'MQLからSQLへの転換率 (%)',
      dealRate: 'SQLから案件登録率 (%)',
      avgValue: '平均案件単価 (USD)',
      wonRate: '案件から成約率 (%)',
      results: 'キャンペーン結果',
      cpl: 'リード獲得単価 (CPL)',
      pipeline: '総パイプライン',
      revenue: '推定収益',
      roi: 'ROI 倍率',
      funnel: 'コンバージョンファンネル',
      f_mql: 'MQL',
      f_sql: 'SQL',
      f_deal: '案件登録',
      f_won: '成約'
    },
    'Korean': {
      title: '어드밴텍 JMF ROI 계산기',
      subtitle: '단순 참여자 수가 아닌 파이프라인과 CPL에 집중하십시오.',
      invested: 'JMF 투자액 (USD)',
      mql: 'MQL (마케팅 리드)',
      sqlRate: 'MQL에서 SQL 전환율 (%)',
      dealRate: 'SQL에서 딜 등록률 (%)',
      avgValue: '평균 딜 가치 (USD)',
      wonRate: '딜에서 수주율 (%)',
      results: '캠페인 결과',
      cpl: '리드당 비용 (CPL)',
      pipeline: '총 파이프라인',
      revenue: '예상 매출',
      roi: 'ROI 배수',
      funnel: '전환 퍼널',
      f_mql: 'MQL',
      f_sql: 'SQL',
      f_deal: '딜 등록',
      f_won: '수주'
    }
  };

  const t = translations[language as keyof typeof translations] || translations['English'];

  return (
    <div className="max-w-6xl mx-auto p-6 animate-fadeIn">
      <div className="mb-8">
        <h2 className="text-3xl font-black text-[#004E9A] uppercase tracking-tight">{t.title}</h2>
        <p className="text-slate-500 font-medium">{t.subtitle}</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Inputs */}
        <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100 space-y-6">
          <div>
            <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">{t.invested}</label>
            <input 
              type="number" 
              value={invested} 
              onChange={e => setInvested(Number(e.target.value))}
              className="w-full bg-slate-50 border-none rounded-xl p-4 font-bold text-slate-700 focus:ring-2 focus:ring-blue-500 outline-none"
            />
          </div>
          <div>
            <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">{t.mql}</label>
            <input 
              type="number" 
              value={mql} 
              onChange={e => setMql(Number(e.target.value))}
              className="w-full bg-slate-50 border-none rounded-xl p-4 font-bold text-slate-700 focus:ring-2 focus:ring-blue-500 outline-none"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">{t.sqlRate}</label>
              <input 
                type="number" 
                value={sqlRate} 
                onChange={e => setSqlRate(Number(e.target.value))}
                className="w-full bg-slate-50 border-none rounded-xl p-4 font-bold text-slate-700 focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>
            <div>
              <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">{t.dealRate}</label>
              <input 
                type="number" 
                value={dealRate} 
                onChange={e => setDealRate(Number(e.target.value))}
                className="w-full bg-slate-50 border-none rounded-xl p-4 font-bold text-slate-700 focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>
          </div>
          <div>
            <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">{t.avgValue}</label>
            <input 
              type="number" 
              value={avgDealValue} 
              onChange={e => setAvgDealValue(Number(e.target.value))}
              className="w-full bg-slate-50 border-none rounded-xl p-4 font-bold text-slate-700 focus:ring-2 focus:ring-blue-500 outline-none"
            />
          </div>
          <div>
            <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">{t.wonRate}</label>
            <input 
              type="number" 
              value={wonRate} 
              onChange={e => setWonRate(Number(e.target.value))}
              className="w-full bg-slate-50 border-none rounded-xl p-4 font-bold text-slate-700 focus:ring-2 focus:ring-blue-500 outline-none"
            />
          </div>
        </div>

        {/* Funnel & Results */}
        <div className="lg:col-span-2 space-y-8">
          <div className="bg-[#004E9A] p-8 rounded-3xl text-white shadow-xl relative overflow-hidden">
            <div className="relative z-10 grid grid-cols-2 md:grid-cols-4 gap-6">
              <div>
                <p className="text-[10px] font-black uppercase tracking-widest opacity-60 mb-1">{t.cpl}</p>
                <p className="text-2xl font-black">${stats.cpl.toFixed(1)}</p>
              </div>
              <div>
                <p className="text-[10px] font-black uppercase tracking-widest opacity-60 mb-1">{t.pipeline}</p>
                <p className="text-2xl font-black">${stats.pipeline.toLocaleString()}</p>
              </div>
              <div>
                <p className="text-[10px] font-black uppercase tracking-widest opacity-60 mb-1">{t.revenue}</p>
                <p className="text-2xl font-black text-yellow-400">${stats.revenue.toLocaleString()}</p>
              </div>
              <div>
                <p className="text-[10px] font-black uppercase tracking-widest opacity-60 mb-1">{t.roi}</p>
                <p className="text-2xl font-black text-emerald-400">{stats.roi.toFixed(1)}x</p>
              </div>
            </div>
          </div>

          <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100">
            <h3 className="text-sm font-black uppercase tracking-widest text-slate-400 mb-8">{t.funnel}</h3>
            
            <div className="flex flex-col items-center space-y-2">
              {/* MQL */}
              <div className="w-full max-w-md bg-blue-500 text-white p-4 rounded-xl flex justify-between items-center shadow-md">
                <span className="font-black text-xs uppercase">{t.f_mql}</span>
                <span className="font-bold">{mql} Leads</span>
              </div>
              
              <div className="text-slate-300"><i className="fa-solid fa-chevron-down"></i> <span className="text-[10px] font-bold">{sqlRate}%</span></div>

              {/* SQL */}
              <div className="w-[90%] max-w-md bg-blue-600 text-white p-4 rounded-xl flex justify-between items-center shadow-md">
                <span className="font-black text-xs uppercase">{t.f_sql}</span>
                <span className="font-bold">{stats.sqlCount} Leads</span>
              </div>

              <div className="text-slate-300"><i className="fa-solid fa-chevron-down"></i> <span className="text-[10px] font-bold">{dealRate}%</span></div>

              {/* Deal Reg */}
              <div className="w-[80%] max-w-md bg-blue-700 text-white p-4 rounded-xl flex justify-between items-center shadow-md">
                <span className="font-black text-xs uppercase">{t.f_deal}</span>
                <span className="font-bold">{stats.dealCount} Deals</span>
              </div>

              <div className="text-slate-300"><i className="fa-solid fa-chevron-down"></i> <span className="text-[10px] font-bold">{wonRate}%</span></div>

              {/* Won */}
              <div className="w-[70%] max-w-md bg-emerald-500 text-white p-4 rounded-xl flex justify-between items-center shadow-md">
                <span className="font-black text-xs uppercase">{t.f_won}</span>
                <span className="font-bold">{stats.wonCount} Deals</span>
              </div>
            </div>

            <div className="mt-12 p-6 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
              <p className="text-xs text-slate-500 leading-relaxed italic">
                "The True Campaign ROI Tracking: It's not about how many people showed up. It's about how much it cost to find a lead (CPL) and how much pipeline was generated. That's precision marketing."
              </p>
            </div>

            <button 
              onClick={handleAiAnalysis}
              disabled={loading}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-black py-4 rounded-2xl shadow-lg transition-all transform hover:-translate-y-1 text-sm tracking-widest uppercase flex items-center justify-center gap-2 mt-6"
            >
              {loading ? <i className="fa-solid fa-spinner animate-spin"></i> : <i className="fa-solid fa-wand-magic-sparkles"></i>} Generate AI Executive Summary
            </button>

            {aiAnalysis && (
              <div className="bg-blue-50 p-8 rounded-[2rem] border border-blue-200 mt-6 animate-fadeIn">
                <div className="text-[10px] font-black text-blue-800 uppercase tracking-widest mb-4 flex items-center gap-2">
                  <i className="fa-solid fa-robot"></i> AI Executive Summary
                </div>
                <div className="text-sm text-slate-800 leading-relaxed">
                  <MarkdownView content={aiAnalysis} />
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
