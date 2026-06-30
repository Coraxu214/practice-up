const WEEK_LABEL = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];

export function todayKey(d = new Date()) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export function weekStart(d = new Date()) {
  const x = new Date(d);
  const day = x.getDay(); // 0=Sun
  const diff = (day + 6) % 7; // 周一为一周第一天
  x.setDate(x.getDate() - diff);
  x.setHours(0, 0, 0, 0);
  return x;
}

export function weekDays(d = new Date()) {
  const start = weekStart(d);
  return Array.from({ length: 7 }, (_, i) => {
    const day = new Date(start);
    day.setDate(start.getDate() + i);
    return {
      key: todayKey(day),
      label: ['周一', '周二', '周三', '周四', '周五', '周六', '周日'][i],
      date: day.getDate(),
      isToday: todayKey(day) === todayKey(),
    };
  });
}

export function isYesterday(dateKey) {
  const y = new Date();
  y.setDate(y.getDate() - 1);
  return dateKey === todayKey(y);
}

export { WEEK_LABEL };
