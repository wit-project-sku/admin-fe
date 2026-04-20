
export type KioskIconOption = {
  iconKey: string;
  label: string;
  color: string;
  Icon: string;
};

/** Hardcoded icon set bundled in the frontend — pick by `key` on apps & placements. */
export const KIOSK_APP_ICON_OPTIONS: KioskIconOption[] = [
  { iconKey: 'cart', label: '인사랑(준비중)', color: '#B1D5FF', Icon: '/assets/cart.svg' },
  { iconKey: 'money', label: '인사동 이벤트', color: '#E0B9ED', Icon: '/assets/money-3.svg' },
  { iconKey: 'food', label: "'인사' 뭐먹지", color: '#FA5346', Icon: '/assets/food.svg' },
  { iconKey: 'bag', label: "'인사' 뭐사지", color: '#98C7ED', Icon: '/assets/bag-2.svg' },
  { iconKey: 'house', label: '인사동미술관', color: '#91C69E', Icon: '/assets/house.svg' },
  { iconKey: 'TAX-FREE', label: 'TAX-FREE', color: '#EFEFEF', Icon: '/assets/tax.svg' },
  { iconKey: 'shape', label: '여기는 인사동', color: '#EFEFEF', Icon: '/assets/shapes.svg' },
  { iconKey: 'women', label: "안녕 '인사'", color: '#FFCCD1', Icon: '/assets/women.svg' },
  { iconKey: 'bird', label: "도와줘 '인사'", color: '#F5E5C4', Icon: '/assets/bird.svg' },
  { iconKey: 'map', label: '인사동지도', color: '#FFD18B', Icon: '/assets/map.svg' },
  { iconKey: 'money-2', label: '환율', color: '#FFE4BF', Icon: '/assets/money.svg' },
  { iconKey: 'car', label: '교통안내', color: '#DDEDAF', Icon: '/assets/car.svg' },
  { iconKey: 'house-2', label: '숙박안내', color: '#C8C8C8', Icon: '/assets/house-2.svg' },
  { iconKey: 'house-3', label: '고궁안내', color: '#ECD2B4', Icon: '/assets/house-3.svg' },
  { iconKey: 'camera', label: '스마트관광(준비중)', color: '#8CDCD8', Icon: '/assets/camera.svg' },
  { iconKey: 'camera-2', label: '', color: '#FE6C50', Icon: '/assets/camera_2.svg' },
  { iconKey: 'people', label: '화장실', color: '#77B6FF', Icon: '/assets/people.svg' },
  { iconKey: 'bag-2', label: '위드마켓', color: '#FFCC99', Icon: '/assets/bag.svg' },
  { iconKey: 'bot', label: "'인사' 모하지 (AI검색)", color: '#EBDECF', Icon: '/assets/bot.svg' },
  { iconKey: 'money-3', label: '인사동이벤트', color: '#98C7ED', Icon: '/assets/money-2.svg' },
  { iconKey: 'map-2', label: '오색시장 지도', color: '#FDD089', Icon: '/assets/map.png' },
  { iconKey: 'money-8', label: '환율', color: '#FFB2C5', Icon: '/assets/money.png' },
  { iconKey: 'shape-2', label: '여기는 오색시장', color: '#FFA565', Icon: '/assets/shape-2.svg' },
  { iconKey: 'shape-3', label: 'K-컬처(준비중)', color: '#FFA7A8', Icon: '/assets/shape-3.svg' },
   { iconKey: 'bot-2', label: "'정이' 모하지 (AI검색)", color: '#1C7BD4', Icon: '/assets/bot-2.svg' },
   { iconKey: 'door', label: '정이 도와줘', color: '#9AEA96', Icon: '/assets/door.svg' },
   { iconKey: 'money-4', label: '시장 이벤트', color: '#FFDB65', Icon: '/assets/money-4.svg' },
   { iconKey: 'tax-2', label: '텍스프리', color: '#FF8FCD', Icon: '/assets/tax-2.svg' },
   { iconKey: 'sign', label: '교통안내', color: '#9C8CE4', Icon: '/assets/sign.svg' },
   { iconKey: 'map-3', label: '전국 휴게소', color: '#5893FF', Icon: '/assets/map-2.svg' },
   { iconKey: 'women-2', label: '안녕 정이', color: '#DBC7FF', Icon: '/assets/women-2.svg' },
   { iconKey: 'bag-3', label: '정이 뭐사지?', color: '#FFA680', Icon: '/assets/bag-3.svg' },
    { iconKey: 'food-2', label: "'정이' 뭐먹지", color: '#FF8486', Icon: '/assets/food-2.svg' },
       { iconKey: 'shape-4', label: '지역화폐', color: '#94DFFF', Icon: '/assets/shape-4.svg' },
       { iconKey: 'car-2', label: '전국도로교통상황', color: '#FFB347', Icon: '/assets/car-2.svg' },
       { iconKey: 'door-2', label: "도와줘 '휴'", color: '#FF94AB', Icon: '/assets/door-2.svg' },
       { iconKey: 'food-3', label: "'휴' 뭐먹지)", color: '#FF8724', Icon: '/assets/food-3.svg' },
       { iconKey: 'star', label: '준비중', color: '#9CDBFF', Icon: '/assets/star.svg' },
       { iconKey: 'shape-5', label: '전국시장(준비중)', color: '#87624A', Icon: '/assets/shape-5.svg' },
       { iconKey: 'house-4', label: '화성휴게소 지도', color: '#FFFFFF', Icon: '/assets/house-4.svg' },
       { iconKey: 'tree', label: "'휴' 뭐사지", color: '#A7D6FF', Icon: '/assets/tree.svg' },
       { iconKey: 'tax-3', label: "TAX-FREE", color: '#6FC3FF', Icon: '/assets/tax-3.svg' },
       { iconKey: 'tree-2', label: '화성휴게소', color: '#D4FFA7', Icon: '/assets/tree-2.svg' },
       { iconKey: 'face', label: 'K-컬처(준비중)', color: '#FFBD40', Icon: '/assets/face.svg' },
       { iconKey: 'map-8', label: '스마트 관광', color: '#FF4000', Icon: '/assets/map-3.svg' },
       { iconKey: 'shape-6', label: '환율', color: '#FFE893', Icon: '/assets/shape-6.svg' },
       { iconKey: 'money-5', label: '화성시 이벤트', color: '#FBADDA', Icon: '/assets/money-5.svg' },
       { iconKey: 'bot-3', label: "안녕 '휴'", color: '#FDDAA6', Icon: '/assets/bot-3.svg' },
       { iconKey: 'people-2', label: '화장실', color: '#6FB6D4', Icon: '/assets/people-2.svg' },
       { iconKey: 'bird-2', label: '전통시장', color: '#94A7F4', Icon: '/assets/bird-2.svg' },
       { iconKey: 'weather', label: '날씨', color: '#bbbbbbff', Icon: '/assets/weather.svg' },
       { iconKey: 'search', label: '검색', color: '#fcfcfcff', Icon: '/assets/search.svg' },
       { iconKey: 'home', label: '홈', color: '#FE6C50', Icon: '/assets/home.svg' },
       { iconKey: 'language', label: '언어', color: '#FE6C50', Icon: '/assets/kr.svg' }
];

const ICON_MAP = new Map(KIOSK_APP_ICON_OPTIONS.map((o) => [o.iconKey, o]));

export function getKioskIconOption(iconKey: string): KioskIconOption | undefined {
  return ICON_MAP.get(iconKey);
}
