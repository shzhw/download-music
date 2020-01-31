const router = require('koa-router')();
const http = require('../utils/http.js');
const $ = require('cheerio');
const puppeteer = require('puppeteer');
const urllib = require('urllib');
const fs = require('fs');

router.prefix('/api');

router.get('/getid/:keywords', async (ctx, next) => {
  let res = await http.get(
    'https://c.y.qq.com/soso/fcgi-bin/client_search_cp',
    {
      params: {
        qqmusic_ver: 1298,
        new_json: 1,
        aggr: 1,
        cr: 1,
        catZhida: 1,
        lossless: 0,
        flag_qc: 0,
        t: 0,
        p: 1,
        n: 20,
        w: ctx.params.keywords,
        hostUin: 0,
        format: 'json',
        inCharset: 'utf8',
        outCharset: 'utf-8',
        notice: 0,
        platform: 'yqq.json'
      }
    }
  );
  ctx.body = res;
});

router.post('/getMediaUrls', async (ctx, next) => {
  let mids = ctx.request.body.mids;
  let mvs = ctx.request.body.mvs;
  let data = await loop(mids, mvs);
  console.log('---3---');
  ctx.body = {
    code: 0,
    data
  };
});

router.get('/download', async (ctx, next) => {
  let fileUrl = decodeURIComponent(ctx.query.fileUrl);
  let fileName = ctx.query.fileName;

  let file = await urllib.request(fileUrl);
  ctx.set('Content-disposition', 'attachment;filename=' + encodeURI(fileName));
  ctx.body = file.data;
});
router.post('/saveMedia', async (ctx, next) => {
  let files = ctx.request.body.files;
  try {
    for (let i = 0; i < files.length; i++) {
      let item = files[i];
      let file = await urllib.request(item.url, {
        timeout: 120000
      });
      fs.writeFileSync('D:/娱乐资源/音乐/' + item.name, file.data);
    }
    ctx.body = {
      code: 0,
      data: 'success'
    };
  } catch (e) {
    ctx.body = {
      code: -1,
      data: e
    };
  }
});

router.get('/getPlayList', async (ctx, next) => {
  let url = 'https://c.y.qq.com/qzone/fcg-bin/fcg_ucc_getcdinfo_byids_cp.fcg?type=1&json=1&utf8=1&onlysong=0&new_format=1&disstid=5334030115&g_tk=5381&loginUin=516248431&hostUin=0&format=json&inCharset=utf8&outCharset=utf-8&notice=0&platform=yqq.json&needNewCode=0';
  
  let res = await http.get(url, {
    headers: {
      Origin: 'https://y.qq.com',
      Referer: 'https://y.qq.com/n/yqq/playlist/5334030115.html' 
    }
  })
  ctx.body = res;
})

function loop(mids, mvs) {
  let p = [];
  console.log('---1---');
  mids.forEach((item, index) => {
    p.push(getMediaUrl(item, mvs[index]));
    // data.push(getMediaUrl(item, mvs[index]));
    // if (index === mids.length - 1) {
    //   resolve(data);
    // }
  });
  return Promise.all(p);
}

function getMediaUrl(mid, mv) {
  return new Promise(async (resolve, reject) => {
    let data = '';
    let url = `https://u.y.qq.com/cgi-bin/musicu.fcg?-=getplaysongvkey2800819821887257&g_tk=5381&loginUin=2282701371&hostUin=0&format=json&inCharset=utf8&outCharset=utf-8&notice=0&platform=yqq.json&needNewCode=0&data=%7B%22req%22%3A%7B%22module%22%3A%22CDN.SrfCdnDispatchServer%22%2C%22method%22%3A%22GetCdnDispatch%22%2C%22param%22%3A%7B%22guid%22%3A%224596621693%22%2C%22calltype%22%3A0%2C%22userip%22%3A%22%22%7D%7D%2C%22req_0%22%3A%7B%22module%22%3A%22vkey.GetVkeyServer%22%2C%22method%22%3A%22CgiGetVkey%22%2C%22param%22%3A%7B%22guid%22%3A%224596621693%22%2C%22songmid%22%3A%5B%22${mid}%22%5D%2C%22songtype%22%3A%5B0%5D%2C%22uin%22%3A%222282701371%22%2C%22loginflag%22%3A1%2C%22platform%22%3A%2220%22%7D%7D%2C%22comm%22%3A%7B%22uin%22%3A2282701371%2C%22format%22%3A%22json%22%2C%22ct%22%3A24%2C%22cv%22%3A0%7D%7D`;

    let res = await http.get(url);

    if (!res.req_0.data.midurlinfo[0]) {
      return res.req_0.data.msg;
    }

    let purl = res.req_0.data.midurlinfo[0].purl;
    let sips = res.req_0.data.sip;

    data = sips.map(item => {
      return item + purl;
    });
    if (!purl) {
      if (mv.vid) {
        data = [await getMvUrl(`https://y.qq.com/n/yqq/mv/v/${mv.vid}.html`)];
      } else {
        data = '收费歌曲，且没有mv文件';
      }
    }
    console.log('---2---');
    resolve(data);
  });
}

async function getMvUrl(url) {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  await page.goto(url, {
    waitUntil: 'networkidle0'
  });

  const html = await page.content();

  let src = $('video', html).attr('src');
  browser.close();
  return src;
}

module.exports = router;
