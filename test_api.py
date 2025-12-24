#!/usr/bin/env python3
"""
本地测试脚本 - 验证后端 API 是否正常工作
"""
import sys
import time
import urllib.request
import urllib.error
import json


def test_health_check():
    """测试健康检查端点"""
    print("测试健康检查端点...")
    try:
        response = urllib.request.urlopen("http://localhost:8080/health")
        data = json.loads(response.read().decode())
        if data.get("status") == "ok":
            print("✓ 健康检查通过")
            return True
        else:
            print("✗ 健康检查失败: 状态不正确")
            return False
    except urllib.error.URLError as e:
        print(f"✗ 健康检查失败: {e}")
        return False


def test_api_login():
    """测试登录 API"""
    print("\n测试登录 API...")
    try:
        data = json.dumps({
            "username": "admin",
            "password": "admin123"
        }).encode()
        
        req = urllib.request.Request(
            "http://localhost:8080/api/auth/login",
            data=data,
            headers={"Content-Type": "application/json"}
        )
        
        response = urllib.request.urlopen(req)
        result = json.loads(response.read().decode())
        
        if "access_token" in result:
            print("✓ 登录 API 正常")
            return result["access_token"]
        else:
            print("✗ 登录 API 失败: 未返回 token")
            return None
    except urllib.error.HTTPError as e:
        print(f"✗ 登录 API 失败: HTTP {e.code}")
        print(f"  响应: {e.read().decode()}")
        return None
    except Exception as e:
        print(f"✗ 登录 API 失败: {e}")
        return None


def test_api_accounts(token):
    """测试账号列表 API"""
    print("\n测试账号列表 API...")
    try:
        req = urllib.request.Request(
            "http://localhost:8080/api/accounts",
            headers={
                "Authorization": f"Bearer {token}",
                "Content-Type": "application/json"
            }
        )
        
        response = urllib.request.urlopen(req)
        result = json.loads(response.read().decode())
        
        print(f"✓ 账号列表 API 正常 (共 {len(result)} 个账号)")
        return True
    except urllib.error.HTTPError as e:
        print(f"✗ 账号列表 API 失败: HTTP {e.code}")
        print(f"  响应: {e.read().decode()}")
        return False
    except Exception as e:
        print(f"✗ 账号列表 API 失败: {e}")
        return False


def test_frontend():
    """测试前端静态文件"""
    print("\n测试前端静态文件...")
    try:
        response = urllib.request.urlopen("http://localhost:8080/")
        content = response.read().decode()
        
        if "tg-signer" in content or "<!DOCTYPE html>" in content:
            print("✓ 前端静态文件正常")
            return True
        else:
            print("✗ 前端静态文件异常: 内容不正确")
            return False
    except urllib.error.URLError as e:
        print(f"✗ 前端静态文件失败: {e}")
        return False


def main():
    print("=" * 60)
    print("tg-signer 后端 API 测试")
    print("=" * 60)
    print("\n请确保应用已在 http://localhost:8080 运行")
    print("等待 3 秒后开始测试...\n")
    time.sleep(3)
    
    results = []
    
    # 测试健康检查
    results.append(("健康检查", test_health_check()))
    
    # 测试登录
    token = test_api_login()
    results.append(("登录 API", token is not None))
    
    # 如果登录成功，测试其他 API
    if token:
        results.append(("账号列表 API", test_api_accounts(token)))
    
    # 测试前端
    results.append(("前端静态文件", test_frontend()))
    
    # 输出总结
    print("\n" + "=" * 60)
    print("测试总结")
    print("=" * 60)
    
    passed = sum(1 for _, result in results if result)
    total = len(results)
    
    for name, result in results:
        status = "✓ 通过" if result else "✗ 失败"
        print(f"{name}: {status}")
    
    print(f"\n总计: {passed}/{total} 项测试通过")
    
    if passed == total:
        print("\n🎉 所有测试通过！应用运行正常。")
        return 0
    else:
        print("\n⚠️  部分测试失败，请检查日志。")
        return 1


if __name__ == "__main__":
    sys.exit(main())
