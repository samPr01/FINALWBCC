"use client";

import { useUser } from "../contexts/UserContext";
import styles from "./Navigation.module.css";
import { ConnectButton } from "@rainbow-me/rainbowkit";

export default function Navigation() {
  const { userId, walletAddress } = useUser();

  return (
    <header className={styles.header}>
      <div className={styles.navLeft}>
        <a href="/" className={styles.navLink}>
          <div className={styles.logo}>WalletBase</div>
        </a>
        <nav className={styles.nav}>
          <a href="/market" className={styles.navLink}>
            Market
          </a>
          {/* <a href="/orders" className={styles.navLink}>
            Orders
          </a> */}
          <a href="/ai-trading" className={styles.navLink}>
            AI Trading
          </a>
          <a href="/settings" className={styles.navLink}>
            Settings
          </a>
        </nav>
      </div>

      <div className={styles.navRight}>
        <ConnectButton />
      </div>
    </header>
  );
}
