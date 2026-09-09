const MATERIAL_LABELS = {
  cotton: "면", nylon: "나일론", polyester: "폴리에스터", rayon: "레이온",
  silk: "실크", spandex: "스판덱스", synthetic: "합성섬유", wool: "울",
  cashmere: "캐시미어", linen: "리넨", tencel: "텐셀", modal: "모달", acrylic: "아크릴",
};

export function materialLabel(value) {
  const name = String(value ?? "").trim();
  return MATERIAL_LABELS[name.toLowerCase()] || name;
}

export function materialCandidates(breakdown) {
  if (!Array.isArray(breakdown)) return [];
  return breakdown.flatMap((item) => {
    const name = item?.name ?? item?.label ?? item?.material;
    const prob = item?.prob ?? item?.confidence ?? item?.score;
    if (!name || typeof prob !== "number" || !Number.isFinite(prob) || prob < 0 || prob > 1) return [];
    return [{
      name: String(name), label: materialLabel(name), prob,
      passed: typeof item.passed === "boolean" ? item.passed : prob >= 0.5,
    }];
  }).sort((a, b) => b.prob - a.prob);
}

export function predictionScore(prob) {
  // 반올림으로 0% 또는 100%가 되어 확정적인 결과처럼 보이지 않게 한다.
  if (prob < 0.01) return "1% 미만";
  if (prob > 0.99) return "99% 초과";
  return `${Math.round(prob * 100)}%`;
}
