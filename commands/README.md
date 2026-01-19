# Commands Reference

This folder contains the prompts and commands needed to execute contract-first parallel development.

## Files

| File | Purpose |
|------|---------|
| `SPAWN-AGENTS.md` | Copy-paste prompts for spawning parallel agents |

## How to Use

### In Claude Code (with Task tool)

```typescript
// Spawn contract generation agents
Task({
  subagent_type: "general-purpose",
  description: "Generate User domain contract",
  prompt: "[paste prompt from SPAWN-AGENTS.md]"
})
```

### In Multiple Terminals

Open N terminals, paste the appropriate prompt into each.

### Verification Commands

After contract generation:
```bash
ls contracts/                           # All contracts exist?
grep -r "TODO\|TBD" contracts/          # No placeholders?
```

After implementation:
```bash
npx tsc --noEmit                        # 0 errors?
find src -name "*.ts" | wc -l           # All files created?
```

## Timing

| Phase | Agents | Time |
|-------|--------|------|
| Contract Generation | N | ~2 min each (parallel) |
| Verification | 1 | ~5 min (sequential) |
| Implementation | N | ~3 min each (parallel) |

Total for 7 domains: ~45 minutes
