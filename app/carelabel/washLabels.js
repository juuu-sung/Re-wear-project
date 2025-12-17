 
const careLabelData = [
  { id: 1, code: 'water_wash_30', img: require("../../assets/careLabels/wash/water_wash_30.png"), desc: "물의 온도 최대 30°C에서 세탁기로 약하게 세탁할 수 있다." },
  { id: 2, code: 'water_wash_30_weak', img: require("../../assets/careLabels/wash/water_wash_30_weak.png"), desc: "물의 온도 최대 30°C에서 세탁기로 약하게 세탁 할 수 있다." },
  { id: 3, code: 'water_wash_30_very_weak', img: require("../../assets/careLabels/wash/water_wash_30_very_weak.png"), desc: "물의 온도 최대 30°C에서 세탁기로 매우 약하게 세탁 할 수 있다." },
  { id: 4, code: 'water_wash_40', img: require("../../assets/careLabels/wash/water_wash_40.png"), desc: "물의 온도 최대 40°C에서 세탁기로 일반 세탁 할 수 있다." },
  { id: 5, code: 'water_wash_40_weak', img: require("../../assets/careLabels/wash/water_wash_40_weak.png"), desc: "물의 온도 최대 40°C에서 세탁기로 약하게 세탁 할 수 있다." },
  { id: 6, code: 'water_wash_40_very_weak', img: require("../../assets/careLabels/wash/water_wash_40_very_weak.png"), desc: "물의 온도 최대 40°C에서 세탁기로 매우 약하게 세탁 할 수 있다." },
  { id: 7, code: 'water_wash_50', img: require("../../assets/careLabels/wash/water_wash_50.png"), desc: "물의 온도 최대 50°C에서 세탁기로 일반 세탁 할 수 있다." },
  { id: 8, code: 'water_wash_50_weak', img: require("../../assets/careLabels/wash/water_wash_50_weak.png"), desc: "물의 온도 최대 50°C에서 세탁기로 약하게 세탁 할 수 있다." },
  { id: 9, code: 'water_wash_60', img: require("../../assets/careLabels/wash/water_wash_60.png"), desc: "물의 온도 최대 60°C에서 세탁기로 일반 세탁 할 수 있다." },
  { id: 10, code: 'water_wash_60_weak', img: require("../../assets/careLabels/wash/water_wash_60_weak.png"), desc: "물의 온도 최대 60°C에서 세탁기로 약하게 세탁 할 수 있다." },
  { id: 11, code: 'water_wash_70', img: require("../../assets/careLabels/wash/water_wash_70.png"), desc: "물의 온도 최대 70°C에서 세탁기로 일반 세탁 할 수 있다." },
  { id: 12, code: 'water_wash_95', img: require("../../assets/careLabels/wash/water_wash_95.png"), desc: "물의 온도 최대 95°C에서 세탁기로 일반 세탁 할 수 있다." },
  { id: 13, code: 'water_wash_30_neutral', img: require("../../assets/careLabels/wash/water_wash_30_neutral.png"), desc: "물의 온도 최대 30°C에서 세탁기로 약하게 세탁 할 수 있다.\n세제 종류는 중성 세제를 사용한다." },
  { id: 14, code: 'water_wash_no', img: require("../../assets/careLabels/wash/water_wash_no.png"), desc: "물세탁을 하면 안 된다." },
  { id: 15, code: 'hand_wash_30', img: require("../../assets/careLabels/wash/hand_wash_30.png"), desc: "물의 온도 최대 30°C에서 손으로 약하게 손세탁 할 수 있다.\n(세탁기 사용 불가)" },
  { id: 16, code: 'hand_wash_30_very_weak', img: require("../../assets/careLabels/wash/hand_wash_30_very_weak.png"), desc: "물의 온도 최대 30°C에서 손으로 매우 약하게 손세탁 할 수 있다.\n(세탁기 사용 불가)\n세제 종류는 중성 세제를 사용한다." },
  { id: 17, code: 'hand_wash_40', img: require("../../assets/careLabels/wash/hand_wash_40.png"), desc: "물의 온도 최대 40°C에서 손으로 약하게 손세탁 할 수 있다.\n(세탁기 사용 불가)" },
  { id: 18, code: 'hand_wash_40_very_weak', img: require("../../assets/careLabels/wash/hand_wash_40_very_weak.png"), desc: "물의 온도 최대 40°C에서 손으로 매우 약하게 손세탁 할 수 있다.\n(세탁기 사용 불가)\n세제 종류는 중성 세제를 사용한다." },
  { id: 19, code: 'wet_clean_w', img: require("../../assets/careLabels/wash/wet_clean_w.png"), desc: "웨트클리닝 전문점에서 일반 웨트클리닝 할 수 있다." },
  { id: 20, code: 'wet_clean_w_weak', img: require("../../assets/careLabels/wash/wet_clean_w_weak.png"), desc: "웨트클리닝 전문점에서 약하게 웨트클리닝 할 수 있다." },
  { id: 21, code: 'wet_clean_w_very_weak', img: require("../../assets/careLabels/wash/wet_clean_w_very_weak.png"), desc: "웨트클리닝 전문점에서 매우 약하게 웨트클리닝 할 수 있다." },
  { id: 22, code: 'wet_clean_no', img: require("../../assets/careLabels/wash/wet_clean_no.png"), desc: "웨트클리닝을 하면 안 된다." },
  { id: 23, code: 'bleach_any', img: require("../../assets/careLabels/wash/bleach_any.png"), desc: "염소계 또는 산소계 표백제로 표백 할 수 있다." },
  { id: 24, code: 'bleach_oxygen_only', img: require("../../assets/careLabels/wash/bleach_oxygen_only.png"), desc: "산소계 표백제로만 표백 할 수 있다." },
  { id: 25, code: 'bleach_chlorine_only', img: require("../../assets/careLabels/wash/bleach_chlorine_only.png"), desc: "염소계 표백제로만 표백 할 수 있다." },
  { id: 26, code: 'bleach_no_chlorine_allowed', img: require("../../assets/careLabels/wash/bleach_no_chlorine_allowed.png"), desc: "염소계 표백제로 표백하면 안 된다." },
  { id: 27, code: 'bleach_no_oxygen_allowed', img: require("../../assets/careLabels/wash/bleach_no_oxygen_allowed.png"), desc: "산소계 표백제로 표백하면 안 된다." },
  { id: 28, code: 'bleach_no', img: require("../../assets/careLabels/wash/bleach_no.png"), desc: "염소계 또는 산소계 표백제로 표백하면 안 된다." },
  { id: 29, code: 'dry_clean_p', img: require("../../assets/careLabels/wash/dry_clean_p.png"), desc: "테트라클로로에텐(퍼클로로에틸렌), 석유계 및 실리콘 계 용제 등\n적합한 용제로 일반 드라이클리닝 할 수 있다." },
  { id: 30, code: 'dry_clean_p_weak', img: require("../../assets/careLabels/wash/dry_clean_p_weak.png"), desc: "테트라클로로에텐(퍼클로로에틸렌), 석유계 및 실리콘 계 용제 등\n적합한 용제로 약하게 드라이클리닝 할 수 있다." },
  { id: 31, code: 'dry_clean_f', img: require("../../assets/careLabels/wash/dry_clean_f.png"), desc: "탄화수소(석유계) 용제로 일반 드라이클리닝 할 수 있다." },
  { id: 32, code: 'dry_clean_f_weak', img: require("../../assets/careLabels/wash/dry_clean_f_weak.png"), desc: "탄화수소(석유계) 용제로 약하게 드라이클리닝 할 수 있다." },
  { id: 33, code: 'dry_clean_methane', img: require("../../assets/careLabels/wash/dry_clean_methane.png"), desc: "다이부톡시메테인(메테인계) 용제로 일반 드라이클리닝 할 수 있다." },
  { id: 34, code: 'dry_clean_methane_weak', img: require("../../assets/careLabels/wash/dry_clean_methane_weak.png"), desc: "다이부톡시메테인(메테인계) 용제로 약하게 드라이클리닝 할 수 있다." },
  { id: 35, code: 'dry_clean_silicon', img: require("../../assets/careLabels/wash/dry_clean_silicon.png"), desc: "데카메틸사이클로펜타실록세인(실리콘계) 용제로\n일반 드라이클리닝 할 수 있다." },
  { id: 36, code: 'dry_clean_silicon_weak', img: require("../../assets/careLabels/wash/dry_clean_silicon_weak.png"), desc: "데카메틸사이클로펜타실록세인(실리콘계) 용제로\n약하게 드라이클리닝 할 수 있다." },
  { id: 37, code: 'dry_clean_specialist', img: require("../../assets/careLabels/wash/dry_clean_specialist.png"), desc: "드라이클리닝을 특수 전문점에서만 할 수 있다.\n특수 전문점이란 취급하기 어려운 가죽, 모피, 헤어 등의 제품을\n전문적으로 취급하는 업소를 말한다." },
  { id: 38, code: 'dry_clean_no', img: require("../../assets/careLabels/wash/dry_clean_no.png"), desc: "드라이클리닝 금지." },
  { id: 39, code: 'dry_flat_sun', img: require("../../assets/careLabels/wash/dry_flat_sun.png"), desc: "탈수하지 않고, 뉘어서 햇빛에서 자연 건조한다." },
  { id: 40, code: 'dry_flat_shade', img: require("../../assets/careLabels/wash/dry_flat_shade.png"), desc: "탈수하지 않고, 뉘어서 그늘에서 자연 건조한다." },
  { id: 41, code: 'dry_line_sun', img: require("../../assets/careLabels/wash/dry_line_sun.png"), desc: "옷걸이에 걸어 햇빛에서 자연 건조한다." },
  { id: 42, code: 'dry_line_shade', img: require("../../assets/careLabels/wash/dry_line_shade.png"), desc: "옷걸이에 걸어 그늘에서 자연 건조한다." },
  { id: 43, code: 'dry_drip_line_sun', img: require("../../assets/careLabels/wash/dry_drip_line_sun.png"), desc: "탈수하지 않고, 옷걸이에 걸어 햇빛에서 자연 건조한다." },
  { id: 44, code: 'dry_drip_line_shade', img: require("../../assets/careLabels/wash/dry_drip_line_shade.png"), desc: "탈수하지 않고, 옷걸이에 걸어 그늘에서 자연 건조한다." },
  { id: 45, code: 'dry_drip_flat_sun', img: require("../../assets/careLabels/wash/dry_drip_flat_sun.png"), desc: "뉘어서 햇빛에서 자연 건조한다." },
  { id: 46, code: 'dry_drip_flat_shade', img: require("../../assets/careLabels/wash/dry_drip_flat_shade.png"), desc: "뉘어서 그늘에서 자연 건조한다." },
  { id: 47, code: 'tumble_dry_low_60', img: require("../../assets/careLabels/wash/tumble_dry_low_60.png"), desc: "60°C를 초과하지 않는 온도에서 기계건조 할 수 있다." },
  { id: 48, code: 'tumble_dry_high_80', img: require("../../assets/careLabels/wash/tumble_dry_high_80.png"), desc: "80°C를 초과하지 않는 온도에서 기계건조 할 수 있다." },
  { id: 49, code: 'tumble_dry_no', img: require("../../assets/careLabels/wash/tumble_dry_no.png"), desc: "건조기 사용 금지. 자연 건조만 허용." },
  { id: 50, code: 'wring_weak', img: require("../../assets/careLabels/wash/wring_weak.png"), desc: "손으로 짜는 경우에는 약하게 짜고,\n원심 탈수기인 경우는 짧은 시간 안에 탈수한다." },
  { id: 51, code: 'wring_no', img: require("../../assets/careLabels/wash/wring_no.png"), desc: "짜면 안 된다." },
  { id: 52, code: 'iron_low_120', img: require("../../assets/careLabels/wash/iron_low_120.png"), desc: "다리미 온도 최대 120°C로 다림질 할 수 있다." },
  { id: 53, code: 'iron_low_120_cloth', img: require("../../assets/careLabels/wash/iron_low_120_cloth.png"), desc: "다리미 온도 최대 120°C로 헝겊을 덮고 다림질 할 수 있다." },
  { id: 54, code: 'iron_medium_160', img: require("../../assets/careLabels/wash/iron_medium_160.png"), desc: "다리미 온도 최대 160°C로 다림질 할 수 있다." },
  { id: 55, code: 'iron_medium_160_cloth', img: require("../../assets/careLabels/wash/iron_medium_160_cloth.png"), desc: "다리미 온도 최대 160°C로 헝겊을 덮고 다림질 할 수 있다." },
  { id: 56, code: 'iron_high_210', img: require("../../assets/careLabels/wash/iron_high_210.png"), desc: "다리미 온도 최대 210°C로 다림질 할 수 있다." },
  { id: 57, code: 'iron_high_210_cloth', img: require("../../assets/careLabels/wash/iron_high_210_cloth.png"), desc: "다리미 온도 최대 210°C로 헝겊을 덮고 다림질 할 수 있다." },
  { id: 58, code: 'iron_no', img: require("../../assets/careLabels/wash/iron_no.png"), desc: "다림질을 하면 안 된다." },
  { id: 59, code: 'iron_no_steam', img: require("../../assets/careLabels/wash/iron_no_steam.png"), desc: "다리미 온도 최대 120°C로 스팀을 가하지 않고 다림질 할 수 있다.\n스팀 다림질은 되돌릴 수 없는 손상을 일으킬 수 있다." },
  { id: 60, code: 'fire_warning', img: require("../../assets/careLabels/wash/fire_warning.png"), desc: "불꽃 주의." },
];

const createGroup = (ids) => {
  const idSet = new Set(ids);
  return careLabelData.filter((label) => idSet.has(label.id));
};

const WASH_IDS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18];
const BLEACH_IDS = [23, 24, 25, 26, 27, 28];
const IRON_IDS = [52, 53, 54, 55, 56, 57, 58, 59];
const DRY_IDS = [39, 40, 41, 42, 43, 44, 45, 46, 47, 48, 49, 50, 51, 60];
const TUMBLE_IDS = [19, 20, 21, 22, 29, 30, 31, 32, 33, 34, 35, 36, 37, 38];

export const washLabels = createGroup(WASH_IDS);
export const bleachLabels = createGroup(BLEACH_IDS);
export const ironLabels = createGroup(IRON_IDS);
export const dryLabels = createGroup(DRY_IDS);
export const tumbleLabels = createGroup(TUMBLE_IDS);
export const allCareLabels = careLabelData;
