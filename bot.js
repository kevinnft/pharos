const { ethers } = require("ethers");
const fs = require("fs");
const readlineSync = require("readline-sync");

const RPC = "https://testnet.dplabs-internal.com";
const provider = new ethers.JsonRpcProvider(RPC);

// --- Kontrak Faucet ---
const contractAddress = "0x0e29d74af0489f4b08fbfc774e25c0d3b5f43285"; 
const abiMint = [
  "function mint(address _asset, address _account, uint256 _amount)"
];
const asset = "0xa778b48339d3c6b4bc5a75b37c6ce210797076b1"; // TSLA token
const amountMint = ethers.parseUnits("100", 18);
const amountSend = ethers.parseUnits("0.01", 18);

// --- Lending Pool ---
const tslaToken = "0xa778b48339d3c6b4bc5a75b37c6ce210797076b1";
const lendingPool = "0x11d1ca4012d94846962bca2fbd58e5a27ddcbfc5";
const erc20Abi = [
  "function balanceOf(address) view returns (uint256)",
  "function allowance(address owner, address spender) view returns (uint256)",
  "function approve(address spender, uint256 amount) returns (bool)"
];
const poolAbi = [
  "function supply(address asset, uint256 amount, address onBehalfOf, uint16 referralCode)",
  "function borrow(address asset, uint256 amount, uint256 interestRateMode, uint16 referralCode, address onBehalfOf)"
];

// --- WPHRS (Wrapped Pharos) ---
const WPHRS = "0x3019b247381c850ab53dc0ee53bce7a07ea9155f";
const wphrsAbi = [
  "function balanceOf(address) view returns (uint256)",
  "function withdraw(uint256 wad)"
];

// --- File ---
const privateKeys = fs.readFileSync("wallets.txt", "utf-8")
  .split("\n").map(l => l.trim()).filter(Boolean);

let recipients = [];
if (fs.existsSync("addres.txt")) {
  recipients = fs.readFileSync("addres.txt", "utf-8")
    .split("\n").map(l => l.trim()).filter(Boolean);
}

// =============== AUTO MINT ==================
async function runMint(pvkey, recipient, index) {
  const wallet = new ethers.Wallet(pvkey, provider);
  const contract = new ethers.Contract(contractAddress, abiMint, wallet);

  console.log(`🚀 Wallet-${index} Mint started: ${wallet.address} → ${recipient}`);

  while (true) {
    try {
      const tx = await contract.mint(asset, recipient, amountMint);
      console.log(`Wallet-${index} | Tx sent: ${tx.hash}`);

      const receipt = await tx.wait();
      console.log(`✅ Wallet-${index} confirmed: ${receipt.hash}`);

      await new Promise(r => setTimeout(r, 5000));
    } catch (err) {
      console.error(`❌ Wallet-${index} error:`, err.message);
      await new Promise(r => setTimeout(r, 10000));
    }
  }
}

// =============== AUTO SEND ==================
async function runSend(pvkey, index) {
  const wallet = new ethers.Wallet(pvkey, provider);

  console.log(`🚀 Wallet-${index} Send started: ${wallet.address}`);

  for (let addr of recipients) {
    try {
      const tx = await wallet.sendTransaction({
        to: addr,
        value: amountSend,
        gasPrice: ethers.parseUnits("1", "gwei"),
        gasLimit: 21000
      });

      console.log(`Wallet-${index} | Sent 0.01 PHRS → ${addr} | Tx: ${tx.hash}`);
      const receipt = await tx.wait();
      console.log(`✅ Confirmed: ${receipt.hash}`);

      await new Promise(r => setTimeout(r, 3000));
    } catch (err) {
      console.error(`❌ Wallet-${index} error to ${addr}:`, err.message);
      await new Promise(r => setTimeout(r, 5000));
    }
  }
}

// =============== AUTO SUPPLY TSLA ==================
async function runSupply(pvkey, index) {
  const wallet = new ethers.Wallet(pvkey, provider);
  const tsla = new ethers.Contract(tslaToken, erc20Abi, wallet);
  const pool = new ethers.Contract(lendingPool, poolAbi, wallet);

  console.log(`🚀 Wallet-${index} Supply started: ${wallet.address}`);

  try {
    const balance = await tsla.balanceOf(wallet.address);
    if (balance === 0n) {
      console.log(`Wallet-${index} | No TSLA balance`);
      return;
    }
    console.log(`Wallet-${index} | TSLA Balance: ${ethers.formatUnits(balance, 18)}`);

    const allowance = await tsla.allowance(wallet.address, lendingPool);
    if (allowance < balance) {
      console.log(`Wallet-${index} | Approving TSLA...`);
      const txApprove = await tsla.approve(lendingPool, ethers.MaxUint256);
      await txApprove.wait();
      console.log(`✅ Wallet-${index} | Approved`);
    }

    console.log(`Wallet-${index} | Supplying ${ethers.formatUnits(balance, 18)} TSLA...`);
    const txSupply = await pool.supply(tslaToken, balance, wallet.address, 0);
    console.log(`Wallet-${index} | Tx sent: ${txSupply.hash}`);

    const receipt = await txSupply.wait();
    console.log(`✅ Wallet-${index} | Supplied: ${receipt.hash}`);
  } catch (err) {
    console.error(`❌ Wallet-${index} error:`, err.message);
  }
}

// =============== AUTO BORROW (1 WPHRS LOOP) ==================
async function runBorrow(pvkey, index) {
  const wallet = new ethers.Wallet(pvkey, provider);
  const pool = new ethers.Contract(lendingPool, poolAbi, wallet);

  console.log(`🚀 Wallet-${index} Borrow LOOP started: ${wallet.address}`);

  while (true) {
    try {
      const amount = ethers.parseUnits("1", 18); // borrow 1 WPHRS
      console.log(`Wallet-${index} | Borrowing 1 WPHRS...`);

      const tx = await pool.borrow(WPHRS, amount, 2, 0, wallet.address);
      console.log(`Wallet-${index} | Tx sent: ${tx.hash}`);

      const receipt = await tx.wait();
      console.log(`✅ Wallet-${index} | Borrowed: ${receipt.hash}`);

      // langsung lanjut loop tanpa delay
    } catch (err) {
      console.error(`❌ Wallet-${index} error:`, err.message);

      // kalau error, tunggu 20 detik baru coba lagi
      await new Promise(r => setTimeout(r, 5000));
    }
  }
}


// =============== AUTO UNWRAP (WPHRS → PHRS) ==================
async function runUnwrap(pvkey, index) {
  const wallet = new ethers.Wallet(pvkey, provider);
  const wphrs = new ethers.Contract(WPHRS, wphrsAbi, wallet);

  console.log(`🚀 Wallet-${index} Unwrap started: ${wallet.address}`);

  try {
    const bal = await wphrs.balanceOf(wallet.address);
    if (bal === 0n) {
      console.log(`Wallet-${index} | No WPHRS balance`);
      return;
    }

    console.log(`Wallet-${index} | Unwrapping ${ethers.formatUnits(bal, 18)} WPHRS...`);
    const tx = await wphrs.withdraw(bal);
    console.log(`Wallet-${index} | Tx sent: ${tx.hash}`);

    const receipt = await tx.wait();
    console.log(`✅ Wallet-${index} | Unwrapped: ${receipt.hash}`);
  } catch (err) {
    console.error(`❌ Wallet-${index} error:`, err.message);
  }
}

// =============== MAIN MENU ==================
async function main() {
  console.log("=== PHAROS BOT MENU ===");
  console.log("1. Auto Mint (multi-wallet loop)");
  console.log("2. Auto Send Native PHRS (0.01 PHRS ke addres.txt)");
  console.log("3. Auto Supply TSLA (approve + supply max)");
  console.log("4. Auto Borrow 1 WPHRS");
  console.log("5. Auto Unwrap WPHRS → PHRS");

  const choice = readlineSync.question("Pilih menu (1/2/3/4/5): ");

  if (choice === "1") {
    if (privateKeys.length !== recipients.length) {
      console.error("❌ jumlah wallets.txt dan addres.txt harus sama (1-1 mapping)");
      process.exit(1);
    }
    await Promise.all(
      privateKeys.map((pvkey, i) => runMint(pvkey, recipients[i], i + 1))
    );
  } else if (choice === "2") {
    if (!recipients.length) {
      console.error("❌ addres.txt kosong / tidak ada");
      process.exit(1);
    }
    await Promise.all(
      privateKeys.map((pvkey, i) => runSend(pvkey, i + 1))
    );
  } else if (choice === "3") {
    await Promise.all(
      privateKeys.map((pvkey, i) => runSupply(pvkey, i + 1))
    );
  } else if (choice === "4") {
    await Promise.all(
      privateKeys.map((pvkey, i) => runBorrow(pvkey, i + 1))
    );
  } else if (choice === "5") {
    await Promise.all(
      privateKeys.map((pvkey, i) => runUnwrap(pvkey, i + 1))
    );
  } else {
    console.log("Menu tidak valid!");
    process.exit(1);
  }
}

main();

