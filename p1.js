const http = require('http');
const url = require('url');

// Import our static data
const teams = require('./teams.json');
const all_standings = require('./standings.json');

// Some basic lists derived from the standings
const years = Array.from(new Set(all_standings.map(s => s.year)));
const leagues = Array.from(new Set(all_standings.map(s => s.league)));
const divisions = Array.from(new Set(all_standings.map(s => s.division)));

/****************************************************
 * The following are a series of small generator 
 * functions for building different parts of the HTML
 *****************************************************/
const make_division = (year, league, division) => {
    return `<li><a href='/standings/${year}/${league}/${division}'>${division}</a></li>`;
}

const make_divisions = (year, league) => {
    return divisions.map(d => make_division(year, league, d)).join('\n');
}

const make_league = (year, league) => {
    return `<li>
                <a href='/standings/${year}/${league}'>${league}</a>
                <ul>
                    ${make_divisions(year, league)}
                </ul>
            </li>
    `
}
const make_leagues = (year) => {
    return `<ul>${leagues.map(l => make_league(year, l)).join('\n')}</ul>`;
}
const make_year = (year) => {
    return `
    <ul>
        <li>
            <p><a href='/standings/${year}'>${year} Season</a></p>
            ${make_leagues(year)}
        </li>
    </ul>
    `
}

const make_years = () => {
    return `${years.map(y => make_year(y)).join('\n')}`;
}

const make_standings_list = () => {
    return `
            <p>Standings</p>
            ${make_years()}
    `
}

const heading = (title) => {
    const html = `
        <!doctype html>
            <html>
                <head>
                    <title>${title}</title>
                    <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/water.css@2/out/water.min.css">
                </head>
                <body>
                    <a href='/'>Home</a>
                    <br/>
                    <h1>${title}</h1>
    `;
    return html;
}

const footing = () => {
    return `
        </body>
    </html>
    `;
}

// This builds all the tables in all the pages.
const table = (list, props) => {
    let headers = '';
    let data = ''
    props.forEach((p) => headers += `<th>${p.toUpperCase()}</th>`);
    for (const t of list) {
        data += '<tr>';
        props.forEach((p) => {
            if (p === 'logo') {
                data += `<td><img height="75" src="${t[p]}"/></td>`
            } else {
                data += `<td>${t[p]}</td>`
            }
        });
        data += "</tr>";
    }
    return `<table><thead><tr>` + headers + '</thead><tbody>' + data + '</tbody></table>';
}

// Just a page of links!  Follow the function chain!
const home_page = (res) => {
    const links = `
        <p><a href='/teams'>Teams</a></p>
        <section>${make_standings_list()}</section>
    `
    res.writeHead(200, { 'Content-Type': 'text/html' });
    res.write(heading('Home') + links + footing());
    res.end();
}

const teams_page = (res) => {
    res.writeHead(200, { 'Content-Type': 'text/html' });
    res.write(heading('Teams') + table(teams, ['logo', 'city', 'name', 'code']) + footing());
    res.end();
}

const standings_page = (res, standings, query) => {
    let title = 'Standings - ' + query.year;
    if (query.league) title += (" - " + query.league);
    if (query.division) title += (" - " + query.division);
    res.writeHead(200, { 'Content-Type': 'text/html' });
    res.write(heading(title) + table(standings, ['logo', 'city', 'name', 'wins', 'losses']) + footing());
    res.end();
}

const generate_standings = (query) => {
    const match = (s) => {
        return (query.year === s.year) &&
            (query.league === undefined || query.league === s.league) &&
            (query.division === undefined || query.division === s.division);
    }
    const standings = all_standings.filter(match);
    standings.sort((a, b) => b.wins - a.wins);
    standings.forEach((s) => {
        const team = teams.find(t => t.code === s.team);
        s.logo = team.logo;
        s.city = team.city;
        s.name = team.name;
    });
    return standings;
}

const build_standings_query = (res, parts) => {
    const query = {
        year: undefined,
        league: undefined,
        division: undefined
    }
    // If it's invalid, return nothing.
    if (parts.length < 2) {
        return;
    }
    query.year = parts[1];
    if (parts.length > 2) {
        query.league = parts[2];
    }
    if (parts.length > 3) {
        query.division = parts[3];
    }
    return query;
}

const serve = (req, res) => {
    const uri = url.parse(req.url).pathname;
    const parts = uri.split('/').splice(1);

    if (parts[0] === 'teams') {
        teams_page(res);
        return;
    }
    else if (parts[0] === 'standings') {
        const query = build_standings_query(res, parts);
        if (query) {
            const standings = generate_standings(query);
            // If the URL results in no standings, it means an 
            // invalid year, league, or division was used - 
            // so it's "Not Found".
            if (standings.length > 0) {
                standings_page(res, standings, query);
            }
        }
        return;
    } else if (parts.length === 0 || parts[0] === '') {
        home_page(res);
        return;
    }
    res.writeHead(404);
    res.end();
}

const normalizePort = (val) => {
    const port = parseInt(val, 10);
    if (isNaN(port)) {
        return val;
    }
    if (port >= 0) {
        return port;
    }
    return false;
}

http.createServer(serve).listen(normalizePort(process.env.PORT || '3000'));