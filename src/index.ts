import { Hono } from 'hono'
import { chromium } from 'playwright-extra';

const app = new Hono()

app.get('/', (c) => {
  return c.text('Hello Hono!')
})
const br = chromium.launch({ headless: true });

async function getAllContest(browser: any, page: any, grpList: any) {
  const results = [];
  for (const url of grpList) {
    await page.goto(url, { waitUntil: 'networkidle' });
    const contests = await page.$$eval('#group-contest-table tbody tr', (rows: any) => {
      return rows.map((row: any) => {
        const linkElem = row.querySelector('.title a');
        const dateElem = row.querySelector('.date .absolute');
        return {
          link: linkElem?.getAttribute('href') || '',
          title: linkElem?.textContent.trim() || '',
          time: dateElem?.textContent.trim() || ''
        };
      });
    });
    results.push(...contests);
  }
  return results;
}

app.post('/grp_details', async (c) => {
  const { grp_list, jid } = await c.req.json();
  const browser = await br;
  const context = await browser.newContext();

  await context.addCookies([{
    name: 'JSESSIONID',
    value: jid,
    domain: 'vjudge.net',
    path: '/',
    httpOnly: true,
    secure: true
  }]);

  const page = await context.newPage();

  console.log('Navigating to vjudge.net...');
  await page.goto('https://vjudge.net', { waitUntil: 'networkidle' });


  const contests = await getAllContest(browser, page, grp_list);

  await browser.close();
  return c.json(contests);
})

async function getContestDetails(browser: any, page: any, contest: any) {
  const baseUrl = 'https://vjudge.net';
  await page.goto(baseUrl + contest.link);
  const contestData: { name?: string, overview?: { problems: any[] }, rank?: { headers: string[], ranks: any[] }, user_stats?: { [key: string]: any } } = {};

  const nameElement = await page.$('#time-info h3');
  contestData.name = await nameElement.innerText();

  await page.locator('a.nav-link[href="#overview"]').click();
  await page.waitForLoadState();

  const overviewTable = await page.$("#contest-problems");

  contestData.overview = {
    problems: [],
  };

  const rows = await overviewTable.$$("tbody tr");
  for (const row of rows) {
    const problemData: { stat?: string, id?: string, title?: string } = {};
    problemData.stat = await row.$eval(".all-stat", (el: any) => el.innerText);
    problemData.id = await row.$eval(".prob-num", (el: any) => el.innerText);
    problemData.title = await row.$eval(".prob-title a", (el: any) => el.innerText);
    contestData.overview.problems.push(problemData);
  }


  await page.locator('a.nav-link[href="#rank"]').click();
  await page.waitForLoadState();

  const rankTable = await page.$("#contest-rank-table");
  contestData.rank = {
    headers: [],
    ranks: []
  };
  const headerRows = await rankTable.$$("thead tr")
  for (let i = 0; i < headerRows.length; i++) {
    const row = headerRows[i];
    const header = await row.$$("th div");
    for (const head of header) {
      if (i == 0) {
        contestData.rank.headers.push(await head.innerText());
      } else {
        const problem = await head.innerText();
        contestData.rank.headers.push(problem);
      }
    }
  }


  const rankRows = await rankTable.$$("tbody tr");

  for (const row of rankRows) {
    const rankData: { rank?: string, team?: string, score?: string, penalty?: string, [key: string]: any } = {};
    rankData.rank = await row.$eval(".rank", (el: any) => el.innerText);
    rankData.team = await row.$eval(".team a", (el: any) => el.getAttribute('href').split('/').pop());
    rankData.score = await row.$eval(".solved", (el: any) => el.innerText);
    rankData.penalty = await row.$eval(".penalty span.hms", (el: any) => el.innerText);


    const problemResults = await row.$$("td.prob");
    for (let index = 0; index < problemResults.length; index++) {
      const result = problemResults[index];
      rankData[`problem_${contestData.overview.problems[index].id}`] = await result.innerHTML();
    }
    contestData.rank.ranks.push(rankData);
  }

  contestData.user_stats = {};
  for (const rank of contestData.rank.ranks) {
    const username = rank.team;
    console.log('Getting stats for:', username);
    contestData.user_stats[username] = await getLast10UserStats(page, username);
  }

  return contestData;
}


async function getLast10UserStats(page: any, username: any) {
  await page.locator('a.nav-link[href="#status"]').click();
  await page.waitForLoadState();

  const userStats = [];
  const statusTable = await page.$("#listStatus");
  await page.locator('#un').fill(username)
  await page.waitForTimeout(1000)
  const rows = await statusTable.$$("tbody tr");
  for (let i = 0; i < rows.length; i++) {
    if (i >= 10) break;
    const row = rows[i];
    const statData: { run_id?: string, problem?: string, result?: string, time?: string, memory?: string, length?: string, language?: string, submit_time?: string } = {};
    statData.run_id = await row.$eval(".run-id", (el: any) => el.innerText).catch(() => '');
    statData.problem = await row.$eval(".num", (el: any) => el.innerText).catch(() => '');
    statData.result = await row.$eval(".status", (el: any) => el.innerText).catch(() => '');
    statData.time = await row.$eval(".runtime", (el: any) => el.innerText).catch(() => '');
    statData.memory = await row.$eval(".memory", (el: any) => el.innerText).catch(() => '');
    statData.length = await row.$eval(".length", (el: any) => el.innerText).catch(() => '');
    statData.language = await row.$eval(".language", (el: any) => el.innerText).catch(() => '');
    statData.submit_time = await row.$eval(".localizedTime .absolute", (el: any) => el.innerText).catch(() => '');
    console.log(statData.submit_time);
    userStats.push(statData);
  }

  return userStats;
}

async function getAllContestDetails(browser: any, page: any, contests: any) {
  const contestDetails = [];
  for (const contest of contests) {
    const contestData = await getContestDetails(browser, page, contest);
    contestDetails.push(contestData);
  }
  return contestDetails;
}

app.post('/grp_c_details', async (c) => {
  const { grp_list, jid } = await c.req.json();
  const browser = await br;
  const context = await browser.newContext();

  await context.addCookies([{
    name: 'JSESSIONID',
    value: jid,
    domain: 'vjudge.net',
    path: '/',
    httpOnly: true,
    secure: true
  }]);

  const page = await context.newPage();

  console.log('Navigating to vjudge.net...');
  await page.goto('https://vjudge.net', { waitUntil: 'networkidle' });


  const contests = await getAllContest(browser, page, grp_list);

  const contestData = await getAllContestDetails(browser, page, contests);

  await browser.close();
  return c.json(contestData);
})

app.post('/get_c_details', async (c) => {
  const { link, jid } = await c.req.json();

  const contest = {
    link: link
  }

  const browser = await br;
  const context = await browser.newContext();

  await context.addCookies([{
    name: 'JSESSIONID',
    value: jid,
    domain: 'vjudge.net',
    path: '/',
    httpOnly: true,
    secure: true
  }]);

  const page = await context.newPage();
  console.log(contest);
  const contestData = await getContestDetails(browser, page, contest);

  await browser.close();

  return c.json(contestData);

})


function calculateUserStatus(userStats: any) {
  console.log(userStats);
  const now = new Date();
  const last7Days = new Date(now.setDate(now.getDate() - 7));
  let activeDays = 0;
  let lastSolveDate: any = null;
  userStats.forEach((stat: any) => {
    const submitDate = new Date(stat.submit_time);
    if (submitDate > last7Days) {
      activeDays++;
    }
    if (!lastSolveDate || submitDate > new Date(lastSolveDate)) {
      lastSolveDate = stat.submit_time;
    }

  });

  const frequency = activeDays / 7;
  let status = 'inactive';
  if (activeDays > 0) {
    if (frequency > 10) {
      status = 'excellent';
    } else if (frequency > 5) {
      status = 'regular';
    } else {
      status = 'monitor needed';
    }
  }

  return { lastSolveDate, frequency, status };
}

async function getUserPerformance(contestDetails: any) {
  const userStatsMap: { [key: string]: any[] } = {};

  for (const contest of contestDetails) {
    for (const [username, userStats] of Object.entries(contest.user_stats)) {
      if (!userStatsMap[username]) {
        userStatsMap[username] = [];
      }
      userStatsMap[username].push(...(userStats as any[]));
    }
  }

  const userPerformance = [];

  for (const [username, userStats] of Object.entries(userStatsMap)) {
    const { lastSolveDate, frequency, status } = calculateUserStatus(userStats);
    userPerformance.push({
      name: username,
      lastSolveDate,
      frequency: frequency.toFixed(2),
      status,
    });
  }

  return userPerformance;
}


app.post('/get_g_performance', async (c) => {
  const { grp_list, jid } = await c.req.json();
  const browser = await br;
  const context = await browser.newContext();

  await context.addCookies([{
    name: 'JSESSIONID',
    value: jid,
    domain: 'vjudge.net',
    path: '/',
    httpOnly: true,
    secure: true
  }]);

  const page = await context.newPage();

  console.log('Navigating to vjudge.net...');
  await page.goto('https://vjudge.net', { waitUntil: 'networkidle' });


  const contests = await getAllContest(browser, page, grp_list);

  await browser.close();

  const contestData = await getAllContestDetails(browser, page, contests);

  const userPerformance = await getUserPerformance(contestData);

  return c.json(userPerformance);

});


app.post('/get_c_performance', async (c) => {

  const { link, jid } = await c.req.json();

  const contest = {
    link: link
  }

  const browser = await br;
  const context = await browser.newContext();

  await context.addCookies([{
    name: 'JSESSIONID',
    value: jid,
    domain: 'vjudge.net',
    path: '/',
    httpOnly: true,
    secure: true
  }]);

  const page = await context.newPage();
  console.log(contest);
  const contestData = await getContestDetails(browser, page, contest);

  await browser.close();

  const userPerformance = await getUserPerformance([contestData]);

  return c.json(userPerformance);


});







export default app
