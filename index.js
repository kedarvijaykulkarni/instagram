const puppeteer = require("puppeteer");
const fs = require("fs");
const tagsFile = "data/tags.json"

const readTextFile = (fileName) => {
    const fileContent = fs.readFileSync(fileName, "utf8");
    return fileContent.split("\n");
};

const writeInResults = async (data, hashtag) => {
    try {
        let rawdata = fs.readFileSync(tagsFile);
        let jsonData = JSON.parse(rawdata);

        console.log("data, ", data)
        console.log("combine ", { name: hashtag, tags: data });

        jsonData.push(
            { name: hashtag, tags: data }
        );

        let mergedData = await removeDuplicateKeys(jsonData);

        fs.writeFileSync(tagsFile, JSON.stringify(mergedData, null, 2), 'utf8');

    } catch (e) {
        console.log("error", e);
    }
};

const visitHomeClickOnSearch = async (page) => {
    await page.goto("https://www.instagram.com");
    await page.waitForTimeout(14000);
    await page.waitForSelector('[aria-label="Search"]');
    await page.click('[aria-label="Search"]');
    await page.waitForTimeout(4000);
    await page.waitForSelector('[aria-label="Search input"]');
};

const removeDuplicateKeys = async (jsonData) => {
    if (!Array.isArray(jsonData)) {
        throw new Error('Input is not a valid JSON array.');
    }

    // const uniqueProfiles = new Map();
    // const resultArray = [];

    // for (const entry of jsonData) {
    //   const profile = entry.profile;

    //   if (!uniqueProfiles.has(profile)) {
    //     uniqueProfiles.set(profile, true);
    //     resultArray.push(entry);
    //   }
    // }

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

    return mergedData;
}

(async () => {
    let browser = await puppeteer.launch({
        headless: true,
    });
    // browser = await puppeteer.launch({ dumpio: true }); // strat debug
    let page = await browser.newPage();
    let inputFileList = ["data/hashtag.txt"];

    await page.goto("https://www.instagram.com");

    await page.waitForSelector('[name="username"]');

    await page.$('[name="username"]');

    // await page.type('[name="username"]', "jessicapeterson.want2.discuss");
    // await page.type('[name="username"]', "kedarvijaykulkarni");
    // await page.type('[name="password"]', "Superman@123");

    await page.type('[name="username"]', "poshbeaute.co");
    await page.type('[name="password"]', "Marketing101");

    // await page.type('[name="username"]', "theposhbabemag");
    // await page.type('[name="password"]', "Marketing101!");


    const button = await page.$('[type="submit"]');

    button.click();

    await page.waitForTimeout(14000);

    await page.screenshot({
        path: `screenshots/login.png`,
    });

    await page.waitForSelector('[aria-label="Search"]');

    await page.click('[aria-label="Search"]');

    await page.waitForTimeout(4000);

    await page.waitForSelector('[aria-label="Search input"]');

    await page.$eval('[aria-label="Search input"]', (el) => el.value);

    // Dispose of handle
    await button.dispose();

    for (const inputFile of inputFileList) {
        console.log(inputFile);
        let idList = readTextFile(inputFile);
        console.log(idList.length);

        for (const hashtag of idList) {
            console.log(hashtag);
            await page.waitForTimeout(4000);

            await visitHomeClickOnSearch(page);

            await page.type('[aria-label="Search input"]', hashtag.trim());

            await page.keyboard.press("Enter");

            await page.waitForTimeout(6000);

            await page.screenshot({
                path: `screenshots/hashtag_${hashtag.trim()}.png`,
            });

            //   await page.screenshot({
            //     path: `screenshots/hashtag-${hashtag}.png`,
            //   });

            let result = await page.evaluate(() => {
                let divs = [
                    ...document
                        .querySelector("div.xhtitgo > div")
                        .querySelectorAll('div[role="none"]'),
                ];
                return divs.map((div) => {
                    const stripEmojis = (str) =>
                        str
                            .replace(
                                /([\u2700-\u27BF]|[\uE000-\uF8FF]|\uD83C[\uDC00-\uDFFF]|\uD83D[\uDC00-\uDFFF]|[\u2011-\u26FF]|\uD83E[\uDD10-\uDDFF])/g,
                                ""
                            )
                            .replace(/\s+/g, " ")
                            .trim();

                    const sanitizeTag = (href, text) => {
                        let data = { type: "profile" };
                        if (href.includes("/tags")) {
                            data = {
                                type: "tags",
                                tag: String(href)
                                    .replace("/explore/tags/", "")
                                    .replace(/\//g, ""),
                                posts: stripEmojis(text),
                            };
                        } else {
                            data = {
                                ...data, profile: href.replace(/\//g, ""), desc: text.replace(/[^\x00-\x7F]|[\uD800-\uDBFF]|[\uDC00-\uDFFF]|[\u200D-\uFE0F]/g, '')
                                    .replace(/<\/?[^>]+(>|$)/g, '')
                                    .replace(/[!@#$%^&*()_+=[\]{};':"\\|,.<>/?]/g, '')
                                    .toString()
                                    .trim()
                            };
                        }
                        return data;
                    };

                    return sanitizeTag(
                        div.querySelector("a").getAttribute("href").trim(), // hyper link
                        div
                            .querySelector("span.x1lliihq.x193iq5w.x6ikm8r.x10wlt62.xlyipyv")
                            .textContent.trim() // desc or post count
                    );
                });
            });

            console.log("result :::", result)

            writeInResults(result, hashtag.trim());

            //   console.log("=========== data result =========== ", result);

            await page.waitForTimeout(4000);
        }

        console.log("The written has the following contents:");
        console.log(fs.readFileSync(tagsFile, "utf8"));
    }
})();