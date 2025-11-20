import { allCareLabels } from '../carelabel/washLabels';

// 기존 washLabels 데이터에서 code 값을 key 로 써서 조회 맵 생성
export const careLabelInfo = allCareLabels.reduce((acc, cur) => {
  if (cur.code) {
    acc[cur.code] = { description: cur.desc, image: cur.img };
  }
  return acc;
}, {});

export const defaultCareLabelInfo = {
  description: '설명이 등록되지 않은 기호입니다.',
  image: null,
};
