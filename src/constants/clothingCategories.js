export const MODEL_CATEGORIES = [
  "블라우스", "가디건", "코트", "재킷", "점퍼", "셔츠",
  "스웨터", "티셔츠", "조끼", "하의", "원피스", "점프수트",
];

export const CLOTHING_CATEGORIES = [...MODEL_CATEGORIES, "기타", "미분류"];
export const ALL_CATEGORIES = "전체";

// 저장된 큰 분류와 사용자 정의 옷장도 계속 선택할 수 있게 합친다.
export function mergeClothingCategories(...lists) {
  return [...new Set([
    ...CLOTHING_CATEGORIES,
    ...lists.flatMap((list) => Array.isArray(list) ? list : []),
  ].filter((name) => typeof name === "string" && name.trim() && name !== ALL_CATEGORIES))];
}

export function filterClothesByCategory(items, selected) {
  return selected === ALL_CATEGORIES ? items : items.filter((item) => item.category === selected);
}
