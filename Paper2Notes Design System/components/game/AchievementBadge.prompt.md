Round medal for the achievements shelf; locked medals show a lock and a progress bar.

```jsx
<AchievementBadge icon="flame" title="7-day streak" tier="gold" unlocked />
<AchievementBadge icon="target" title="10 first-try" tier="silver" progress={6} goal={10} />
```

- Titles ≤ 3 words. Tier colours: `--tier-bronze/silver/gold`.
