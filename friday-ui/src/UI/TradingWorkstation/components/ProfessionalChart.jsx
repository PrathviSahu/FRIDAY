import React, { useEffect, useRef } from 'react';

// Default Indian Stock Watchlist symbols matching user's exact TradingView layout
const DEFAULT_INDIAN_WATCHLIST = [
    'NSE:NIFTY',
    'NSE:BANKNIFTY',
    'NSE:RELIANCE',
    'NSE:TCS',
    'NSE:INFY',
    'NSE:HDFCBANK',
    'NSE:ICICIBANK',
    'NSE:SBIN',
    'NSE:TATAMOTORS',
    'NSE:TATASTEEL',
    'NSE:BHARTIARTL',
    'NSE:ITC',
    'NSE:LIKHITH',
    'NSE:DBOL',
    'NSE:TITAGARH',
    'NSE:BLACKBOX',
    'NSE:OMAXAUTO',
    'NSE:HINDALCO',
    'NSE:GEMAR',
    'NSE:AEQUS',
    'OANDA:XAUUSD',
    'BINANCE:BTCUSDT',
];

export default function ProfessionalChart() {
    const containerRef = useRef(null);

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
                    symbol: 'NSE:NIFTY',
                    interval: '5',
                    timezone: 'Asia/Kolkata',
                    theme: 'dark',
                    style: '1',
                    locale: 'in',
                    toolbar_bg: '#131722',
                    enable_publishing: true,
                    hide_side_toolbar: false, // Left drawing tools (Trendlines, Fibs, Position tools)
                    allow_symbol_change: true, // Native symbol search & add to watchlist
                    watchlist: DEFAULT_INDIAN_WATCHLIST, // Custom Indian stock market watchlist
                    details: true, // Native detail panel (Bid/Ask, Spread, Volume)
                    hotlist: true,
                    calendar: true,
                    show_popup_button: true,
                    popup_width: '1000',
                    popup_height: '650',
                    container_id: 'tradingview_widget_container',
                    backgroundColor: '#131722',
                    gridColor: 'rgba(30, 41, 59, 0.3)',
                });
            }
        };

        containerRef.current.appendChild(script);
    }, []);

    return (
        <div className="flex-1 w-full h-full bg-[#131722] relative overflow-hidden">
            <div id="tradingview_widget_container" ref={containerRef} className="w-full h-full" />
        </div>
    );
}
