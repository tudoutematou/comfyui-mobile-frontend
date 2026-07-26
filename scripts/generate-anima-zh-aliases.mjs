import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(scriptDir, '..');
const csvPath = process.argv[2];
const characterDataPath =
  process.argv[3] ??
  path.resolve(projectRoot, '..', 'Comfyui-Anima-Tools', 'js', 'character_data.js');
const outputPath =
  process.argv[4] ?? path.resolve(projectRoot, 'src', 'data', 'animaZhAliases.json');

if (!csvPath) {
  throw new Error(
    'Usage: node scripts/generate-anima-zh-aliases.mjs <danbooru_tags.csv> [character_data.js] [output.json]',
  );
}

function parseCsvLine(line) {
  const result = [];
  let field = '';
  let quoted = false;
  for (let index = 0; index < line.length; index += 1) {
    const character = line[index];
    if (character === '"') {
      if (quoted && line[index + 1] === '"') {
        field += '"';
        index += 1;
      } else {
        quoted = !quoted;
      }
    } else if (character === ',' && !quoted) {
      result.push(field);
      field = '';
    } else {
      field += character;
    }
  }
  result.push(field);
  return result;
}

function normalizeTag(value) {
  return String(value ?? '')
    .replace(/\\([()])/g, '$1')
    .normalize('NFKC')
    .toLocaleLowerCase()
    .replace(/[_:]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function splitCharacterTag(tag) {
  const match = tag.match(/^(.+)_\((.+)\)$/);
  return match
    ? { name: normalizeTag(match[1]), copyright: normalizeTag(match[2]) }
    : { name: normalizeTag(tag), copyright: '' };
}

const forbiddenAliasCharacters =
  /[A-Za-zぁ-ゖァ-ヺー\u1100-\u11ff\u3130-\u318f\uac00-\ud7af]/u;
const traditionalHints =
  /[來們個為麗樂麼義習鄉書買亂亞產畝親億僅從侖倉儀價眾優會傘偉傳傷倫體餘俠偵側兒黨蘭關興獸軍農馮沖決況凍鳳憑擊劃劉創別務動勢勁勞勻華協單賣盧衛卻廳歷壓厭廁縣參雙發變疊葉號後嗎聽啟吳員嗚詠園國圖圓場塊堅壇壩壯聲處備復夠頭夾奪奮獎婦媽孫學寧寶實審寵將爾層歲幣師帳帶幫慶龐廢開異張歸錄當徹憶憂態總戀惡懸驚願戲戰戶護報擬擁攔撥擇掛損換據搖攝敵數斷無舊時顯晉曉術機殺雜權條來楊極構槍櫃標樣橋夢檢樓歡歐殘畢氣漢湯溝沒潔濃濟灣滅燈靈灶災煉熱愛爺牽獨狹獅環現瓊電畫暢療監盤著礦碼禮禍離種稱穩窩競筆籠類糧緊紅纖約級紀純綱納縱紋紹終組細織經繡統繼續綠纜緝編緣縛縫網羅罰職聯聰肅腸膚勝臟腦腳臉脫臘膩騰艦藝節蘇範蕩榮藥蓮獲營薩藍慮虛蟲雖蝕補裝見觀規覺覽觸計訂認讓議訊記講許論設訪證評識訴詞譯試誠話誕詢該詳語誤說請諸諾讀課誰調談謀謊謎謝貝負貢財責賢敗貨質販貪貧購貫貼貴貸費賀賊資賦賞賴賺賽贊贈趙趕趨躍踐車軌轉輪軟輕載較輔輛輩輝輯輸邊遼達遷過運還這進遠違連遲選遜遞邏遺郵鄰鄭釀釋鑒鐘鋼鑰鉤鈕錢鐵鈴銅銘鋁鎧銀鋪鏈銷鎖鋒銳錯錫鑼錦鍵鍛鎮鏡長門閉問闖閑間悶閘閣閱隊陽陰陣階際陸陳險隨隱難雛霧靜頂項順須顧頓頒頌預領頸頻題顏額風飛飯飲飽飾餅養館馬馴馳驅駁驢駛駐駕罵驕驗騎騙騷魚鮮鳥雞鳴鴨鴿鵝鶴鷹麥黃齊齒齡龍]/u;

function extractChineseAliases(value) {
  return Array.from(
    new Set(
      String(value ?? '')
        .split(',')
        .map((alias) => alias.trim())
        .filter(
          (alias) =>
            /[\u3400-\u9fff]/u.test(alias) &&
            !forbiddenAliasCharacters.test(alias) &&
            alias.length <= 40,
        ),
    ),
  );
}

function chooseDisplayAlias(aliases) {
  return [...aliases].sort((left, right) => {
    const leftTraditional = traditionalHints.test(left) ? 1 : 0;
    const rightTraditional = traditionalHints.test(right) ? 1 : 0;
    if (leftTraditional !== rightTraditional) return leftTraditional - rightTraditional;
    return 0;
  })[0];
}

function parseCharacterData(source) {
  const start = source.indexOf('[');
  const end = source.lastIndexOf('];');
  if (start < 0 || end < 0) throw new Error('Unable to parse Anima character_data.js');
  return JSON.parse(source.slice(start, end + 1));
}

const csvRows = fs
  .readFileSync(csvPath, 'utf8')
  .replace(/^\uFEFF/, '')
  .split(/\r?\n/)
  .slice(1)
  .filter(Boolean)
  .map(parseCsvLine);

const characterTags = new Map();
const copyrightTags = new Map();
for (const [tag, category, , aliasValue] of csvRows) {
  const aliases = extractChineseAliases(aliasValue);
  if (aliases.length === 0) continue;
  if (category === '4') {
    const parsed = splitCharacterTag(tag);
    const entries = characterTags.get(parsed.name) ?? [];
    entries.push({ ...parsed, aliases });
    characterTags.set(parsed.name, entries);
  } else if (category === '3') {
    copyrightTags.set(normalizeTag(tag), aliases);
  }
}

const manualCharacters = {
  'cartethyia|wuthering waves': {
    name_zh: '卡提希娅',
    aliases: ['卡提希娅', '卡提希亚'],
  },
};

const characters = {};
const copyrights = {};
const characterData = parseCharacterData(
  fs.readFileSync(characterDataPath, 'utf8').replace(/^\uFEFF/, ''),
);

for (const item of characterData) {
  const originalName = normalizeTag(item.name);
  const copyright = normalizeTag(item.copyright);
  const copyrightSuffix = copyright ? ` (${copyright})` : '';
  const name =
    copyrightSuffix && originalName.endsWith(copyrightSuffix)
      ? originalName.slice(0, -copyrightSuffix.length)
      : originalName;
  const key = `${originalName}|${copyright}`;
  const candidates = characterTags.get(name) ?? [];
  const exact = candidates.find((candidate) => candidate.copyright === copyright);
  const candidate = exact ?? candidates.find((entry) => !entry.copyright) ?? candidates[0];
  const manual = manualCharacters[key];
  const aliases = Array.from(
    new Set([...(manual?.aliases ?? []), ...(candidate?.aliases ?? [])]),
  );
  if (aliases.length > 0) {
    characters[key] = {
      name_zh: manual?.name_zh ?? chooseDisplayAlias(aliases),
      aliases,
    };
  }

  if (copyright && !copyrights[copyright]) {
    const copyrightAliases = copyrightTags.get(copyright) ?? [];
    if (copyrightAliases.length > 0) {
      copyrights[copyright] = {
        name_zh: chooseDisplayAlias(copyrightAliases),
        aliases: copyrightAliases,
      };
    }
  }
}

const output = {
  source: 'newtextdoc1111/danbooru-tag-csv',
  generated_at: new Date().toISOString(),
  characters,
  copyrights,
};
fs.mkdirSync(path.dirname(outputPath), { recursive: true });
fs.writeFileSync(outputPath, `${JSON.stringify(output)}\n`, 'utf8');

console.log(
  JSON.stringify(
    {
      character_total: characterData.length,
      character_localized: Object.keys(characters).length,
      copyright_localized: Object.keys(copyrights).length,
      output: outputPath,
    },
    null,
    2,
  ),
);
