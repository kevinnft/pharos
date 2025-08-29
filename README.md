# 🚀 PHAROS BOT

Bot otomatis untuk farming di **Pharos Testnet**.  
Mendukung banyak wallet sekaligus (multi-wallet parallel).  

## ✨ Fitur
- **Auto Mint** → claim faucet token TSLA otomatis.
- **Auto Send** → kirim 0.01 PHRS native ke daftar address (`addres.txt`).
- **Auto Supply** → approve & supply semua balance TSLA ke Lending Pool.
- **Auto Borrow (Loop)** → borrow 1 WPHRS per wallet secara nonstop (langsung setelah tx konfirmasi).
- **Auto Unwrap** → konversi WPHRS → PHRS native otomatis.

## 📂 Struktur File
- `wallets.txt` → daftar private key (1 baris = 1 wallet).
- `addres.txt` → daftar alamat tujuan (1 baris = 1 address).
- `bot.js` → script utama (menu CLI interaktif).

## ⚡ Instalasi
1. Clone repo:
   ```bash
   git clone https://github.com/username/pharos-bot.git
   cd pharos-bot
   ```

2. Install dependency:
   ```bash
   npm install ethers readline-sync
   ```

3. Siapkan file:
   - `wallets.txt` → isi private keys
   - `addres.txt` → isi address tujuan (untuk fitur send & mint)

## ▶️ Cara Pakai
Jalankan:
```bash
node bot.js
```

Pilih menu sesuai kebutuhan:
```
=== PHAROS BOT MENU ===
1. Auto Mint (multi-wallet loop)
2. Auto Send Native PHRS (0.01 PHRS ke addres.txt)
3. Auto Supply TSLA (approve + supply max)
4. Auto Borrow 1 WPHRS (loop setelah konfirmasi)
5. Auto Unwrap WPHRS → PHRS
```

## ⚠️ Warning
- Gunakan di **testnet** saja!  
- Auto Borrow akan **loop tanpa henti** → bisa bikin health factor drop dan risk liquidation.  
- Simpan private keys dengan aman, **jangan dipakai untuk wallet utama**.

## 🛠 Teknologi
- [ethers.js](https://docs.ethers.org/)  
- Node.js  
- readline-sync (CLI interaktif)  

## 📜 Lisensi
MIT License © 2025
