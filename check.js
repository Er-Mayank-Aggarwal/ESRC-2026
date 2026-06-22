const fs = require('fs');
const txt = fs.readFileSync('src/lib/seedData.ts', 'utf8');
const dates = new Set();
txt.split('\n').forEach(line => {
  if (line.includes('"date"')) {
    dates.add(line.split('"')[3]);
  }
});
console.log([...dates].sort());
