'use client';
import dynamic from 'next/dynamic';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import styles from './trade.module.css';

// Dynamic import to avoid SSR issues with ApexCharts
const Chart = dynamic(() => import('react-apexcharts'), { ssr: false });

export default function TradePage({ params }) {
  const { symbol } = params;
  const [series, setSeries] = useState([]);
  const [price, setPrice] = useState(null);
  const [interval, setIntervalState] = useState('1m');
  const [amount, setAmount] = useState(50);
  const [returnRate, setReturnRate] = useState(0.2);
  const [expectedReturn, setExpectedReturn] = useState(10);
  const [isConnected, setIsConnected] = useState(false);
  const [activeTrades, setActiveTrades] = useState([]);

  // WebSocket connection for live price data
  useEffect(() => {
    let ws;
    
    const connectWebSocket = () => {
      try {
        ws = new WebSocket(
          `wss://stream.binance.com:9443/ws/${symbol.toLowerCase()}usdt@kline_${interval}`
        );
        
        ws.onopen = () => {
          setIsConnected(true);
          console.log('WebSocket connected');
        };
        
        ws.onmessage = (event) => {
          const data = JSON.parse(event.data);
          if (data.k) {
            const candle = data.k;
            setSeries((prev) => {
              const newData = [...(prev[0]?.data || [])];
              newData.push({
                x: new Date(candle.t),
                y: [
                  parseFloat(candle.o),
                  parseFloat(candle.h),
                  parseFloat(candle.l),
                  parseFloat(candle.c),
                ],
              });
              return [{ data: newData.slice(-60) }];
            });
            setPrice(parseFloat(candle.c));
          }
        };
        
        ws.onclose = () => {
          setIsConnected(false);
          console.log('WebSocket disconnected');
        };
        
        ws.onerror = (error) => {
          console.error('WebSocket error:', error);
          setIsConnected(false);
        };
      } catch (error) {
        console.error('Failed to connect WebSocket:', error);
        setIsConnected(false);
      }
    };

    connectWebSocket();
    
    return () => {
      if (ws) {
        ws.close();
      }
    };
  }, [symbol, interval]);

  // Calculate expected return when amount or return rate changes
  useEffect(() => {
    setExpectedReturn(amount * returnRate);
  }, [amount, returnRate]);

  // Chart configuration
  const options = {
    chart: { 
      type: 'candlestick', 
      height: 400, 
      background: '#1a1a1a',
      toolbar: {
        show: true,
        tools: {
          download: true,
          selection: true,
          zoom: true,
          zoomin: true,
          zoomout: true,
          pan: true,
          reset: true
        }
      }
    },
    title: { 
      text: `${symbol}/USDT`, 
      align: 'left', 
      style: { color: '#fff', fontSize: '18px' } 
    },
    xaxis: { 
      type: 'datetime',
      labels: {
        style: {
          colors: '#888'
        }
      }
    },
    yaxis: { 
      tooltip: { enabled: true },
      labels: {
        style: {
          colors: '#888'
        }
      }
    },
    grid: {
      borderColor: '#333'
    },
    theme: {
      mode: 'dark'
    }
  };

  const durations = [
    { label: '60 Seconds', rate: 0.2 },
    { label: '120 Seconds', rate: 0.3 },
    { label: '180 Seconds', rate: 0.4 },
    { label: '360 Seconds', rate: 0.5 },
    { label: '7200 Seconds', rate: 0.6 },
    { label: '21600 Seconds', rate: 0.8 },
  ];

  const intervals = ['1m', '5m', '15m', '30m', '1h', '1d'];

  const handleTrade = (direction) => {
    const trade = {
      id: Date.now(),
      symbol,
      direction,
      amount,
      returnRate,
      expectedReturn,
      entryPrice: price,
      timestamp: new Date(),
      status: 'active'
    };
    
    setActiveTrades(prev => [...prev, trade]);
    
    // Simulate trade completion after duration
    setTimeout(() => {
      setActiveTrades(prev => 
        prev.map(t => 
          t.id === trade.id 
            ? { ...t, status: 'completed', result: Math.random() > 0.5 ? 'win' : 'loss' }
            : t
        )
      );
    }, 60000); // 1 minute for demo
  };

  return (
    <div className={styles.container}>
      {/* Header */}
      <div className={styles.header}>
        <div className={styles.headerLeft}>
          <Link href="/" className={styles.backButton}>
            ← Back to Home
          </Link>
          <h1 className={styles.title}>{symbol}/USDT</h1>
        </div>
        <div className={styles.headerRight}>
          <div className={styles.connectionStatus}>
            <span className={`${styles.statusDot} ${isConnected ? styles.connected : styles.disconnected}`}></span>
            {isConnected ? 'Connected' : 'Disconnected'}
          </div>
          <span className={styles.price}>
            {price ? `$${price.toFixed(4)}` : 'Loading...'}
          </span>
        </div>
      </div>

      {/* Chart Section */}
      <div className={styles.chartSection}>
        <div className={styles.intervalButtons}>
          {intervals.map((i) => (
            <button
              key={i}
              onClick={() => setIntervalState(i)}
              className={`${styles.intervalButton} ${interval === i ? styles.active : ''}`}
            >
              {i}
            </button>
          ))}
        </div>
        <div className={styles.chartContainer}>
          {typeof window !== 'undefined' && (
            <Chart 
              options={options} 
              series={series} 
              type="candlestick" 
              height={400} 
            />
          )}
        </div>
      </div>

      {/* Trade Panel */}
      <div className={styles.tradePanel}>
        <h2 className={styles.panelTitle}>Trade Panel</h2>
        
        {/* Duration Selection */}
        <div className={styles.durationGrid}>
          {durations.map((d) => (
            <button
              key={d.label}
              onClick={() => setReturnRate(d.rate)}
              className={`${styles.durationButton} ${returnRate === d.rate ? styles.selected : ''}`}
            >
              <div className={styles.durationLabel}>{d.label}</div>
              <div className={styles.returnRate}>{(d.rate * 100).toFixed(0)}% Return</div>
            </button>
          ))}
        </div>

        {/* Amount Input */}
        <div className={styles.inputGroup}>
          <label className={styles.label}>Amount ($)</label>
          <input
            type="number"
            value={amount}
            onChange={(e) => setAmount(Number(e.target.value))}
            className={styles.input}
            min="1"
            step="1"
          />
        </div>

        {/* Expected Return */}
        <div className={styles.inputGroup}>
          <label className={styles.label}>Expected Return</label>
          <div className={styles.returnDisplay}>
            ${expectedReturn.toFixed(2)}
          </div>
        </div>

        {/* Trade Buttons */}
        <div className={styles.tradeButtons}>
          <button 
            className={`${styles.tradeButton} ${styles.downButton}`}
            onClick={() => handleTrade('down')}
            disabled={!price || !isConnected}
          >
            <span className={styles.arrow}>↓</span>
            <span>Down</span>
          </button>
          <button 
            className={`${styles.tradeButton} ${styles.upButton}`}
            onClick={() => handleTrade('up')}
            disabled={!price || !isConnected}
          >
            <span className={styles.arrow}>↑</span>
            <span>Up</span>
          </button>
        </div>
      </div>

      {/* Active Trades */}
      <div className={styles.activeTradesSection}>
        <h2 className={styles.panelTitle}>Active Trades</h2>
        {activeTrades.length === 0 ? (
          <p className={styles.noTrades}>No trades yet. Place an Up or Down trade to get started.</p>
        ) : (
          <div className={styles.tradesList}>
            {activeTrades.map((trade) => (
              <div key={trade.id} className={styles.tradeItem}>
                <div className={styles.tradeInfo}>
                  <span className={styles.tradeSymbol}>{trade.symbol}</span>
                  <span className={`${styles.tradeDirection} ${trade.direction === 'up' ? styles.up : styles.down}`}>
                    {trade.direction.toUpperCase()}
                  </span>
                  <span className={styles.tradeAmount}>${trade.amount}</span>
                </div>
                <div className={styles.tradeStatus}>
                  <span className={`${styles.status} ${styles[trade.status]}`}>
                    {trade.status}
                  </span>
                  {trade.result && (
                    <span className={`${styles.result} ${styles[trade.result]}`}>
                      {trade.result}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
