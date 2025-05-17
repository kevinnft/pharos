import os
import random
from datetime import datetime
from web3 import Web3
from eth_account import Account
from eth_account.messages import encode_defunct
import requests
from fake_useragent import UserAgent
from urllib.parse import urlparse
import json
from rich.console import Console
from rich.panel import Panel
from rich.table import Table
from rich.text import Text

# Inisialisasi konsol rich untuk antarmuka pengguna
console = Console()

# Kode warna yang ditingkatkan untuk output konsol dengan palet yang hidup
class Colors:
    RESET = '\033[0m'
    CYAN = '\033[38;2;0;255;255m'    # Sian Terang
    GREEN = '\033[38;2;0;255;128m'   # Hijau Neon
    YELLOW = '\033[38;2;255;255;0m'  # Kuning Cerah
    RED = '\033[38;2;255;69;0m'      # Merah Terang
    WHITE = '\033[38;2;255;255;255m' # Putih Murni
    PURPLE = '\033[38;2;147;112;219m' # Ungu Lembut
    BLUE = '\033[38;2;30;144;255m'   # Biru Dodger
    BOLD = '\033[1m'
    UNDERLINE = '\033[4m'

# Kelas Logger yang ditingkatkan dengan emoji, tabel, dan panel rich
class Logger:
    @staticmethod
    def info(msg):
        console.print(Panel(
            Text(f"ℹ️  {msg}", style="bold blue"),
            style="blue",
            border_style="bold blue",
            padding=(0, 1)
        ))
    
    @staticmethod
    def wallet(msg):
        console.print(Panel(
            Text(f"👛 {msg}", style="bold yellow"),
            style="yellow",
            border_style="bold yellow",
            padding=(0, 1)
        ))
    
    @staticmethod
    def warn(msg):
        console.print(Panel(
            Text(f"⚠️  {msg}", style="bold yellow"),
            style="yellow",
            border_style="bold yellow",
            padding=(0, 1)
        ))
    
    @staticmethod
    def error(msg):
        console.print(Panel(
            Text(f"❌ {msg}", style="bold red"),
            style="red",
            border_style="bold red",
            padding=(0, 1)
        ))
    
    @staticmethod
    def success(msg):
        console.print(Panel(
            Text(f"✅ {msg}", style="bold green"),
            style="green",
            border_style="bold green",
            padding=(0, 1)
        ))
    
    @staticmethod
    def loading(msg):
        console.print(Panel(
            Text(f"⏳ {msg}", style="bold cyan"),
            style="cyan",
            border_style="bold cyan",
            padding=(0, 1)
        ))
    
    @staticmethod
    def step(msg):
        console.print(Panel(
            Text(f"➡️ {msg}", style="bold purple"),
            style="purple",
            border_style="bold purple",
            padding=(0, 1)
        ))
    
    @staticmethod
    def banner():
        table = Table(title="🌌 Pharos Auto Faucet 🌟", style="cyan", border_style="bold cyan")
        table.add_column("Properti", style="magenta", justify="left")
        table.add_column("Nilai", style="green", justify="left")
        table.add_row("Jaringan", NETWORK_CONFIG['name'])
        table.add_row("ID Rantai", str(NETWORK_CONFIG['chainId']))
        table.add_row("URL RPC", NETWORK_CONFIG['rpcUrl'])
        table.add_row("Mata Uang", NETWORK_CONFIG['currencySymbol'])
        table.add_row("Telegram", "https://t.me/airdropdxns")
        console.print(Panel(
            table,
            style="cyan",
            border_style="bold cyan",
            padding=(1, 2)
        ))

# Konfigurasi jaringan
NETWORK_CONFIG = {
    'name': 'Pharos Testnet',
    'chainId': 688688,
    'rpcUrl': 'https://api.zan.top/node/v1/pharos/testnet/1761472bf26745488907477d23719fb5',
    'currencySymbol': 'PHRS'
}

def load_proxies():
    try:
        with open('proxy.txt', 'r') as f:
            proxies = [line.strip() for line in f if line.strip()]
            Logger.info(f"📡 Memuat {len(proxies)} proxy")
            return proxies
    except FileNotFoundError:
        Logger.warn('🚫 File proxy.txt tidak ditemukan, beralih ke mode langsung')
        return []

def load_private_keys():
    try:
        with open('pvkey.txt', 'r') as f:
            private_keys = [line.strip() for line in f if line.strip()]
            Logger.info(f"🔑 Memuat {len(private_keys)} kunci pribadi")
            return private_keys
    except FileNotFoundError:
        Logger.warn('🚫 File pvkey.txt tidak ditemukan')
        return []

def load_receiver_address():
    try:
        with open('receiver.txt', 'r') as f:
            address = f.readline().strip()
            if not Web3.is_address(address):
                Logger.error(f"Alamat penerima tidak valid di receiver.txt: {address}")
                return None
            return Web3.to_checksum_address(address)
    except FileNotFoundError:
        Logger.warn('🚫 File receiver.txt tidak ditemukan')
        return None
    except Exception as e:
        Logger.error(f"Gagal memuat alamat penerima: {str(e)}")
        return None

def get_random_proxy(proxies):
    return random.choice(proxies) if proxies else None

def setup_provider(proxy=None):
    if proxy:
        Logger.info(f"🛡️ Menggunakan proxy: {proxy}")
        session = requests.Session()
        session.proxies = {
            'http': proxy,
            'https': proxy
        }
        return Web3(Web3.HTTPProvider(NETWORK_CONFIG['rpcUrl'], session=session))
    else:
        Logger.info('🌐 Menggunakan mode langsung (tanpa proxy)')
        return Web3(Web3.HTTPProvider(NETWORK_CONFIG['rpcUrl']))

async def claim_faucet(wallet, wallet_address, proxy=None):
    try:
        Logger.step(f"🔍 Memeriksa kelayakan faucet untuk dompet: {wallet_address}")

        message = "pharos"
        signable_message = encode_defunct(text=message)
        signed_message = wallet.sign_message(signable_message)
        signature = signed_message.signature.hex()
        Logger.step(f"✍️ Pesan ditandatangani: {signature}")

        login_url = f"https://api.pharosnetwork.xyz/user/login?address={wallet_address}&signature={signature}&invite_code=S6NGMzXSCDBxhnwo"
        
        headers = {
            "accept": "application/json, text/plain, */*",
            "accept-language": "en-US,en;q=0.8",
            "authorization": "Bearer null",
            "sec-ch-ua": '"Chromium";v="136", "Brave";v="136", "Not.A/Brand";v="99"',
            "sec-ch-ua-mobile": "?0",
            "sec-ch-ua-platform": '"Windows"',
            "sec-fetch-dest": "empty",
            "sec-fetch-mode": "cors",
            "sec-fetch-site": "same-site",
            "sec-gpc": "1",
            "Referer": "https://testnet.pharosnetwork.xyz/",
            "Referrer-Policy": "strict-origin-when-cross-origin",
            "User-Agent": UserAgent().random
        }

        session = requests.Session()
        if proxy:
            session.proxies = {
                'http': proxy,
                'https': proxy
            }

        Logger.loading('🚀 Mengirim permintaan login untuk faucet')
        login_response = session.post(login_url, headers=headers)
        login_response.raise_for_status()
        login_data = login_response.json()

        if login_data.get('code') != 0 or not login_data.get('data', {}).get('jwt'):
            Logger.error(f"🔐 Login faucet gagal: {login_data.get('msg', 'Kesalahan tidak diketahui')}")
            return False

        jwt = login_data['data']['jwt']
        Logger.success(f"🔓 Login faucet berhasil, Token: {jwt}")

        status_url = f"https://api.pharosnetwork.xyz/faucet/status?address={wallet_address}"
        status_headers = {
            **headers,
            "authorization": f"Bearer {jwt}"
        }

        Logger.loading('⏰ Memeriksa status faucet')
        status_response = session.get(status_url, headers=status_headers)
        status_response.raise_for_status()
        status_data = status_response.json()

        if status_data.get('code') != 0 or not status_data.get('data'):
            Logger.error(f"🚨 Pemeriksaan status faucet gagal: {status_data.get('msg', 'Kesalahan tidak diketahui')}")
            return False

        if not status_data['data'].get('is_able_to_faucet'):
            next_available = datetime.fromtimestamp(
                status_data['data']['avaliable_timestamp']
            ).strftime('%Y-%m-%d %H:%M:%S')
            Logger.warn(f"⏳ Faucet tidak tersedia hingga: {next_available}")
            return False

        claim_url = f"https://api.pharosnetwork.xyz/faucet/daily?address={wallet_address}"
        Logger.loading('💰 Mengklaim faucet')
        claim_response = session.post(claim_url, headers=status_headers)
        claim_response.raise_for_status()
        claim_data = claim_response.json()

        if claim_data.get('code') == 0:
            Logger.success(f"🎉 Faucet berhasil diklaim untuk {wallet_address}")
            return True
        else:
            Logger.error(f"❌ Klaim faucet gagal: {claim_data.get('msg', 'Kesalahan tidak diketahui')}")
            return False

    except Exception as error:
        Logger.error(f"💥 Klaim faucet gagal untuk {wallet_address}: {str(error)}")
        return False

async def perform_check_in(wallet, wallet_address, proxy=None):
    try:
        Logger.step(f"📅 Melakukan check-in harian untuk dompet: {wallet_address}")

        message = "pharos"
        signable_message = encode_defunct(text=message)
        signed_message = wallet.sign_message(signable_message)
        signature = signed_message.signature.hex()
        Logger.step(f"✍️ Pesan ditandatangani: {signature}")

        login_url = f"https://api.pharosnetwork.xyz/user/login?address={wallet_address}&signature={signature}&invite_code=S6NGMzXSCDBxhnwo"
        
        headers = {
            "accept": "application/json, text/plain, */*",
            "accept-language": "en-US,en;q=0.8",
            "authorization": "Bearer null",
            "sec-ch-ua": '"Chromium";v="136", "Brave";v="136", "Not.A/Brand";v="99"',
            "sec-ch-ua-mobile": "?0",
            "sec-ch-ua-platform": '"Windows"',
            "sec-fetch-dest": "empty",
            "sec-fetch-mode": "cors",
            "sec-fetch-site": "same-site",
            "sec-gpc": "1",
            "Referer": "https://testnet.pharosnetwork.xyz/",
            "Referrer-Policy": "strict-origin-when-cross-origin",
            "User-Agent": UserAgent().random
        }

        session = requests.Session()
        if proxy:
            session.proxies = {
                'http': proxy,
                'https': proxy
            }

        Logger.loading('🔑 Mengirim permintaan login')
        login_response = session.post(login_url, headers=headers)
        login_response.raise_for_status()
        login_data = login_response.json()

        if login_data.get('code') != 0 or not login_data.get('data', {}).get('jwt'):
            Logger.error(f"🔐 Login gagal: {login_data.get('msg', 'Kesalahan tidak diketahui')}")
            return False

        jwt = login_data['data']['jwt']
        Logger.success(f"🔓 Login berhasil, Token: {jwt}")

        check_in_url = f"https://api.pharosnetwork.xyz/sign/in?address={wallet_address}"
        check_in_headers = {
            **headers,
            "authorization": f"Bearer {jwt}"
        }

        Logger.loading('📬 Mengirim permintaan check-in')
        check_in_response = session.post(check_in_url, headers=check_in_headers)
        check_in_response.raise_for_status()
        check_in_data = check_in_response.json()

        if check_in_data.get('code') == 0:
            Logger.success(f"🥳 Check-in berhasil untuk {wallet_address}")
            return True
        else:
            Logger.warn(f"⚠️ Check-in gagal, mungkin sudah check-in: {check_in_data.get('msg', 'Kesalahan tidak diketahui')}")
            return False

    except Exception as error:
        Logger.error(f"💥 Check-in gagal untuk {wallet_address}: {str(error)}")
        return False

async def transfer_phrs(wallet, wallet_address, receiver_address, provider, proxy=None):
    try:
        Logger.step(f"Mempersiapkan transfer PHRS dari {wallet_address} ke {receiver_address}")

        # Mendapatkan saldo
        balance_wei = provider.eth.get_balance(wallet_address)
        balance_eth = Web3.from_wei(balance_wei, 'ether')
        Logger.info(f"Saldo saat ini: {balance_eth} PHRS")

        if balance_wei < Web3.to_wei(0.0001, 'ether'):
            Logger.warn(f"Melewati transfer: Saldo PHRS tidak cukup: {balance_eth} PHRS")
            return False

        # Estimasi gas
        gas_limit = 21000  # Batas gas standar untuk transfer sederhana
        gas_price = provider.eth.gas_price
        gas_cost = gas_limit * gas_price

        # Menghitung jumlah yang akan dikirim (semua saldo dikurangi biaya gas)
        amount_wei = balance_wei - gas_cost
        if amount_wei <= 0:
            Logger.warn(f"Melewati transfer: Saldo tidak cukup untuk biaya gas: {balance_eth} PHRS")
            return False

        amount_eth = Web3.from_wei(amount_wei, 'ether')
        Logger.info(f"Mentransfer {amount_eth} PHRS ke {receiver_address}")

        # Membangun transaksi
        nonce = provider.eth.get_transaction_count(wallet_address)
        transaction = {
            'to': receiver_address,
            'value': amount_wei,
            'gas': gas_limit,
            'gasPrice': gas_price,
            'nonce': nonce,
            'chainId': NETWORK_CONFIG['chainId']
        }

        # Menandatangani dan mengirim transaksi
        signed_tx = provider.eth.account.sign_transaction(transaction, wallet.key)
        tx_hash = provider.eth.send_raw_transaction(signed_tx.rawTransaction)
        Logger.loading(f"Transaksi transfer dikirim: {tx_hash.hex()}")

        # Menunggu konfirmasi
        receipt = provider.eth.wait_for_transaction_receipt(tx_hash, timeout=120)
        if receipt['status'] == 1:
            Logger.success(f"Transfer selesai: {tx_hash.hex()}")
            return True
        else:
            Logger.error(f"Transfer gagal: Transaksi dibatalkan")
            return False

    except Exception as error:
        Logger.error(f"Transfer gagal untuk {wallet_address}: {str(error)}")
        return False

async def main():
    Logger.banner()

    proxies = load_proxies()
    private_keys = load_private_keys()
    receiver_address = load_receiver_address()

    if not private_keys:
        Logger.error('🔐 Tidak ada kunci pribadi ditemukan di pvkey.txt')
        return

    # Memproses klaim faucet dan check-in
    for private_key in private_keys:
        proxy = get_random_proxy(proxies)
        provider = setup_provider(proxy)
        
        # Membuat dompet
        wallet = Account.from_key(f"0x{private_key}")
        wallet_address = Web3.to_checksum_address(wallet.address)
        
        Logger.wallet(f"Menggunakan dompet: {wallet_address}")

        # Mengklaim faucet
        await claim_faucet(wallet, wallet_address, proxy)

        # Melakukan check-in harian
        await perform_check_in(wallet, wallet_address, proxy)

    # Mentransfer PHRS ke alamat penerima
    if receiver_address:
        Logger.info(f"Memulai transfer PHRS ke penerima: {receiver_address}")
        for private_key in private_keys:
            proxy = get_random_proxy(proxies)
            provider = setup_provider(proxy)
            
            wallet = Account.from_key(f"0x{private_key}")
            wallet_address = Web3.to_checksum_address(wallet.address)
            
            Logger.wallet(f"Memproses transfer untuk dompet: {wallet_address}")
            await transfer_phrs(wallet, wallet_address, receiver_address, provider, proxy)
    else:
        Logger.warn("Tidak ada alamat penerima yang valid, melewati transfer")

if __name__ == "__main__":
    import asyncio
    try:
        asyncio.run(main())
    except Exception as e:
        Logger.error(f"💥 Bot gagal: {str(e)}")
        exit(1)