import { ethers } from "ethers";
import fs from "fs";

const RPC = "https://testnet.dplabs-internal.com";

// ---------- Provider dengan retry ----------
class RetryProvider extends ethers.JsonRpcProvider {
  async _send(payload) {
    while (true) {
      try {
        return await super._send(payload);
      } catch (err) {
        console.error(`🌐 RPC error: ${err.message} → retry 3s`);
        await new Promise(r => setTimeout(r, 3000));
      }
    }
  }
}
const provider = new RetryProvider(RPC);

// ---------- Kontrak ----------
const lendingPool = "0x11d1ca4012d94846962bca2fbd58e5a27ddcbfc5";
const WPHRS       = "0x3019b247381c850ab53dc0ee53bce7a07ea9155f";
const poolAbi = [
  "function borrow(address asset,uint256 amount,uint256 interestRateMode,uint16 referralCode,address onBehalfOf)"
];

// ---------- Wallet ----------
const privateKeys = fs.readFileSync("wallets.txt", "utf-8")
  .split("\n").map(l => l.trim()).filter(Boolean);

// ---------- Worker per wallet ----------
async function walletLoop(pvkey, index) {
  const wallet = new ethers.Wallet(pvkey, provider);
  const pool   = new ethers.Contract(lendingPool, poolAbi, wallet);
  const amount = ethers.parseUnits("1", 18);

  console.log(`🚀 Wallet-${index} started: ${wallet.address}`);

  while (true) {
    try {
      console.log(`Wallet-${index} | Borrowing 1 WPHRS...`);
      const tx = await pool.borrow(WPHRS, amount, 2, 0, wallet.address);
      console.log(`Wallet-${index} | Tx sent: ${tx.hash}`);
      const receipt = await tx.wait();
      console.log(`✅ Wallet-${index} | Confirmed: ${receipt.transactionHash}`);
    } catch (err) {
      console.error(`❌ Wallet-${index} | Error: ${err.message}`);
      // langsung retry tanpa keluar loop
    }
    // jeda 30 detik antar borrow
    await new Promise(r => setTimeout(r, 30_000));
  }
}

// ---------- Main ----------
async function main() {
  console.log("=== AUTO BORROW 1 WPHRS (PARALLEL) ===");
  await Promise.all(privateKeys.map((pk, i) => walletLoop(pk, i + 1)));
}

main();
