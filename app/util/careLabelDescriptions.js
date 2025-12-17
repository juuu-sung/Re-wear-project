import { allCareLabels } from '../carelabel/washLabels';

 
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
