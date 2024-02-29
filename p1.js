const http = require('http');
const url = require('url');

var path = require('path'),
    fs = require('fs');

var mimeTypes = {
    "html": "text/html",
    "jpeg": "image/jpeg",
    "jpg": "image/jpeg",
    "png": "image/png",
    "gif": "image/gif",
    "js": "text/javascript",
    "css": "text/css",
    "mp4": "video/mp4",
    "ogv": "video/ogv"
    };

// Import our static data
const teams = require('./teams.json');
const all_standings = require('./standings.json');
// The two variables above are now arrays of objects.  They
// will be your data for the application.  You shouldn't have to 
// read the files again.

// Some basic lists derived from the standings.  You will probable
// find these useful when building your pages
// Make sure you take a look at what this functionality is doing - 
// the map function is incredibly helpful for transforming arrays, 
// and the use of Set and Array.from allow you to remove duplicates.

// Array.from - https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/from
// Set - https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Set
// Array.map - https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/map
const years = Array.from(new Set(all_standings.map(s => s.year)));
const leagues = Array.from(new Set(all_standings.map(s => s.league)));
const divisions = Array.from(new Set(all_standings.map(s => s.division)));

function getPage(m_uri, m_parts) {
    if(m_uri == "/"){
        return homePage();
    }
    else if(m_uri == "/teams"){
        return teamsPage();
    }
    else{
        return standingsPage(m_uri, m_parts);
    }
}

const heading = (title) => {
    var html = `
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

// Page functions.
function homePage() {
    let html = `
        <p>
            <a href="teams">Teams</a>
        </p>
        <p>Standings</p>
    `;
    // Year + "Season":
    for(let i = 0; i < years.length; i++){
        html += `<ul><li><a href="standings/${years[i]}">${years[i]} Season</a><ul>`;
        // Leagues:
        for(let j = 0; j < leagues.length; j++){
            html += `<li><a href="standings/${years[i]}/${leagues[j]}">${leagues[j]}</a></li><ul>`;
            // Divisions:
            for(let k = 0; k < divisions.length; k++){
                html += `<li><a href="standings/${years[i]}/${leagues[j]}/${divisions[k]}">${divisions[k]}</a></li>`
            }
            html += `</ul>`;
        }
        html += `</ul></li></ul>`;
    }
    return html;
}

function teamsPage() {
    let attributes = Object.keys(teams[0]);
    let html = `
        <table>
            <thead>
                <tr>`;

    for(let i = attributes.length - 1; i >=0 ; i--){
        html += `<th>${attributes[i].toUpperCase()}</th>`
    }

    html += `   </tr>
            </thead>
            <tbody>
    `;

    for(let i = 0; i < teams.length; i++){
        curr_team = teams[i];
        curr_attributes = Object.keys(teams[i])
        html += `<tr>`
        for(let j = attributes.length - 1; j >= 0; j--){
            curr_attr = curr_team[curr_attributes[j]];
            html += `<td>`;
            if(curr_attributes[j] == "logo"){
                html += `<img height="75" src=${curr_attr}>`
            }
            else{
                html += `${curr_attr}`
            }
            html += `</td>`;
        }
        html += `</tr>`
    }
    
    html += `</tbody>
    </table>`;
    return html;
}

function isRelevantStanding(m_standing, m_parts) {
    try{
        // Validate m_parts array first to make sure what is being requested is a standing.
        // console.log('isRelevantStanding(): m_parts: ' + m_parts);
        // console.log("isRelevantStanding(): m_parts[0] type: " + typeof m_parts[0]);
        if(m_parts[0] != "standings"){
            return false;
        }
        // Assuming this is a standing, if it is just a standing in question, then it is definitely valid. Return true.
        if(m_parts.length == 1){
            return true;
        }
        // Check if standing has year, league, and division.
        if(!("year" in m_standing)){
            console.log('isRelevantStanding(): year not found in ' + m_standing);
            return false;
        }
        if(!("league" in m_standing)){
            console.log('isRelevantStanding(): league not found in ' + m_standing);
            return false;
        }
        if(!("division" in m_standing)){
            console.log('isRelevantStanding(): division not found in ' + m_standing);
            return false;
        }
        // If there is a specific standing, validate it further.
        let relevant_attr = m_parts.slice(1);
        // console.log("isRelevantStanding(): relevant_attr: " + relevant_attr);
        for(let i = 0; i < relevant_attr.length; i++){
            // Validate year.
            // console.log("isRelevantStanding(): m_standing[\"year\"]: " + m_standing["year"]);
            // console.log("isRelevantStanding(): m_parts[i + 1]]: " + m_parts[i + 1]);
            if(i == 0 && m_standing["year"] != relevant_attr[i]){
                // console.log('isRelevantStanding(): This is not the right year!');
                return false;
            }
            // Validate league.
            else if(i == 1 && m_standing["league"] != relevant_attr[i]){
                return false;
            }
            // Validate division.
            else if(i == 2 && m_standing["division"] != relevant_attr[i]){
                return false;
            }
        }
        // Otherwise, it must be valid. Return true.
        // console.log('isRelevantStanding(): This is a valid standing!');
        return true;
    }
    catch(e){
        throw 'ERROR: isRelevantStanding(): m_standing is not valid.';
    }
}

function get_team_with_code(m_code){
    for(let i = 0; i < teams.length; i++){
        if(teams[i].code === m_code){
            return teams[i];
        }
    }
    return undefined;
}

function standingsPage(m_uri, m_parts) {
    let attributes = Object.keys(all_standings[0]);
    let html = `
        <table>
            <thead>
                <tr>`;

    html += `<th>LOGO</th>`;
    html += `<th>CITY</th>`;
    html += `<th>NAME</th>`;
    html += `<th>WINS</th>`;
    html += `<th>LOSSES</th>`;

    html += `   </tr>
            </thead>
            <tbody>
    `;

    let relevant_standings = all_standings.filter((standing) => isRelevantStanding(standing, m_parts) == true).sort((a, b) => {
        if(parseInt(a.wins) > parseInt(b.wins)){
            return -1;
        }
        else if(parseInt(a.wins) < parseInt(b.wins)){
            return 1;
        }
        return 0;
    });
    console.log('standingsPage(): relevant_standings: ' + relevant_standings);
    for(let i in relevant_standings){
        html += `<tr>`;
        html += `<td><img height="75" src="${get_team_with_code(relevant_standings[i].team).logo}"></td>`;
        html += `<td>${get_team_with_code(relevant_standings[i].team).city}</td>`;
        html += `<td>${get_team_with_code(relevant_standings[i].team).name}</td>`;
        html += `<td>${relevant_standings[i].wins}</td>`;
        html += `<td>${relevant_standings[i].losses}</td>`;
        html += `</tr>`;
    }
    
    html += `</tbody>
    </table>`;
    return html;
}

const serve = (req, res) => {
    const uri = url.parse(req.url).pathname;
    const parts = uri.split('/').splice(1);

    console.log('parts: ' + parts)

    console.log("Requested path = " + uri);
    // var filename = path.join(process.cwd(), unescape(uri));
    // console.log('filename: ' + filename);

    // if(uri != '/'){
    try{
        // var mimeType = mimeTypes[path.extname(filename).split(".")[1]];
        res.writeHead(200, { 'Content-Type': 'text/html' });
        console.log("\tResponse is 200, serving file");
        // Create heading.
        let headingTitle = "";
        if(parts[0] != ""){
            for(let i = 0; i < parts.length; i++){
                if(i == 0){
                    headingTitle = parts[0].charAt(0).toUpperCase() + parts[0].substring(1);
                }
                else{
                    headingTitle += " - " + parts[i];
                }
            }
        }
        else{
            headingTitle = "Home"
        }
        // res.write(heading(headingTitle) + pages[uri.toString()] + footing());
        res.write(heading(headingTitle) + getPage(uri, parts) + footing());
        res.end();
    }
    catch(e){
        console.log("\tResponse is 404, not found");
        res.writeHead(404, {'Content-Type': 'text/plain'});
        res.write('404 Not Found\n');
        res.end();
        return;
    }
        // parts[0] is going to be 'teams', 'standings', or '' - '' (homepage)

        // You should examine the URL to determine which page to build.
        // Each page will have the same heading part and footing - it's the contents
        // that will be different.

        // Hint:  Make one function for each page, and having it return the html
        // content, and reuse heading/footing for all of them.

        // For the starter, I'm just building a generic page with a generic title.
        // const demo_site = `https://cmps369-p1.onrender.com/`;
        // const html = heading('Sample') + `<p>Not much here yet... but check out the <a href="${demo_site}">demo</a>!</p>` + footing();
        // const html = heading('Home') + `<p>Not much here yet!</p>` + footing();
        // res.writeHead(200, { 'Content-Type': 'text/html' });
        // res.write(html);
        // res.end("hehe");
}


http.createServer(serve).listen(3000);