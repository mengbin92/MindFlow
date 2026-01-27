#!/bin/bash

# MindFlow Web端功能测试脚本

set -e

PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
WEB_DIR="$PROJECT_ROOT/packages/web"
TEST_URL="http://localhost:3000"

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;36m'
NC='\033[0m' # No Color

log() {
    echo -e "${2}[$(date +'%H:%M:%S')]${NC} $1"
}

log_info() {
    log "$1" "$BLUE"
}

log_success() {
    log "$1" "$GREEN"
}

log_warning() {
    log "$1" "$YELLOW"
}

log_error() {
    log "$1" "$RED"
}

# 检查开发服务器是否运行
check_server() {
    log_info "检查开发服务器状态..."

    if curl -s -o /dev/null -w "%{http_code}" "$TEST_URL" | grep -q "200"; then
        log_success "✅ 开发服务器正在运行 ($TEST_URL)"
        return 0
    else
        log_error "❌ 开发服务器未运行"
        log_warning "请先运行: cd packages/web && npm run dev"
        return 1
    fi
}

# 运行自动化测试
run_auto_tests() {
    log_info "运行自动化测试..."

    cd "$WEB_DIR"

    if [ -f "test-web.cjs" ]; then
        node test-web.cjs
        if [ $? -eq 0 ]; then
            log_success "✅ 自动化测试通过"
            return 0
        else
            log_error "❌ 自动化测试失败"
            return 1
        fi
    else
        log_error "❌ 测试脚本不存在: test-web.cjs"
        return 1
    fi
}

# 检查依赖
check_dependencies() {
    log_info "检查依赖安装..."

    if [ ! -d "$PROJECT_ROOT/node_modules/@mindflow" ]; then
        log_warning "⚠️  MindFlow依赖未安装"
        log_info "正在安装依赖..."
        cd "$PROJECT_ROOT"
        npm install
        log_success "✅ 依赖安装完成"
    else
        log_success "✅ 依赖已安装"
    fi
}

# 启动开发服务器
start_server() {
    log_info "启动开发服务器..."
    cd "$WEB_DIR"
    npm run dev &
    SERVER_PID=$!

    # 等待服务器启动
    for i in {1..30}; do
        if curl -s -o /dev/null -w "%{http_code}" "$TEST_URL" | grep -q "200"; then
            log_success "✅ 服务器已启动"
            return 0
        fi
        sleep 1
    done

    log_error "❌ 服务器启动超时"
    return 1
}

# 打开浏览器
open_browser() {
    log_info "在浏览器中打开测试页面..."

    if command -v open &> /dev/null; then
        # macOS
        open "$TEST_URL"
    elif command -v xdg-open &> /dev/null; then
        # Linux
        xdg-open "$TEST_URL"
    elif command -v start &> /dev/null; then
        # Windows
        start "$TEST_URL"
    else
        log_warning "⚠️  无法自动打开浏览器，请手动访问: $TEST_URL"
    fi
}

# 主测试流程
main() {
    echo -e "${BLUE}=================================${NC}"
    echo -e "${BLUE}  MindFlow Web端功能测试${NC}"
    echo -e "${BLUE}=================================${NC}"
    echo ""

    # 解析命令行参数
    case "${1:-test}" in
        check)
            check_server
            ;;
        start)
            check_dependencies
            start_server
            log_info "按Ctrl+C停止服务器"
            wait
            ;;
        open)
            check_server || exit 1
            open_browser
            ;;
        test|full)
            check_dependencies
            if ! check_server; then
                log_info "尝试启动开发服务器..."
                start_server
                sleep 2
            fi
            run_auto_tests
            log_info "测试完成！"
            log_info "请在浏览器中访问 $TEST_URL 进行手动测试"
            open_browser
            ;;
        *)
            echo "用法: $0 {test|check|start|open}"
            echo ""
            echo "命令:"
            echo "  test  - 运行完整测试（默认）"
            echo "  check - 仅检查服务器状态"
            echo "  start - 启动开发服务器"
            echo "  open  - 在浏览器中打开页面"
            exit 1
            ;;
    esac
}

# 运行主流程
main "$@"
