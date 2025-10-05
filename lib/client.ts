import axios from 'axios';

// .env 파일에 저장한 API 기본 주소를 가져옵니다.
const API_BASE = process.env.EXPO_PUBLIC_API_BASE;

// axios 인스턴스 생성
const client = axios.create({
  baseURL: API_BASE,
  headers: {
    'Content-Type': 'application/json',
  },
});

export default client;