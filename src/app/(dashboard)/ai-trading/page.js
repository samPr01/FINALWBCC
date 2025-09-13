"use client";

import styles from "./ai-trading.module.css";
import { useState, useEffect } from "react";
import { useUser } from "../../../contexts/UserContext";
import {
  connectWallet,
  disconnectWallet,
  getProvider,
} from "../../../lib/wallet";
import { ethers } from "ethers";
import { fetchBTCBalance, isValidBTCAddress } from "../../../lib/bitcoin";

export default function AITradingPage() {
  const { userId, walletAddress, updateUser, clearUser } = useUser();
  const [isConnecting, setIsConnecting] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [balances, setBalances] = useState({ ETH: "0.0000", BTC: "0.00000000" });
  const [usdBalances, setUsdBalances] = useState({ ETH: 0, BTC: 0, total: 0 });
  const [lastPriceUpdate, setLastPriceUpdate] = useState(null);
  const [aiPredictions, setAiPredictions] = useState([]);
  const [tradingStrategies, setTradingStrategies] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showStrategyModal, setShowStrategyModal] = useState(false);
  const [strategyConfig, setStrategyConfig] = useState({
    name: "",
    riskLevel: "medium",
    investmentAmount: "",
    targetProfit: "",
    stopLoss: "",
  });

  // Update time every second
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Simulated AI data
  useEffect(() => {
    const predictions = [
      {
        id: 1,
        symbol: "BTC",
        name: "Bitcoin",
        currentPrice: 121496.76,
        predictedPrice: 125000.0,
        confidence: 85,
        timeframe: "24h",
        direction: "up",
        reasoning: "Strong technical indicators and institutional buying pressure",
      },
      {
        id: 2,
        symbol: "ETH",
        name: "Ethereum",
        currentPrice: 3248.19,
        predictedPrice: 3100.0,
        confidence: 72,
        timeframe: "24h",
        direction: "down",
        reasoning: "Market correction expected after recent rally",
      },
      {
        id: 3,
        symbol: "SOL",
        name: "Solana",
        currentPrice: 197.01,
        predictedPrice: 210.0,
        confidence: 78,
        timeframe: "24h",
        direction: "up",
        reasoning: "Positive momentum and growing DeFi adoption",
      },
    ];

    const strategies = [
      {
        id: 1,
        name: "Conservative Growth",
        description: "Low-risk strategy focusing on stable coins and blue-chip cryptocurrencies",
        riskLevel: "low",
        expectedReturn: "5-15%",
        minInvestment: 100,
        maxInvestment: 10000,
        active: true,
      },
      {
        id: 2,
        name: "Balanced Portfolio",
        description: "Medium-risk strategy with diversified crypto assets",
        riskLevel: "medium",
        expectedReturn: "15-30%",
        minInvestment: 500,
        maxInvestment: 50000,
        active: true,
      },
      {
        id: 3,
        name: "Aggressive Growth",
        description: "High-risk strategy targeting maximum returns through active trading",
        riskLevel: "high",
        expectedReturn: "30-60%",
        minInvestment: 1000,
        maxInvestment: 100000,
        active: false,
      },
    ];

    setAiPredictions(predictions);
    setTradingStrategies(strategies);
    setIsLoading(false);
  }, []);

  // Wallet + balance handling (unchanged)
  const calculateUSDBalances = () => {
    const ethPrice = 3248.19;
    const btcPrice = 121496.76;
    const ethValue = parseFloat(balances.ETH) * ethPrice;
    const btcValue = parseFloat(balances.BTC) * btcPrice;
    setUsdBalances({ ETH: ethValue, BTC: btcValue, total: ethValue + btcValue });
    setLastPriceUpdate(new Date());
  };

  useEffect(() => { calculateUSDBalances(); }, [balances]);
  useEffect(() => {
    const priceInterval = setInterval(calculateUSDBalances, 300000);
    return () => clearInterval(priceInterval);
  }, []);

  const handleConnect = async () => {
    if (isConnecting) return;
    setIsConnecting(true);
    try {
      const address = await connectWallet();
      if (address) {
        updateUser(`AI_${Date.now()}`, address);
      }
    } catch (error) {
      alert(error.message.includes("MetaMask") ? "Please install MetaMask first." : "Connection failed");
    } finally {
      setIsConnecting(false);
    }
  };

  const handleDisconnect = () => {
    disconnectWallet();
    clearUser();
    setBalances({ ETH: "0.0000", BTC: "0.00000000" });
  };

  const handleCreateStrategy = () => {
    if (!walletAddress || !strategyConfig.name || !strategyConfig.investmentAmount) {
      alert("Please complete all required fields and connect your wallet.");
      return;
    }
    setTradingStrategies((prev) => [
      ...prev,
      { id: Date.now(), ...strategyConfig, active: false, createdAt: new Date().toISOString() },
    ]);
    setShowStrategyModal(false);
    setStrategyConfig({ name: "", riskLevel: "medium", investmentAmount: "", targetProfit: "", stopLoss: "" });
  };

  const handleActivateStrategy = (strategyId) => {
    setTradingStrategies((prev) =>
      prev.map((s) => (s.id === strategyId ? { ...s, active: !s.active } : s))
    );
  };

  const formatPrice = (price) => {
    if (price >= 1000)
      return price.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    if (price >= 1) return price.toFixed(2);
    if (price >= 0.01) return price.toFixed(4);
    return price.toFixed(6);
  };

  return (
    <main className={styles.container}>
      {/* Wallet Connection */}
      {!walletAddress ? (
        <section className={styles.walletSection}>
          <div className={styles.walletCard}>
            <h2>🔗 Connect Your Wallet</h2>
            <p>Connect your Web3 wallet to access AI trading features</p>
            <button className={styles.primaryButton} onClick={handleConnect} disabled={isConnecting}>
              {isConnecting ? "Connecting..." : "Connect Wallet"}
            </button>
          </div>
        </section>
      ) : (
        <section className={styles.walletSection}>
          <div className={styles.walletCard}>
            <div className={styles.walletHeader}>
              <span>{userId ? `User ID: ${userId}` : "User ID: Loading..."}</span>
              <div className={styles.welcomeText}>
                Welcome! {currentTime.toLocaleDateString("en-US")} {currentTime.toLocaleTimeString("en-US")}
              </div>
            </div>
            <div className={styles.walletBalance}>
              <div className={styles.totalUSD}>
                Total Portfolio Value: <span>${usdBalances.total?.toFixed(2) || "0.00"}</span>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Predictions */}
      {walletAddress && (
        <section className={styles.predictionsSection}>
          <h3>🎯 AI Market Predictions</h3>
          {isLoading ? (
            <div className={styles.loading}>Loading AI predictions...</div>
          ) : (
            <div className={styles.predictionsList}>
              {aiPredictions.map((p) => (
                <div key={p.id} className={styles.predictionItem}>
                  <div>
                    <strong>{p.symbol}</strong> – {p.name}
                    <div>Current: ${formatPrice(p.currentPrice)}</div>
                    <div>Predicted: ${formatPrice(p.predictedPrice)}</div>
                  </div>
                  <button className={styles.tradeButton}>Trade {p.symbol}</button>
                </div>
              ))}
            </div>
          )}
        </section>
      )}

      {/* Strategies */}
      {walletAddress && (
        <section className={styles.strategiesSection}>
          <h3>📊 Trading Strategies</h3>
          <button className={styles.createStrategyButton} onClick={() => setShowStrategyModal(true)}>
            + Create Strategy
          </button>
          <div className={styles.strategiesList}>
            {tradingStrategies.map((s) => (
              <div key={s.id} className={styles.strategyItem}>
                <div>
                  <strong>{s.name}</strong> ({s.riskLevel.toUpperCase()})<br />
                  Return: {s.expectedReturn} | Invest: ${s.minInvestment} - ${s.maxInvestment}
                </div>
                <button
                  className={`${styles.activateButton} ${s.active ? styles.deactivate : ""}`}
                  onClick={() => handleActivateStrategy(s.id)}
                >
                  {s.active ? "Deactivate" : "Activate"}
                </button>
              </div>
            ))}
          </div>
        </section>
      )}
    </main>
  );
}
