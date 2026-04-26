# MindFlow 端到端渲染测试

## 1. 标题层级测试

### 1.1 二级标题

#### 1.1.1 三级标题

##### 1.1.1.1 四级标题

## 2. 文本格式化

这是**粗体文本**，这是*斜体文本*，这是~~删除线文本~~。

混合使用：**粗体 + *斜体***，以及***粗斜体***。

## 3. 链接与图片

[访问 MindFlow 官网](https://mindflow.app)

## 4. 列表

### 4.1 有序列表

1. 第一项
2. 第二项
3. 第三项
   - 无序子项 A
   - 无序子项 B
     - 深嵌套项

### 4.2 任务列表

- [x] 已完成任务
- [ ] 待完成任务
- [ ] 另一个待办

## 5. 代码

### 5.1 行内代码

使用 `dart` 语言：`final value = 42;`

### 5.2 代码块

```python
def fibonacci(n):
    """Calculate Fibonacci number."""
    if n <= 1:
        return n
    return fibonacci(n-1) + fibonacci(n-2)

# Print first 10 numbers
for i in range(10):
    print(fibonacci(i))
```

## 6. 表格

| 功能 | Web | iOS | Android |
|------|:---:|:---:|:-------:|
| 编辑器 | ✅ | ✅ | ✅ |
| 预览 | ✅ | ✅ | ✅ |
| 导出 PDF | ✅ | ✅ | ✅ |
| LaTeX | ✅ | ⚠️ | ⚠️ |

## 7. 引用

> 简单引用
>
> > 嵌套引用
> >
> > > 多层嵌套

## 8. 分割线

上面内容

---

下面内容

## 9. HTML 特殊元素测试

使用 `<mark>` 高亮文本，使用 `<kbd>` 快捷键：`Ctrl + S`

---

**测试完成时间**: ${new DateTime.now().toIso8601String()}
