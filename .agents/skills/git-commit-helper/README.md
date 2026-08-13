# Git Commit Helper Skill

> 基于 `git diff` 自动生成符合仓库规范的中文提交信息

## 核心能力

- 根据暂存区变更自动判断 `type`
- 生成**可直接使用**的一行提交信息
- 严格遵循仓库提交规则（中文、无 scope、无 body）

## 提交格式

```text
<type>: <subject>
```

支持类型：

- `feat` 新功能
- `fix` 修复 Bug
- `docs` 文档变更
- `style` 代码样式调整
- `refactor` 代码重构
- `perf` 性能优化
- `test` 测试相关
- `build` 构建系统或依赖变更
- `ci` CI 配置变更
- `chore` 其他非源码变更
- `revert` 回滚提交

## 快速示例

```bash
# 1) 暂存变更
git add src/features/auth/theme/*

# 2) 提交（触发技能建议）
git commit

# 3) 建议输出示例
feat: 新增认证页面皮肤化组件注册能力
```

## 正误对比

正确：

```text
fix: 修复注册页手机号校验错误
docs: 更新主题系统设计文档
refactor: 重构认证入口页布局组件
```

错误：

```text
feat(auth): 新增登录功能   # 含 scope，禁止
fix: 修复问题\n\n详情说明    # 含 body，禁止
Add login page             # 非中文，且不符合格式
```

## 详细说明

完整规则、生成流程与交互策略请查看 `SKILL.md`。