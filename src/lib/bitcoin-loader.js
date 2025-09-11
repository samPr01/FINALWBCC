// Dynamic loader for Bitcoin libraries to handle WebAssembly modules
let bitcoin = null;
let ecc = null;
let bip32 = null;
let bip39 = null;

// Load Bitcoin libraries dynamically
export const loadBitcoinLibraries = async () => {
  if (bitcoin && ecc && bip32 && bip39) {
    return { bitcoin, ecc, bip32, bip39 };
  }

  try {
    // Dynamic imports to handle WebAssembly modules
    const [
      bitcoinModule,
      eccModule,
      bip32Module,
      bip39Module
    ] = await Promise.all([
      import('bitcoinjs-lib'),
      import('tiny-secp256k1'),
      import('bip32'),
      import('bip39')
    ]);

    bitcoin = bitcoinModule.default || bitcoinModule;
    ecc = eccModule.default || eccModule;
    bip32 = (bip32Module.BIP32Factory || bip32Module.default || bip32Module)(ecc);
    bip39 = bip39Module.default || bip39Module;

    // Initialize bitcoinjs-lib with secp256k1
    if (bitcoin.initEccLib) {
      bitcoin.initEccLib(ecc);
    }

    return { bitcoin, ecc, bip32, bip39 };
  } catch (error) {
    console.error('Error loading Bitcoin libraries:', error);
    throw new Error('Failed to load Bitcoin libraries. Please ensure your browser supports WebAssembly.');
  }
};

// Check if Bitcoin libraries are available
export const isBitcoinAvailable = () => {
  return !!(bitcoin && ecc && bip32 && bip39);
};

// Get loaded Bitcoin libraries
export const getBitcoinLibraries = () => {
  if (!isBitcoinAvailable()) {
    throw new Error('Bitcoin libraries not loaded. Call loadBitcoinLibraries() first.');
  }
  return { bitcoin, ecc, bip32, bip39 };
};

// Initialize Bitcoin libraries on module load
if (typeof window !== 'undefined') {
  // Only load in browser environment
  loadBitcoinLibraries().catch(console.warn);
}
