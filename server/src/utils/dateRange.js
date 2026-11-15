function dateRangeFilter(from, to) {
  const createdAt = {};
  if (from) {
    createdAt.gte = new Date(`${from}T00:00:00.000Z`);
  }
  if (to) {
    const exclusiveEnd = new Date(`${to}T00:00:00.000Z`);
    exclusiveEnd.setUTCDate(exclusiveEnd.getUTCDate() + 1);
    createdAt.lt = exclusiveEnd;
  }
  return Object.keys(createdAt).length > 0 ? { createdAt } : {};
}

module.exports = { dateRangeFilter };
