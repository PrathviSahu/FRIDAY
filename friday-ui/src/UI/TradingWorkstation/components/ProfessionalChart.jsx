import React, { useEffect, useRef } from 'react';

// Maps user symbols to official TradingView widget symbols (e.g., Gold -> OANDA:XAUUSD)
const SYMBOL_MAP = {
    'XAUUSD': 'OANDA:XAUUSD',
    'GC=F': 'OANDA:XAUUSD',
    'GOLD': 'OANDA:XAUUSD',
    'BTC-USD': 'BINANCE:BTCUSDT',
    'BTCUSD': 'BINANCE:BTCUSDT',
    'ETH-USD': 'BINANCE:ETHUSDT',
    'SOL-USD': 'BINANCE:SOLUSDT',
    'EURUSD=X': 'FX:EURUSD',
    'GBPUSD=X': 'FX:GBPUSD',
    'USDJPY=X': 'FX:USDJPY',
    'DXY': 'CAPITALCOM:DXY',
    'NVDA': 'NASDAQ:NVDA',
    'AAPL': 'NASDAQ:AAPL',
    'TSLA': 'NASDAQ:TSLA',
    '^GSPC': 'FOREXCOM:SPXUSD',
    'NASDAQ': 'NASDAQ:NDX',
    '^IXIC': 'NASDAQ:NDX',
    '^NSEI': 'NSE:NIFTY',
    'RELIANCE.NS': 'NSE:RELIANCE',
};

export default function ProfessionalChart({ symbol = 'OANDA:XAUUSD' }) {
    const containerRef = useRef(null);

    const tvSymbol = SYMBOL_MAP[symbol] || (symbol.includes(':') ? symbol : `OANDA:${symbol.replace(/[^a-zA-Z0-9]/g, '')}`);

    useEffect(() => {
        if (!containerRef.current) return;
        containerRef.current.innerHTML = '';

        const script = document.createElement('script');
        script.src = 'https://s3.tradingview.com/tv.js';
        script.async = true;
        script.onload = () => {
            if (window.TradingView && containerRef.current) {
                new window.TradingView.widget({
                    autosize: true,
                    symbol: tvSymbol,
                    interval: '1',
                    timezone: 'Asia/Kolkata',
                    theme: 'dark',
                    style: '1',
                    locale: 'in',
                    toolbar_bg: '#080d1a',
                    enable_publishing: false,
                    hide_side_toolbar: false, // Show professional left drawing sidebar
                    allow_symbol_change: true,
                    details: true,
                    hotlist: true,
                    calendar: true,
                    show_popup_button: true,
                    popup_width: '1000',
                    popup_height: '650',
                    container_id: 'tradingview_widget_container',
                    backgroundColor: '#080d1a',
                    gridColor: 'rgba(30, 41, 59, 0.3)',
                });
            }
        };

        containerRef.current.appendChild(script);
    }, [tvSymbol]);

    return (
        <div className="flex-1 w-full h-full bg-[#080d1a] relative overflow-hidden">
            <div id="tradingview_widget_container" ref={containerRef} className="w-full h-full" />
        </div>
    );
}
