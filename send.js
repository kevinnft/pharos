import { ethers } from "ethers";
import fs from "fs";
import readlineSync from "readline-sync";
import chalk from "chalk";

const RPC = "https://testnet.dplabs-internal.com";
const provider = new ethers.JsonRpcProvider(RPC);

// --- Load Wallets ---
const privateKeys = fs.readFileSync("wallets.txt", "utf-8")
  .split("\n").map(l => l.trim()).filter(Boolean);

// --- Config ---
const KEEP_AMOUNT = ethers.parseUnits("0.1", 18);
const SEND_AMOUNT = ethers.parseUnits("0.1", 18);
const TARGET = "0x7c8c8ef20a48901372775618330b294ab937c934";

// --- Utils ---
async function getGas() {
  const gasPrice = BigInt(await provider.send("eth_gasPrice", []));
  return { gasPrice, gasLimit: 21000n, fee: gasPrice * 21000n };
}

// =============== MENU 1: Topup 0.1 PHRS jika saldo < 0.1 ==================
async function topupWallets() {
  const mainWallet = new ethers.Wallet(privateKeys[0], provider);

  for (let i = 0; i < privateKeys.length; i++) {
    const wallet = new ethers.Wallet(privateKeys[i], provider);
    const balance = await provider.getBalance(wallet.address);
    console.log(chalk.yellow(`🔎 Cek saldo ${wallet.address}: ${ethers.formatUnits(balance, 18)} PHRS`));

    if (balance < KEEP_AMOUNT) {
      console.log(chalk.red(`⚡ Saldo kurang dari 0.1 PHRS → kirim 0.1 dari wallet utama`));
      try {
        const { gasPrice, gasLimit, fee } = await getGas();
        const tx = await mainWallet.sendTransaction({
          to: wallet.address,
          value: SEND_AMOUNT,
          gasPrice,
          gasLimit
        });
        console.log(chalk.cyan(`Tx sent: ${tx.hash}`));
        const receipt = await tx.wait();
        console.log(chalk.green(`✅ Confirmed: ${receipt.hash}`));
      } catch (err) {
        console.error(chalk.red(`❌ Error kirim: ${err.message}`));
      }
    } else {
      console.log(chalk.green(`✅ ${wallet.address} sudah punya saldo >= 0.1, skip`));
    }
  }
}

// =============== MENU 2: Sweep saldo ke TARGET (sisakan 0.1) ==================
async function sweepWallets() {
  for (let i = 0; i < privateKeys.length; i++) {
    const wallet = new ethers.Wallet(privateKeys[i], provider);
    const balance = await provider.getBalance(wallet.address);
    console.log(chalk.yellow(`🔎 Wallet-${i + 1} ${wallet.address} | Saldo: ${ethers.formatUnits(balance, 18)} PHRS`));

    if (balance <= KEEP_AMOUNT) {
      console.log(chalk.red(`⚠️ Saldo <= 0.1 PHRS, skip`));
      continue;
    }

    try {
      const { gasPrice, gasLimit, fee } = await getGas();
      const amountToSend = balance - KEEP_AMOUNT - fee;

      if (amountToSend <= 0n) {
        console.log(chalk.red(`⚠️ Saldo tidak cukup setelah fee, skip`));
        continue;
      }

      console.log(chalk.cyan(`⚡ Kirim ${ethers.formatUnits(amountToSend, 18)} PHRS → ${TARGET}`));
      const tx = await wallet.sendTransaction({
        to: TARGET,
        value: amountToSend,
        gasPrice,
        gasLimit
      });

      console.log(chalk.cyan(`Tx sent: ${tx.hash}`));
      const receipt = await tx.wait();
      console.log(chalk.green(`✅ Confirmed: ${receipt.hash}`));

      await new Promise(r => setTimeout(r, 2000)); // delay antar wallet
    } catch (err) {
      console.error(chalk.red(`❌ Error: ${err.message}`));
    }
  }
}

// ================= MAIN MENU =================
async function main() {
  console.log(chalk.blue.bold("=== PHAROS BOT MENU ==="));
  console.log(chalk.green("1.") + " Auto Topup 0.1 PHRS ke wallet saldo < 0.1");
  console.log(chalk.green("2.") + " Sweep semua saldo → sisakan 0.1, kirim ke target");

  const choice = readlineSync.question("Pilih menu (1/2): ");

  if (choice === "1") {
    await topupWallets();
  } else if (choice === "2") {
    await sweepWallets();
  } else {
    console.log(chalk.red("❌ Menu tidak valid!"));
  }
}

main();

