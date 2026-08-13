---
name: git-commit-helper
description: 自动生成符合仓库规范的中文 Git 提交信息。用户执行 git commit、已暂存变更、或询问提交信息时使用。基于 git diff 判断变更类型并输出单行 Conventional Commit（无 scope、无 body）。
allowed-tools: Bash, Read
---

# Git Commit Helper 技能

基于 `git diff` / 暂存变更，生成符合项目规则的提交信息。

## 何时触发

- ✅ 用户执行 `git commit` 但未提供 `-m`
- ✅ 用户询问“提交信息怎么写”
- ✅ 已存在暂存区变更（`git add` 之后）
- ✅ 用户提到“commit message / conventional commit”

## 输出目标（强约束）

始终输出**一行中文**提交信息，格式如下：

```
<type>: <subject>
```

必须满足：
- 语言：简体中文
- 仅一行：禁止 body / footer
- 禁止 scope：不能写成 `feat(auth): ...`
- `type` 仅可使用：`feat` `fix` `docs` `style` `refactor` `perf` `test` `build` `ci` `chore` `revert`

## 生成流程

### 1) 读取变更

```bash
git diff --staged --name-only
git diff --staged
```

若暂存区为空，再看工作区变更（用于建议，不直接提交）：

```bash
git diff --name-only
git diff
```

### 2) 判断主类型

- 新功能/新增能力：`feat`
- 缺陷修复：`fix`
- 文档：`docs`
- 纯样式调整（无逻辑变化）：`style`
- 重构（不改变外部行为）：`refactor`
- 性能优化：`perf`
- 测试新增/修复：`test`
- 构建或依赖：`build`
- CI 流程：`ci`
- 其他杂项：`chore`
- 回滚提交：`revert`

### 3) 生成 subject

- 使用中文动宾短语，直接说明“做了什么”
- 不要过长，避免空泛（如“修复问题”）
- 不加句号，不带 issue/footer
- 不包含 scope 括号

## 输出模板

```text
<type>: <中文subject>
```

## 示例

### 正确示例

```text
feat: 新增登录页皮肤切换能力
fix: 修复注册页验证码倒计时异常
docs: 更新主题分层架构说明
refactor: 重构认证页面组件注册结构
test: 补充认证表单提交单元测试
```

### 错误示例

```text
feat(auth): 新增登录功能      # 含 scope，禁止
fix: 修复登录问题\n\n详细说明   # 含 body，禁止
Added new login feature       # 非中文且格式不符
```

## 多类型变更处理

一次提交包含多类改动时，按“主要目的”选择一个 type：

- 以功能交付为主，夹带少量重构：优先 `feat`
- 以修复线上问题为主，夹带少量清理：优先 `fix`
- 大量机械性格式化，且无行为变化：`style`

## 交互策略

- 若变更意图不清晰，先给 2-3 个候选消息供用户选
- 若检测到规则冲突（如用户要求 scope），明确提示仓库规范并给出合规替代
- 若用户已给 type，只优化中文 subject，不擅自改 type

## 与本仓库规则对齐

本技能遵循项目约束：

- 提交信息必须为简体中文
- 格式固定为 `<type>: <subject>`
- 严禁 scope 与 body

优先保证“可直接提交且通过团队规范”。