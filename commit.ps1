# 提交所有更改并推送

Write-Host "正在提交所有更改..." -ForegroundColor Green

# 添加所有更改
git add .

# 提交
git commit -m "修复动态路由构建错误 + UI/UX 重构完成"

# 推送
git push

Write-Host "完成！请在 Zeabur 重新部署。" -ForegroundColor Green
