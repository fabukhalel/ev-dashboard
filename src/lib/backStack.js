// مكدس مشترك لزر الرجوع: كل نافذة مفتوحة تسجّل نفسها، والرجوع يغلق الأعلى أولاً.
// يُستخدم لزر الرجوع في أندرويد ولمفتاح Escape في المتصفح.
const stack = [];

/** يسجّل دالة إغلاق ويرجع دالة لإلغاء التسجيل */
export function pushBack(fn) {
  const entry = { fn };
  stack.push(entry);
  return () => {
    const i = stack.indexOf(entry);
    if (i >= 0) stack.splice(i, 1);
  };
}

/** يغلق أعلى نافذة. يرجع true إن وُجدت نافذة */
export function handleBack() {
  const top = stack[stack.length - 1];
  if (!top) return false;
  top.fn();
  return true;
}

export const backDepth = () => stack.length;
