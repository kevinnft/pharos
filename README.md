powershell= (Get-Content .\pvkey.txt) -replace '^0x', '' | Set-Content .\pvkey.txt
vps= sed -i 's/^0x//' pvkey.txt
