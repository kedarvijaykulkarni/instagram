/*
    // STEP 1 - check json structure and combine old and new results
    let target = [{ name: 'oldtag', tags: [{"type":"profile","profile":"nailedby.marimonae","desc":"☆DMV Nail Artist☆"}]}];
    let sources = [{ name: 'tagname', tags: [{"type":"profile","profile":"makemytrip","desc":"MakeMyTrip • 194K followers"}] }]
    console.log(
    [...target, ...sources]
    )
*/

/*
    // STEP 2 - write to file
    const fs = require("fs");
    let rawdata = fs.readFileSync("tags.json");
    let jsonData = JSON.parse(rawdata);
    let newData = { name: 'oldtag', tags: [{"type":"profile","profile":"nailedby.marimonae","desc":"☆DMV Nail Artist☆"}]};
    jsonData.push(newData);
*/

/*
    // STEP 3 - process json file and remove dublicate keys

    const fs = require("fs");
    let rawdata = fs.readFileSync("tags.json");
    let jsonData = JSON.parse(rawdata);

    const removeDuplicateKeys = async (jsonData) => {
        if (!Array.isArray(jsonData)) {
        throw new Error('Input is not a valid JSON array.');
        }

        const mergedData = jsonData.reduce((acc, entry) => {
            const existingEntry = acc.find(item => item.name === entry.name);
        
            if (existingEntry) {
            // Merge tags of the duplicate entry with the existing entry
            existingEntry.tags.push(...entry.tags);
            } else {
            // Create a new entry if the name is unique
            acc.push({ name: entry.name, tags: entry.tags });
            }
        
            return acc;
        }, []);
    
        const uniqueProfiles = new Map();
        const resultArray = [];

        console.log("mergedData :::::", mergedData)
    
        for (const entry of mergedData) {
        const profile = entry.profile;
    
        if (!uniqueProfiles.has(profile)) {
            uniqueProfiles.set(profile, true);
            resultArray.push(entry);
        }
        }

        console.log("resultArray :::::", resultArray)
    
        return resultArray;
    }

    let newData = null;
    (async ()=>{
        newData = await removeDuplicateKeys(jsonData);
        console.log("newData :::::", newData);
    })();

 */

/*
    // STEP 4 - loop throu the tags jason and visit profiles

const puppeteer = require("puppeteer");
const fs = require("fs");

(async () => {
   
    let browser = await puppeteer.launch({
        headless: true,
    });
    let page = await browser.newPage();

    await page.goto("http://localhost:3000/");
    await page.waitForSelector('div.xbjc6do');

    const divsWithLinks = await page.evaluate(() => {

        const basicInfo = document.querySelector('ul.x78zum5');
        const basicItems = basicInfo.querySelectorAll('li') || [];

        const parentDiv = document.querySelector('div.xbjc6do');
        const divs = parentDiv.querySelectorAll('div') || []; // Replace 'div' with your child div selector

        const header = parentDiv.querySelector('h1');  // select H1
        const headerHasLink = header.querySelector('a');  // select H1

        let hederJson = [];

        hederJson.push({
            posts: (basicItems[0].textContent || "").replace(" posts", ""),
            followers: (basicItems[1].textContent || "").replace(" followers", ""),
            following: (basicItems[2].textContent || "").replace(" following", ""),
        });

        if (headerHasLink) {
            let eleTxt = headerHasLink.textContent;
            if (eleTxt?.includes('@')) {
                hederJson.push(JSON.parse(`{ 
                    "profile" : { 
                        "link": "${headerHasLink.getAttribute("href")}",
                        "name": "${eleTxt}"
                    }
                }`)
                );
            }
        }

        const headerData = header.innerHTML?.split("<br>");
        const cleanHeaderData = [];

        headerData.forEach((eleTxt) => {

            cleanHeaderData.push(

                eleTxt
                    .replace(/[^\x00-\x7F]|[\uD800-\uDBFF]|[\uDC00-\uDFFF]|[\u200D-\uFE0F]/g, '')
                    .replace(/<\/?[^>]+(>|$)/g, '')
                    .replace(/[!@#$%^&*()_+=[\]{};':"\\|,.<>/?]/g, '')
                    .toString()
                    .trim()

            )
        }
        )

        hederJson.push({
            "others": cleanHeaderData
        }
        )

        const divJson = [];

        divs.forEach((div, index) => {
            const hasLink = div.querySelector('a');
            const textContent = div.textContent.trim();
            let eleTxt = hasLink || textContent;

            if (textContent?.includes('$')) {
                divJson.push(
                    JSON.parse(`{ "rate": "${textContent}" }`)
                );
            }

            if (textContent?.includes('#')) {
                const hashtags = textContent.match(/#\w+/g);
                if (divJson?.tags) {
                    divJson?.tags.push(hashtags);
                } else {
                    divJson.push(
                        JSON.parse(`{ "tags": "${hashtags}" }`)
                    )
                }
            }

            if (hasLink) {
                divJson.push(JSON.parse(`{ 
                    "links" : { 
                        "link": "${hasLink.getAttribute("href")}",
                        "name": "${hasLink.textContent.trim()}"
                    }
                }`)
                );

            }

            // divJson.push(
            //     JSON.parse(`{ "text-${index}": "${textContent}" }`)
            // );
        });

        return { data: Object.assign(...divJson, ...hederJson) };
        // return { divJson, hederJson };
    });




    console.log("divsWithLinks", divsWithLinks)

    fs.writeFileSync("test.json", JSON.stringify(divsWithLinks, null, 2), 'utf8');

})();


*/

const fs = require("fs");

const readTextFile = (fileName) => {
    const fileContent = fs.readFileSync(fileName, "utf8");
    return fileContent.split("\n");
};


(async () => { 
    let idList = readTextFile("data/tags.json");


    console.log(JSON.parse(idList))
})();