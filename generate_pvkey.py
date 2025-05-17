from eth_account import Account

def generate_private_keys_to_file(filename, count):
    with open(filename, "w") as f:
        for _ in range(count):
            acct = Account.create()
            # Simpan hanya private key (hex string)
            f.write(acct.key.hex() + "\n")
    print(f"{count} private keys berhasil disimpan ke {filename}")

if __name__ == "__main__":
    jumlah_wallet = 1000  # Ganti sesuai kebutuhan
    generate_private_keys_to_file("pvkey.txt", jumlah_wallet)
