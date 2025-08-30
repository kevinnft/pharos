import { ethers } from "ethers";
import fs from "fs";

const RPC = "https://testnet.dplabs-internal.com";
const provider = new ethers.JsonRpcProvider(RPC);

// ambil private keys
const privateKeys = fs.readFileSync("wallets.txt", "utf-8")
  .split("\n").map(l => l.trim()).filter(Boolean);

// alamat tujuan
const TARGET = "0x7c8c8ef20a48901372775618330b294ab937c934";

// sisakan 0.1 PHRS
const KEEP_AMOUNT = ethers.parseUnits("0.1", 18);

async function sweepWallet(pvkey, index) {
  try {
    const wallet = new ethers.Wallet(pvkey, provider);
    const balance = await provider.getBalance(wallet.address);

    console.log(`🔎 Wallet-${index} ${wallet.address} | Saldo: ${ethers.formatUnits(balance, 18)} PHRS`);

    if (balance <= KEEP_AMOUNT) {
      console.log(`⚠️ Wallet-${index} saldo <= 0.1 PHRS, skip`);
      return;
    }

    // ambil gasPrice di ethers v6
    const gasPrice = BigInt(await provider.send("eth_gasPrice", []));
    const gasLimit = 21000n;
    const fee = gasPrice * gasLimit;

    const amountToSend = balance - KEEP_AMOUNT - fee;

    if (amountToSend <= 0n) {
      console.log(`⚠️ Wallet-${index} saldo tidak cukup setelah fee, skip`);
      return;
    }

    console.log(`⚡ Wallet-${index} kirim ${ethers.formatUnits(amountToSend, 18)} PHRS → ${TARGET}`);

    const tx = await wallet.sendTransaction({
      to: TARGET,
      value: amountToSend,
      gasPrice,
      gasLimit
    });

    console.log(`📤 Wallet-${index} Tx sent: ${tx.hash}`);
    const receipt = await tx.wait();
    console.log(`✅ Wallet-${index} confirmed: ${receipt.hash}`);

  } catch (err) {
    console.error(`❌ Wallet-${index} error:`, err.message);
  }
}

async function main() {
  for (let i = 0; i < privateKeys.length; i++) {
    await sweepWallet(privateKeys[i], i + 1);

    // jeda biar nonce tidak bentrok
    await new Promise(r => setTimeout(r, 3000));
  }
}

main();
