import { weekDays } from './date.js';

// 规则:
// 1. 同部位不连续两天
// 2. 高强度后跟休息或低强度
// 3. 每周至少 1 个休息日
// 简化:贪心 + 兜底
export function scheduleWeek(notes, prev = {}) {
  const days = weekDays();
  const result = {};

  // 保留已打卡过的(避免重排破坏历史)
  for (const d of days) {
    if (prev[d.key]?.checkedIn) {
      result[d.key] = prev[d.key];
    }
  }

  if (!notes.length) {
    for (const d of days) {
      if (!result[d.key]) result[d.key] = { rest: true };
    }
    return result;
  }

  const pool = [...notes];
  let lastPart = null;
  let lastIntensity = null;
  let restCount = days.filter((d) => result[d.key]?.rest).length;

  for (const d of days) {
    if (result[d.key]) {
      const cur = result[d.key];
      lastPart = cur.bodyPart || lastPart;
      lastIntensity = cur.intensity || lastIntensity;
      continue;
    }

    // 强制至少 1 个休息日:剩余天数 == 剩余需要的休息日 -> 直接休息
    const remainingDays = days.filter((dd) => !result[dd.key]).length;
    const needRest = restCount < 1;

    // 高强度后:倾向休息或低强度
    const mustEase = lastIntensity === '高';

    // 找合适的笔记
    let pick = null;
    for (let i = 0; i < pool.length; i++) {
      const n = pool[i];
      if (n.bodyPart === lastPart) continue;
      if (mustEase && n.intensity === '高') continue;
      pick = { note: n, idx: i };
      break;
    }
    // 放宽:允许强度
    if (!pick) {
      for (let i = 0; i < pool.length; i++) {
        const n = pool[i];
        if (n.bodyPart === lastPart) continue;
        pick = { note: n, idx: i };
        break;
      }
    }

    // 若必须留休息日且后面没机会了 -> 休息
    if (needRest && remainingDays <= 1) {
      result[d.key] = { rest: true };
      restCount += 1;
      lastPart = null;
      lastIntensity = null;
      continue;
    }

    if (!pick) {
      // 实在排不出来就休息
      result[d.key] = { rest: true };
      restCount += 1;
      lastPart = null;
      lastIntensity = null;
      continue;
    }

    const { note } = pick;
    // 轮转 pool 末尾,避免连续重复
    pool.splice(pick.idx, 1);
    pool.push(note);

    result[d.key] = {
      noteId: note.id,
      bodyPart: note.bodyPart,
      duration: note.duration,
      intensity: note.intensity,
      equipment: note.equipment,
      doneActions: [],
      checkedIn: false,
    };
    lastPart = note.bodyPart;
    lastIntensity = note.intensity;
  }

  return result;
}
