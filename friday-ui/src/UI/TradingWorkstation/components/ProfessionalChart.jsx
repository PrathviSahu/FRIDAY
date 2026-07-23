import React, { useEffect, useRef } from 'react';

export default function ProfessionalChart({ symbol = 'FX:EURUSD', interval = '5' }) {
    const containerRef = useRef(null);
    const widgetRef = useRef(null);

    // Map internal symbol names to TradingView symbols if needed
    const getTvSymbol = (sym) => {
        if (!sym) return 'FX:EURUSD';
        if (sym === 'EURUSD') return 'FX:EURUSD';
        if (sym === 'GBPUSD') return 'FX:GBPUSD';
        if (sym === 'USDJPY') return 'FX:USDJPY';
        if (sym === 'XAUUSD') return 'OANDA:XAUUSD';
        if (sym === 'BTCUSD' || sym === 'BTCUSDT') return 'BINANCE:BTCUSDT';
        if (sym === 'NASDAQ' || sym === 'NAS100') return 'OANDA:NAS100USD';
        if (sym === 'DXY') return 'CAPITALCOM:DXY';
        return sym;
    };

    const tvSymbol = getTvSymbol(symbol);

    // Format interval for TradingView widget: '1', '5', '15', '30', '60', '240', 'D', 'W'
    const getTvInterval = (intv) => {
        if (!intv) return '5';
        if (intv === '1h' || intv === '60') return '60';
        if (intv === '4h' || intv === '240') return '240';
        if (intv === '1D' || intv === 'D') return 'D';
        if (intv === '1W' || intv === 'W') return 'W';
        return intv;
    };

    const tvInterval = getTvInterval(interval);

    useEffect(() => {
        const containerId = `tradingview_widget_${Math.random().toString(36).substring(2, 9)}`;

        if (containerRef.current) {
            containerRef.current.innerHTML = `<div id="${containerId}" style="width: 100%; height: 100%;" />`;
        }

        const initWidget = () => {
            if (!window.TradingView || !document.getElementById(containerId)) return;

            try {
                widgetRef.current = new window.TradingView.widget({
                    autosize: true,
                    symbol: tvSymbol,
                    interval: tvInterval,
                    timezone: 'Asia/Kolkata',
                    theme: 'dark',
                    style: '1',
                    locale: 'en',
                    toolbar_bg: '#131722',
                    enable_publishing: false,
                    hide_side_toolbar: false, // 🛠️ Full Left Drawing Toolbar (Trendlines, Fibs, Position Tools, Ruler, Brush)
                    allow_symbol_change: true,
                    details: false,
                    hotlist: false,
                    calendar: false,
                    show_popup_button: true,
                    popup_width: '1000',
                    popup_height: '650',
                    container_id: containerId,
                    backgroundColor: '#131722',
                    gridColor: 'rgba(42, 46, 57, 0.5)',
                    disabled_features: [
                        'widget_bar' // Disables inner details sidebar to prevent TypeError
                    ],
                    enabled_features: [
                        'header_widget',
                        'header_symbol_search',
                        'header_resolutions',
                        'header_chart_type',
                        'header_indicators',
                        'header_compare',
                        'header_undo_redo',
                        'study_templates',
                        'use_localstorage_for_settings',
                        'side_toolbar_in_fullscreen_mode',
                        'items_favoriting'
                    ],
                    overrides: {
                        "mainSeriesProperties.candleStyle.upColor": "#089981",
                        "mainSeriesProperties.candleStyle.downColor": "#f23645",
                        "mainSeriesProperties.candleStyle.drawWick": true,
                        "mainSeriesProperties.candleStyle.drawBorder": true,
                        "mainSeriesProperties.candleStyle.borderColor": "#089981",
                        "mainSeriesProperties.candleStyle.borderUpColor": "#089981",
                        "mainSeriesProperties.candleStyle.borderDownColor": "#f23645",
                        "mainSeriesProperties.candleStyle.wickUpColor": "#089981",
                        "mainSeriesProperties.candleStyle.wickDownColor": "#f23645",
                        "paneProperties.background": "#131722",
                        "paneProperties.vertGridProperties.color": "#1e222d",
                        "paneProperties.horzGridProperties.color": "#1e222d",
                    }
                });
            } catch (_) {}
        };

        if (window.TradingView) {
            initWidget();
        } else {
            const existingScript = document.getElementById('tradingview-tv-script');
            if (existingScript) {
                existingScript.addEventListener('load', initWidget);
            } else {
                const script = document.createElement('script');
                script.id = 'tradingview-tv-script';
                script.src = 'https://s3.tradingview.com/tv.js';
                script.async = true;
                script.onload = initWidget;
                document.head.appendChild(script);
            }
        }
    }, [tvSymbol, tvInterval]);

    return (
        <div className="w-full h-full relative bg-[#131722] overflow-hidden">
            <div ref={containerRef} className="w-full h-full" />
        </div>
    );
}
