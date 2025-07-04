# app.py (性能优化版)
from flask import Flask, render_template, abort
import json
from collections import defaultdict
import os

app = Flask(__name__)

# 1. 定义一个全局变量来缓存工具数据
TOOLS_DATA = {}


def load_tools():
    """
    从 tools.json 加载并处理工具数据。
    这个函数现在只在应用启动时被调用一次。
    """
    try:
        json_path = os.path.join(os.path.dirname(__file__), 'tools.json')
        with open(json_path, 'r', encoding='utf-8') as f:
            tools_data = json.load(f)

        # 按分类分组
        grouped = defaultdict(list)
        for tool in tools_data:
            grouped[tool.get('category', '未分类')].append(tool)

        return grouped
    except FileNotFoundError:
        # 如果文件找不到，这是一个严重错误，直接让应用启动失败并记录日志
        app.logger.error("致命错误：tools.json 文件未找到！应用无法启动。")
        raise
    except json.JSONDecodeError:
        app.logger.error("致命错误：tools.json 文件格式不正确！应用无法启动。")
        raise


# 2. 在应用启动时，立即调用加载函数，并将结果存入全局变量
# 我们使用 with app.app_context() 来确保在正确的应用上下文中执行
with app.app_context():
    TOOLS_DATA = load_tools()


@app.route('/')
def index():
    # 3. 路由函数现在直接从全局变量读取数据，不再执行文件IO
    if not TOOLS_DATA:
        # 增加一个兜底，如果因为某些原因数据没加载成功，可以显示一个错误页面
        # abort(500) 会渲染一个 "Internal Server Error" 页面
        abort(500, description="工具数据加载失败，请联系管理员。")

    return render_template('index.html', grouped_tools=TOOLS_DATA)


if __name__ == '__main__':
    # 在生产环境中，debug=False 是更安全的选择
    # host='0.0.0.0' 允许外部访问
    app.run(host='0.0.0.0', port=5000, debug=False)

