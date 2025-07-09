{
    "translatorID": "e26cad9e-c9c3-438b-bbab-ea9a3353c3f7",
    "label": "ekubib",
    "creator": "Eklavya Sharma",
    "target": "bib",
    "minVersion": "2.1.9",
    "maxVersion": "",
    "priority": 200,
    "configOptions": {
        "async": true,
        "getCollections": true
    },
    "displayOptions": {
        "exportCharset": "UTF-8",
        "exportNotes": true,
        "exportFileData": false,
        "useJournalAbbreviation": false
    },
    "inRepository": true,
    "translatorType": 2,
    "lastUpdated": "2025-07-09 18:55:15"
}

var zotero2bibtexTypeMap = {
    "book": "book",
    "bookSection": "incollection",
    "journalArticle": "article",
    "magazineArticle": "article",
    "newspaperArticle": "article",
    "thesis": "phdthesis",
    "letter": "misc",
    "manuscript": "unpublished",
    "patent" :"patent",
    "interview": "misc",
    "film": "misc",
    "artwork": "misc",
    "webpage": "misc",
    "conferencePaper": "inproceedings",
    "report": "techreport"
};

function getYearFromDate(date) {
    if(date.length < 4) {
        return '';
    }
    const dateRegex = /^\d{4}$/;
    const beg = date.slice(0, 4);
    if(dateRegex.test(beg)) {
        return beg;
    }
    const end = date.slice(date.length-4, date.length);
    if(dateRegex.test(end)) {
        return end;
    }
    return '';
}

const shortWords = new Set(['a', 'an', 'the', 'of', 'from']);

function getBibInfo(item) {
    const type = zotero2bibtexTypeMap[item.itemType] ?? 'misc';
    const data = {'title': item.title};
    const isArxivPaper = (item.itemType === 'preprint'
        && item.repository.toLowerCase() === 'arxiv');

    // get authors
    const authors = [];
    let firstAuthorLastName;
    for(const creatorInfo of item.creators) {
        if(creatorInfo.creatorType === 'author') {
            if(firstAuthorLastName === undefined) {
                firstAuthorLastName = (creatorInfo.lastName ?? creatorInfo.firstName).toLowerCase();
            }
            const authorFullName = [creatorInfo.lastName, creatorInfo.firstName].join(', ');
            authors.push(authorFullName);
        }
    }
    data.author = authors.join(' and ');

    // create label
    const year = (item.date) ? getYearFromDate(item.date) : '';
    const titleFirstWord = item.title.toLowerCase().split(/[^a-z0-9]/)
        .filter((word) => !shortWords.has(word))[0];
    const label = firstAuthorLastName + year + titleFirstWord;

    // venue
    let venueType, venue;
    if(type === 'article') {
        venueType = 'journal';
        venue = item.publicationTitle ?? item.journalAbbreviation;
    }
    else if(type === 'inproceedings') {
        venueType = 'booktitle';
        venue = item.proceedingsTitle ?? item.conferenceName;
    }
    if(venueType) {
        data[venueType] = venue;
    }

    if(year) {data.year = year;}
    if(!isArxivPaper && item.volume) {data.volume = item.volume;}
    if(!isArxivPaper && item.number) {data.number = item.number ?? item.issue;}
    if(item.pages) {
        data.pages = item.pages.replace(/[-–]+/, '--');
    }
    if(!isArxivPaper && item.publisher) {data.publisher = item.publisher;}

    // doi or url
    if(isArxivPaper && item.archiveID) {
        data.eprint = item.archiveID;
        data.archivePrefix = 'arXiv';
    }
    else if(item.DOI) {data.doi = item.DOI;}
    else if(item.url) {data.url = item.url;}

    /*
    item.abstractNote = '';
    item.uniqueFields = {};
    for(const [key, value] of Object.entries(item)) {
        Zotero.debug(`${key}: ${JSON.stringify(value)}`);
    }
    */
    return [type, label, data];
}

function writeBibtex(type, label, data) {
    /*
    Zotero.debug(`type: ${type}`);
    Zotero.debug(`label: ${label}`);
    for(const [key, value] of Object.entries(data)) {
        Zotero.debug(`${key}: ${JSON.stringify(value)}`);
    }
    */

    Zotero.write(`@${type}{${label},\n`);
    const lines = [];
    for(const [key, value] of Object.entries(data)) {
        lines.push(`${key} = {${value}}`);
    }
    Zotero.write(lines.join(',\n'));
    Zotero.write('\n}\n');
}

function doExport() {
    let item;
    while (item = Zotero.nextItem()) {
        //don't export standalone notes and attachments
        if (item.itemType == "note" || item.itemType == "attachment") {
            continue;
        }

        const [type, label, data] = getBibInfo(item);
        writeBibtex(type, label, data);
    }
}

/** BEGIN TEST CASES **/
var testCases = [
]
/** END TEST CASES **/
