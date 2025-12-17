// generate-csv-list.js
/**
 * 📦 자동 CSV 리스트 생성기
 * assets/data 폴더 안의 모든 "_.csv" 파일을 찾아서
 * index.js에서 사용할 require() 리스트를 자동 생성합니다.
 */

const fs = require("fs");
const path = require("path");

//  CSV 파일들이 들어있는 폴더
const dataDir = path.join(__dirname, "assets", "data");

//  결과 저장 경로
const outputFile = path.join(__dirname, "app", "(tabs)", "recycle", "csvList.js");

const files = fs
  .readdirSync(dataDir)
  .filter((f) => f.endsWith("_bin.csv"))
  .map(
    (f) => `  require("../../../assets/data/${f.replace(/"/g, '\\"')}"),`
  );

if (files.length === 0) {
  console.error("❌ _.csv 파일이 없습니다!");
  process.exit(1);
}

const content = `// ⚙️ 자동 생성됨 (${new Date().toLocaleString()})
// 이 파일은 generate-csv-list.js로 생성됩니다.

export const csvCandidates = [
${files.join("\n")}
];
`;

fs.writeFileSync(outputFile, content, "utf8");
console.log(` CSV 리스트 생성 완료: ${outputFile}`);
console.log(`📄 총 ${files.length}개 파일 포함됨.`);
