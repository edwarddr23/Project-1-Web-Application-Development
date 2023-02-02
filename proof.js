const standings = require('./standings.json');
const assert = require('assert');

let errors = 0;
const years = new Map();
const leagues = new Map();
const divisions = new Map();
const teams = new Map();
const test_standing = (s, prop) => {
    if (s[prop] === undefined) {
        console.log('Missing league');
        console.log(s);
        errors++;
    }
}
for (const s of standings) {
    test_standing(s, 'year');
    test_standing(s, 'league');
    test_standing(s, 'division');
    test_standing(s, 'team');
    test_standing(s, 'wins');
    test_standing(s, 'losses');
    years.set(s.year);
    leagues.set(s.league);
    divisions.set(s.division);
    teams.set(s.team);
}

assert(years.size == 2, 'Expected years to be 2');
assert(leagues.size == 2, 'Expected leagues to be 2, is ', leagues.size);
assert(divisions.size == 3, 'Expected divisions to be 3, is ', divisions.size);
assert(teams.size == 30, 'Expected teams to be 3, is ', teams.size);
console.log(Array.from(teams.keys()))
console.log(`There were ${errors} found in the data files`);