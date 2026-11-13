// Pin the zone for the CI run. The runner is UTC, where date-parsing bugs
// that only show west of UTC (new Date('YYYY-MM-DD') is the previous local
// day) cannot fail. Workers inherit process.env.TZ from this process.
module.exports = async () => {
  process.env.TZ = 'America/Denver';
};
