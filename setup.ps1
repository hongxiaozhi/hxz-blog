Write-Host "== 开始设置 (Windows PowerShell) =="
$here = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $here

python -m venv .\backend\venv
.\backend\venv\Scripts\Activate.ps1
python -m pip install --upgrade pip
pip install -r .\backend\requirements.txt

python .\backend\init_db.py

Write-Host "== 设置完成 =="
Write-Host "后端启动：python backend/app.py"
Write-Host "前端启动：cd frontend; python -m http.server 8080"