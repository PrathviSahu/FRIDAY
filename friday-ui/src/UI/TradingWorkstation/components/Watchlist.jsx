import React, { useState, useEffect } from 'react';
import { Search, Plus, Trash2, TrendingUp, TrendingDown, Star, ChevronDown, Check } from 'lucide-react';

const INITIAL_FOREX_WATCHLIST = [
    { symbol: 'OANDA:XAUUSD', name: 'XAUUSD', full: 'Gold Spot / U.S. Dollar', price: '4,081.17', change: '+73.59', changePct: '+1.84%', category: 'FOREX', isPositive: true },
    { symbol: 'CAPITALCOM:DXY', name: 'DXY', full: 'U.S. Dollar Index', price: '101.182', change: '+0.186', changePct: '+0.18%', category: 'FOREX', isPositive: true },
    { symbol: 'FX:USDCHF', name: 'USDCHF', full: 'USD / Swiss Franc', price: '0.8129', change: '+0.0026', changePct: '+0.32%', category: 'FOREX', isPositive: true },
    { symbol: 'FX:USDCAD', name: 'USDCAD', full: 'USD / Canadian Dollar', price: '1.4107', change: '+0.0036', changePct: '+0.26%', category: 'FOREX', isPositive: true },
    { symbol: 'FX:EURAUD', name: 'EURAUD', full: 'EUR / Australian Dollar', price: '1.6277', change: '-0.0030', changePct: '-0.19%', category: 'FOREX', isPositive: false },
    { symbol: 'NASDAQ:NDX', name: 'NASDAQ', full: 'US Tech 100 Index', price: '29,158.8', change: '+616.4', changePct: '+2.16%', category: 'FOREX', isPositive: true },
    { symbol: 'FX:EURUSD', name: 'EURUSD', full: 'EUR / U.S. Dollar', price: '1.1401', change: '-0.0011', changePct: '-0.10%', category: 'FOREX', isPositive: false },
    { symbol: 'FX:GBPUSD', name: 'GBPUSD', full: 'GBP / U.S. Dollar', price: '1.3379', change: '-0.0051', changePct: '-0.38%', category: 'FOREX', isPositive: false },
    { symbol: 'FX:NZDUSD', name: 'NZDUSD', full: 'NZD / U.S. Dollar', price: '0.5830', change: '-0.0008', changePct: '-0.14%', category: 'FOREX', isPositive: false },
    { symbol: 'BINANCE:BTCUSDT', name: 'BTCUSD', full: 'Bitcoin / Tether', price: '66,268.4', change: '+1,055.4', changePct: '+1.62%', category: 'FOREX', isPositive: true },
    { symbol: 'FX:GBPJPY', name: 'GBPJPY', full: 'GBP / Japanese Yen', price: '218.36', change: '+0.110', changePct: '+0.05%', category: 'FOREX', isPositive: true },
];

const INITIAL_INDIAN_WATCHLIST = [
    { symbol: 'NSE:NIFTY', name: 'NIFTY 50', full: 'Nifty 50 Index', price: '24,187.70', change: '-50.80', changePct: '-0.21%', category: 'INDIAN STOCKS', isPositive: false },
    { symbol: 'NSE:BANKNIFTY', name: 'BANKNIFTY', full: 'Nifty Bank Index', price: '52,340.50', change: '+180.20', changePct: '+0.35%', category: 'INDIAN STOCKS', isPositive: true },
    { symbol: 'NSE:RELIANCE', name: 'RELIANCE', full: 'Reliance Industries Ltd.', price: '2,980.45', change: '+42.10', changePct: '+1.43%', category: 'INDIAN STOCKS', isPositive: true },
    { symbol: 'NSE:TCS', name: 'TCS', full: 'Tata Consultancy Services', price: '3,890.00', change: '-12.50', changePct: '-0.32%', category: 'INDIAN STOCKS', isPositive: false },
    { symbol: 'NSE:INFY', name: 'INFY', full: 'Infosys Limited', price: '1,560.20', change: '+18.40', changePct: '+1.19%', category: 'INDIAN STOCKS', isPositive: true },
    { symbol: 'NSE:HDFCBANK', name: 'HDFCBANK', full: 'HDFC Bank Limited', price: '1,680.00', change: '+8.50', changePct: '+0.51%', category: 'INDIAN STOCKS', isPositive: true },
    { symbol: 'NSE:ICICIBANK', name: 'ICICIBANK', full: 'ICICI Bank Limited', price: '1,120.30', change: '+5.10', changePct: '+0.46%', category: 'INDIAN STOCKS', isPositive: true },
    { symbol: 'NSE:SBIN', name: 'SBIN', full: 'State Bank of India', price: '845.60', change: '-3.20', changePct: '-0.38%', category: 'INDIAN STOCKS', isPositive: false },
    { symbol: 'NSE:TATAMOTORS', name: 'TATAMOTORS', full: 'Tata Motors Limited', price: '985.40', change: '+14.20', changePct: '+1.46%', category: 'INDIAN STOCKS', isPositive: true },
    { symbol: 'NSE:LIKHITH', name: 'LIKHITH', full: 'Likhitha Infrastructure', price: '235.25', change: '-0.10', changePct: '-0.04%', category: 'INDIAN STOCKS', isPositive: false },
    { symbol: 'NSE:DBOL', name: 'DBOL', full: 'Dwarikesh Sugar Industries', price: '106.10', change: '-1.41', changePct: '-1.31%', category: 'INDIAN STOCKS', isPositive: false },
    { symbol: 'NSE:TITAGARH', name: 'TITAGARH', full: 'Titagarh Rail Systems', price: '843.60', change: '-23.60', changePct: '-2.72%', category: 'INDIAN STOCKS', isPositive: false },
    { symbol: 'NSE:BLACKBOX', name: 'BLACKBOX', full: 'Black Box Limited', price: '574.65', change: '+0.85', changePct: '+0.15%', category: 'INDIAN STOCKS', isPositive: true },
    { symbol: 'NSE:OMAXAUTO', name: 'OMAXAUTO', full: 'Omax Autos Limited', price: '169.34', change: '-0.58', changePct: '-0.34%', category: 'INDIAN STOCKS', isPositive: false },
    { symbol: 'NSE:HINDALCO', name: 'HINDALCO', full: 'Hindalco Industries', price: '218.45', change: '-3.80', changePct: '-1.71%', category: 'INDIAN STOCKS', isPositive: false },
    { symbol: 'NSE:GEMAR', name: 'GEMAR', full: 'GMR Airports Infrastructure', price: '182.22', change: '-2.66', changePct: '-1.44%', category: 'INDIAN STOCKS', isPositive: false },
    { symbol: 'NSE:AEQUS', name: 'AEQUS', full: 'Aequs Consumer Products', price: '238.50', change: '-1.87', changePct: '-0.78%', category: 'INDIAN STOCKS', isPositive: false },
];

export default function CustomWatchlist({ currentSymbol, onSelectSymbol }) {
    const [activeTab, setActiveTab] = useState('Forex'); // 'Forex' | 'Indian'
    const [forexList, setForexList] = useState(() => {
        const saved = localStorage.getItem('friday_watch_forex');
        return saved ? JSON.parse(saved) : INITIAL_FOREX_WATCHLIST;
    });
    const [indianList, setIndianList] = useState(() => {
        const saved = localStorage.getItem('friday_watch_indian');
        return saved ? JSON.parse(saved) : INITIAL_INDIAN_WATCHLIST;
    });

    const [showAddModal, setShowAddModal] = useState(false);
    const [newSymbol, setNewSymbol] = useState('');
    const [newName, setNewName] = useState('');
    const [filterQuery, setFilterQuery] = useState('');

    useEffect(() => {
        localStorage.setItem('friday_watch_forex', JSON.stringify(forexList));
    }, [forexList]);

    useEffect(() => {
        localStorage.setItem('friday_watch_indian', JSON.stringify(indianList));
    }, [indianList]);

    const activeList = activeTab === 'Forex' ? forexList : indianList;
    const setActiveList = activeTab === 'Forex' ? setForexList : setIndianList;

    const filteredList = activeList.filter((item) =>
        item.name.toLowerCase().includes(filterQuery.toLowerCase()) ||
        item.symbol.toLowerCase().includes(filterQuery.toLowerCase()) ||
        item.full.toLowerCase().includes(filterQuery.toLowerCase())
    );

    const handleAddSymbol = (e) => {
        e.preventDefault();
        const sym = newSymbol.trim().toUpperCase();
        if (!sym) return;

        const isIndian = activeTab === 'Indian';
        const formattedSym = sym.includes(':') ? sym : (isIndian ? `NSE:${sym}` : `FX:${sym}`);
        const displayName = sym.replace(/^NSE:|^FX:|^OANDA:|^BINANCE:|^NASDAQ:/, '');

        const newItem = {
            symbol: formattedSym,
            name: displayName,
            full: `${displayName} (${isIndian ? 'NSE Stock' : 'Forex'})`,
            price: (Math.random() * 1000 + 100).toFixed(2),
            change: '+2.40',
            changePct: '+0.85%',
            category: activeTab === 'Forex' ? 'FOREX' : 'INDIAN STOCKS',
            isPositive: true,
        };

        setActiveList((prev) => [newItem, ...prev]);
        setNewSymbol('');
        setNewName('');
        setShowAddModal(false);
    };

    const handleDeleteSymbol = (symbolToDelete, e) => {
        e.stopPropagation();
        setActiveList((prev) => prev.filter((item) => item.symbol !== symbolToDelete));
    };

    return (
        <div className="w-72 bg-[#131722] border-l border-[#2a2e39] flex flex-col h-full select-none text-slate-200 font-sans z-30">
            {/* Header with Tab Dropdown / Selector */}
            <div className="p-3 border-b border-[#2a2e39] flex flex-col gap-2 bg-[#131722]">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1">
                        <button
                            onClick={() => setActiveTab('Forex')}
                            className={`px-2.5 py-1 rounded-md text-xs font-bold transition-all cursor-pointer ${
                                activeTab === 'Forex'
                                    ? 'bg-[#2962ff] text-white'
                                    : 'bg-[#1e222d] text-slate-400 hover:text-slate-200'
                            }`}
                        >
                            Forex & Crypto
                        </button>
                        <button
                            onClick={() => setActiveTab('Indian')}
                            className={`px-2.5 py-1 rounded-md text-xs font-bold transition-all cursor-pointer ${
                                activeTab === 'Indian'
                                    ? 'bg-[#2962ff] text-white'
                                    : 'bg-[#1e222d] text-slate-400 hover:text-slate-200'
                            }`}
                        >
                            Indian Market 🇮🇳
                        </button>
                    </div>

                    {/* Add Symbol Plus Button */}
                    <button
                        onClick={() => setShowAddModal(true)}
                        className="p-1.5 rounded-lg bg-[#1e222d] hover:bg-[#2a2e39] text-slate-300 hover:text-white transition-all cursor-pointer border border-[#2a2e39]"
                        title="Add symbol to watchlist"
                    >
                        <Plus size={15} />
                    </button>
                </div>

                {/* Filter / Search input */}
                <div className="flex items-center gap-2 bg-[#1e222d] border border-[#2a2e39] rounded-lg px-2.5 py-1.5">
                    <Search size={13} className="text-slate-500 shrink-0" />
                    <input
                        type="text"
                        value={filterQuery}
                        onChange={(e) => setFilterQuery(e.target.value)}
                        placeholder={`Search ${activeTab} watchlist...`}
                        className="bg-transparent text-xs text-white placeholder-slate-500 outline-none w-full"
                    />
                    {filterQuery && (
                        <button onClick={() => setFilterQuery('')} className="text-slate-500 hover:text-slate-300 text-xs">
                            ✕
                        </button>
                    )}
                </div>
            </div>

            {/* List Table Headers */}
            <div className="flex items-center justify-between px-3 py-1.5 border-b border-[#2a2e39] bg-[#1e222d]/50 text-[10px] font-mono text-slate-400 uppercase tracking-wider">
                <span>Symbol</span>
                <div className="flex items-center gap-6 pr-2">
                    <span>Last</span>
                    <span>Chg%</span>
                </div>
            </div>

            {/* Watchlist Symbol List */}
            <div className="flex-1 overflow-y-auto divide-y divide-[#1e222d] scrollbar-thin scrollbar-thumb-[#2a2e39]">
                {filteredList.length === 0 ? (
                    <div className="p-4 text-center text-xs text-slate-500">
                        No symbols found. Click <span className="text-[#2962ff] font-bold">+</span> to add.
                    </div>
                ) : (
                    filteredList.map((item) => {
                        const isSelected = currentSymbol === item.symbol;
                        return (
                            <div
                                key={item.symbol}
                                onClick={() => onSelectSymbol(item.symbol)}
                                className={`group px-3 py-2 flex items-center justify-between cursor-pointer transition-all ${
                                    isSelected ? 'bg-[#1e222d] border-l-2 border-[#2962ff]' : 'hover:bg-[#1e222d]/60'
                                }`}
                            >
                                {/* Left symbol name */}
                                <div className="flex flex-col min-w-0 pr-2">
                                    <span className="text-xs font-bold text-white font-mono truncate">
                                        {item.name}
                                    </span>
                                    <span className="text-[9px] text-slate-500 font-mono truncate">
                                        {item.full}
                                    </span>
                                </div>

                                {/* Right prices + delete button on hover */}
                                <div className="flex items-center gap-3 shrink-0">
                                    <div className="flex flex-col items-end font-mono">
                                        <span className="text-xs font-medium text-slate-100">
                                            {item.price}
                                        </span>
                                        <span className={`text-[10px] font-bold ${item.isPositive ? 'text-[#089981]' : 'text-[#f23645]'}`}>
                                            {item.changePct}
                                        </span>
                                    </div>

                                    {/* Delete Button (visible on hover) */}
                                    <button
                                        onClick={(e) => handleDeleteSymbol(item.symbol, e)}
                                        className="opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-rose-500/20 text-slate-500 hover:text-rose-400 transition-all"
                                        title={`Delete ${item.name} from watchlist`}
                                    >
                                        <Trash2 size={13} />
                                    </button>
                                </div>
                            </div>
                        );
                    })
                )}
            </div>

            {/* Modal for Adding New Symbol */}
            {showAddModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
                    <form
                        onSubmit={handleAddSymbol}
                        className="w-80 rounded-2xl bg-[#1e222d] border border-[#2a2e39] p-4 flex flex-col gap-3 text-slate-100 font-sans shadow-2xl"
                    >
                        <div className="flex items-center justify-between pb-2 border-b border-[#2a2e39]">
                            <span className="text-xs font-bold font-mono text-white uppercase">
                                Add Symbol to {activeTab} Watchlist
                            </span>
                            <button
                                type="button"
                                onClick={() => setShowAddModal(false)}
                                className="text-slate-400 hover:text-white"
                            >
                                ✕
                            </button>
                        </div>

                        <div className="flex flex-col gap-1">
                            <label className="text-[10px] font-mono text-slate-400 uppercase">Symbol (e.g. RELIANCE, TATAMOTORS, XAUUSD)</label>
                            <input
                                type="text"
                                autoFocus
                                value={newSymbol}
                                onChange={(e) => setNewSymbol(e.target.value)}
                                placeholder="Enter symbol..."
                                className="bg-[#131722] border border-[#2a2e39] rounded-lg px-3 py-2 text-xs text-white outline-none focus:border-[#2962ff]"
                            />
                        </div>

                        <div className="flex justify-end gap-2 pt-2">
                            <button
                                type="button"
                                onClick={() => setShowAddModal(false)}
                                className="px-3 py-1.5 rounded-lg bg-[#2a2e39] text-xs text-slate-300 hover:text-white"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                className="px-4 py-1.5 rounded-lg bg-[#2962ff] hover:bg-[#1e54e4] text-xs font-bold text-white shadow-md"
                            >
                                Add Symbol
                            </button>
                        </div>
                    </form>
                </div>
            )}
        </div>
    );
}
