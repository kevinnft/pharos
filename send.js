import { ethers } from "ethers";
import fs from "fs";

const RPC = "https://testnet.dplabs-internal.com";
const provider = new ethers.JsonRpcProvider(RPC);

const AMOUNT = ethers.parseUnits("0.01", 18); // 0.01 PHRS

// baca wallets.txt
const privateKeys = fs.readFileSync("wallets.txt", "utf-8")
  .split("\n")
  .map(line => line.trim())
  .filter(Boolean);

// baca addres.txt
const recipients = fs.readFileSync("addres.txt", "utf-8")
  .split("\n")
  .map(line => line.trim())
  .filter(Boolean);

async function sendFromWallet(pvkey, index) {
  const wallet = new ethers.Wallet(pvkey, provider);

  console.log(`🚀 Wallet-${index} started: ${wallet.address}`);

  for (let addr of recipients) {
    try {
      const tx = await wallet.sendTransaction({
        to: addr,
        value: AMOUNT,
        gasPrice: ethers.parseUnits("1", "gwei"), // default gasPrice
        gasLimit: 21000
      });

      console.log(`Wallet-${index} | Sent 0.01 PHRS → ${addr} | Tx: ${tx.hash}`);

      const receipt = await tx.wait();
      console.log(`✅ Confirmed: ${receipt.transactionHash}`);

      // delay antar transaksi biar aman
      await new Promise(r => setTimeout(r, 3000));
    } catch (err) {
      console.error(`❌ Wallet-${index} error to ${addr}:`, err.message);
      await new Promise(r => setTimeout(r, 5000));
    }
  }
}

async function main() {
  // jalan semua wallet paralel
  await Promise.all(
    privateKeys.map((pvkey, i) => sendFromWallet(pvkey, i + 1))
  );
}

main();
