'use client';

import { useEffect, useRef, memo } from 'react';

interface TradingViewChartProps {
  symbol: string;
  interval?: string;
  theme?: 'light' | 'dark';
  height?: number;
}

declare global {
  interface Window {
    TradingView: {
      widget: new (config: Record<string, unknown>) => unknown;
    };
  }
}

function TradingViewChartComponent({ 
  symbol, 
  interval = '60',
  theme = 'dark',
  height = 500 
}: TradingViewChartProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const widgetRef = useRef<unknown>(null);
  const scriptLoadedRef = useRef(false);

  useEffect(() => {
    // Capture container reference at the start of the effect
    const container = containerRef.current;
    
    // Load TradingView script first if not loaded
    if (!window.TradingView && !scriptLoadedRef.current) {
      scriptLoadedRef.current = true;
      const script = document.createElement('script');
      script.src = 'https://s3.tradingview.com/tv.js';
      script.async = true;
      script.onerror = () => {
        console.error('Failed to load TradingView script');
        scriptLoadedRef.current = false;
      };
      document.head.appendChild(script);
      return;
    }

    // Wait for TradingView to be available
    if (!window.TradingView) return;

    // Create widget
    const createWidget = () => {
      if (!container) return;

      // Clear container content
      container.innerHTML = '';

      // Map interval to TradingView format
      const intervalMap: { [key: string]: string } = {
        '1': '1',
        '5': '5',
        '15': '15',
        '30': '30',
        '60': '60',
        '240': '240',
        '1440': 'D',
        '10080': 'W',
        '21600': 'M',
      };

      const tvInterval = intervalMap[interval] || '60';

      // Create new container div for widget
      const widgetContainer = document.createElement('div');
      widgetContainer.id = `tradingview-widget-${Date.now()}`;
      widgetContainer.style.height = '100%';
      widgetContainer.style.width = '100%';
      
      container.appendChild(widgetContainer);

      try {
        // Create TradingView widget
        widgetRef.current = new window.TradingView.widget({
          autosize: true,
          symbol: `KRAKEN:${symbol}`,
          interval: tvInterval,
          timezone: 'Etc/UTC',
          theme: theme,
          style: '1', // Candlestick
          locale: 'en',
          toolbar_bg: theme === 'dark' ? '#1e222d' : '#f1f3f6',
          enable_publishing: false,
          allow_symbol_change: false,
          save_image: false,
          container_id: widgetContainer.id,
          studies: [
            'Volume@tv-basicstudies',
          ],
          hide_side_toolbar: false,
          hide_top_toolbar: false,
          hide_legend: false,
          withdateranges: true,
          range: '12M',
          details: false,
          hotlist: false,
          calendar: false,
          show_popup_button: false,
          popup_width: '1000',
          popup_height: '650',
          disabled_features: [
            'use_localstorage_for_settings',
            'header_symbol_search',
            'header_compare',
            'display_market_status',
          ],
          enabled_features: [
            'hide_left_toolbar_by_default',
          ],
        });
      } catch (error) {
        console.error('Error creating TradingView widget:', error);
      }
    };

    // Create widget immediately
    createWidget();

    return () => {
      // Cleanup: clear the container
      if (container) {
        container.innerHTML = '';
      }
      widgetRef.current = null;
    };
  }, [symbol, interval, theme]);

  return (
    <div 
      ref={containerRef} 
      className="tradingview-widget-container"
      style={{ height: `${height}px`, width: '100%' }}
    />
  );
}

export const TradingViewChart = memo(TradingViewChartComponent);

