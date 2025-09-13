"use client";

import styles from "./settings.module.css";
import { useState, useEffect } from "react";
import { useUser } from "../../../contexts/UserContext";

export default function SettingsPage() {
  const { userId, walletAddress } = useUser();
  const [btcAddress, setBtcAddress] = useState("");
  const [settings, setSettings] = useState({
    profile: { username: "CryptoTrader", email: "trader@example.com" },
    security: { twoFactorEnabled: false, emailNotifications: true },
    appearance: { theme: "dark", compactMode: false },
  });

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch("/api/users");
        const data = await res.json();
        if (data?.success && Array.isArray(data.users) && userId) {
          const me = data.users.find((u) => u.id === userId);
          if (me?.btcAddress) setBtcAddress(me.btcAddress);
        }
      } catch {}
    };
    load();
  }, [userId]);

  const handleSaveSettings = async () => {
    try {
      if (userId) {
        await fetch("/api/users", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ userId, btcAddress }),
        });
      }
      alert("Settings saved successfully!");
    } catch {
      alert("Failed to save settings");
    }
  };

  return (
    <main className={styles.container}>
      {/* Profile Card */}
      <section className={styles.settingsCard}>
        <h2 className={styles.sectionTitle}>👤 Profile</h2>
        <div className={styles.formGroup}>
          <label>Username</label>
          <input
            type="text"
            value={settings.profile.username}
            className={styles.formInput}
          />
        </div>
        <div className={styles.formGroup}>
          <label>Email</label>
          <input
            type="email"
            value={settings.profile.email}
            className={styles.formInput}
          />
        </div>
        <div className={styles.formGroup}>
          <label>BTC Address</label>
          <input
            type="text"
            value={btcAddress}
            onChange={(e) => setBtcAddress(e.target.value)}
            placeholder="bc1..."
            className={styles.formInput}
          />
        </div>
        <button onClick={handleSaveSettings} className={styles.primaryButton}>
          Save Settings
        </button>
      </section>

      {/* Security Card */}
      <section className={styles.settingsCard}>
        <h2 className={styles.sectionTitle}>🔒 Security</h2>
        <div className={styles.formGroupCheckbox}>
          <input type="checkbox" checked={settings.security.twoFactorEnabled} />
          <span>Enable Two-Factor Authentication</span>
        </div>
        <div className={styles.formGroupCheckbox}>
          <input type="checkbox" checked={settings.security.emailNotifications} />
          <span>Email Notifications</span>
        </div>
      </section>

      {/* Appearance Card */}
      <section className={styles.settingsCard}>
        <h2 className={styles.sectionTitle}>🎨 Appearance</h2>
        <div className={styles.formGroup}>
          <label>Theme</label>
          <select value={settings.appearance.theme} className={styles.formInput}>
            <option value="dark">Dark</option>
            <option value="light">Light</option>
            <option value="auto">Auto</option>
          </select>
        </div>
        <div className={styles.formGroupCheckbox}>
          <input type="checkbox" checked={settings.appearance.compactMode} />
          <span>Compact Mode</span>
        </div>
      </section>
    </main>
  );
}
