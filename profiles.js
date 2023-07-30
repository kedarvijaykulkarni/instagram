
const puppeteer = require("puppeteer");
const fs = require("fs");


const waitThirtySeconds = () => {
    setTimeout(() => {
        console.log("Waited for 30 seconds. Execution continues now.");
    }, 30000);
};

const readTextFile = (fileName) => {
    const fileContent = fs.readFileSync(fileName, "utf8");
    return fileContent.split("\n");
};



(async () => {

    
    let browser = await puppeteer.launch({
        headless: true,
    });
    let page = await browser.newPage();

    let inputFileList = ["data/tags.json"];


    waitThirtySeconds();
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
        });

        return { data: Object.assign(...divJson, ...hederJson) };
    });

    console.log("divsWithLinks", divsWithLinks)

    fs.writeFileSync("test.json", JSON.stringify(divsWithLinks, null, 2), 'utf8');
})();
