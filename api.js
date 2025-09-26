// api.js

import axios from 'axios';

// 벡엔드 API 서버 주소 (벡엔드 담당자와 상의 후 확정)
// 지금은 개발 환경에 맞는 주석을 풀어서 사용하세요.
// const API_BASE = 'http://10.0.2.2:8000'; // 안드로이드 에뮬레이터용
const API_BASE = 'http://<백엔드 담당자 IP 주소>:8000'; // iOS 시뮬레이터 및 실제 폰용

const apiClient = axios.create({
  baseURL: API_BASE,
  headers: {
    'Content-Type': 'application/json',
  },
});

export default apiClient;