/**
 * @file script.js
 * @description 소셜 미디어 대시보드의 모든 동작을 제어하는 메인 스크립트.
 *
 * 이 파일은 크게 4가지 역할을 담당함:
 *   1. 다크 모드 초기화 및 토글 (테마 상태를 localStorage에 저장·복원)
 *   2. 카드 데이터 관리 (mainCardsData, overviewCardsData 배열)
 *   3. 카드 HTML 생성 (createMainCardHTML, createOverviewCardHTML 함수)
 *   4. DOM 렌더링 (renderCards 함수로 컨테이너에 카드 삽입)
 *
 * 의존성(Dependencies):
 *   - index.html: id="darkModeToggle" 버튼, id="main-cards-container" div, id="overview-cards-container" div
 *   - index.html <head>: Tailwind CSS CDN (모든 스타일 클래스의 원천)
 *   - index.css (또는 <style> 태그): .instagram-border::before, .toggle-track, .toggle-thumb 커스텀 CSS
 *
 * @author Danny Seo
 */

// =====================================================
// [섹션 A] 다크 모드 초기화 및 토글
// =====================================================

// ─── 즉시 실행 함수(IIFE): 페이지 로드 즉시 저장된 테마를 적용 ───
// 괄호()로 감싸고 마지막에 ()를 붙이면 함수 정의 즉시 실행됨
//
// ★ 왜 IIFE를 쓰나?
//   일반 함수로 만들면 실수로 나중에 다시 호출될 수 있고, 내부 변수가 전역에 노출됨.
//   IIFE는 딱 한 번만 실행되고 내부 변수는 외부에서 접근 불가 → 안전하고 깔끔함.
(function () {
  // localStorage = 브라우저의 작은 메모장. 새로고침해도 데이터가 살아있음
  const savedTheme = localStorage.getItem('theme'); // 이전에 저장한 테마 읽기
  const toggleBtn = document.getElementById('darkModeToggle');

  // ─── 기본값(Default)이 다크 모드로 바뀐 핵심 로직 ───
  // 비유: 집에 처음 이사 오면 무조건 조명이 켜진(dark) 상태.
  //       사용자가 명시적으로 'light'를 선택했을 때만 조명을 끔.
  if (savedTheme === 'light') {
    // html 최상위 태그에서 'dark' 클래스 제거
    // → Tailwind의 dark: 스타일이 전부 비활성화되어 라이트 모드로 전환됨
    document.documentElement.classList.remove('dark');

    // 접근성: 스크린 리더에게 "토글이 꺼진 상태(라이트 모드)"임을 알림
    toggleBtn.setAttribute('aria-checked', 'false');
  }
  // savedTheme === 'dark' 이거나 null(최초 방문)이면 아무것도 안 함
  // → HTML에 이미 class="dark"가 있으므로 다크 모드가 그대로 유지됨
})();


/**
 * 다크 모드 토글 버튼 클릭 시 호출되는 함수.
 * index.html의 버튼 태그에서 onclick="toggleDarkMode()" 형태로 직접 연결되어 있음.
 *
 * 비유: 방 안의 조명 스위치를 누르는 것.
 *       한 번 누르면 켜지고(다크 ON), 다시 누르면 꺼짐(라이트 ON).
 *
 * ★ 작동 순서:
 *   1. <html> 태그의 'dark' 클래스를 토글 → Tailwind의 모든 dark: 스타일 일괄 전환
 *   2. aria-checked 속성 업데이트 → 스크린 리더가 현재 상태를 올바르게 안내
 *   3. localStorage에 저장 → 새로고침 또는 재방문 시 IIFE가 이 값을 읽어 복원
 *
 * @function
 * @returns {void} 반환값 없음.
 *                 HTML 클래스 변경, aria 속성 변경, localStorage 저장이라는
 *                 '부수 효과(Side Effect)'만 발생시킴.
 */
function toggleDarkMode() {
  // classList.toggle('dark'):
  //   'dark' 클래스가 없으면 → 추가하고 true 반환 (다크모드 ON)
  //   'dark' 클래스가 있으면 → 제거하고 false 반환 (다크모드 OFF)
  const isDark = document.documentElement.classList.toggle('dark');

  // 접근성 업데이트: 변경된 상태를 스크린 리더가 읽을 수 있도록 동기화
  document.getElementById('darkModeToggle').setAttribute('aria-checked', String(isDark));

  // localStorage에 현재 테마를 저장 → 새로고침해도 설정이 유지됨
  localStorage.setItem('theme', isDark ? 'dark' : 'light');
}


// =====================================================
// [섹션 B] 카드 데이터 배열 (Data Layer)
// 비유: 식당의 '메뉴판'. 여기만 수정하면 화면이 자동으로 바뀜.
//       HTML을 직접 건드리지 않아도 됨.
// =====================================================

/**
 * @typedef {Object} MainCard
 * @description
 * 섹션 1(메인 팔로워 카드)을 구성하는 데이터 객체의 타입 정의.
 * mainCardsData 배열에 새 카드를 추가할 때 반드시 이 구조를 따라야 함.
 *
 * ★ 새 플랫폼 카드를 추가하는 방법:
 *   아래 구조를 복사해서 mainCardsData 배열 안에 붙여넣고 값만 변경하면 됨.
 *   HTML은 건드리지 않아도 자동으로 화면에 표시됨.
 *
 * @property {string}      icon             - 플랫폼 아이콘 이미지의 상대 경로.
 *                                           (예: 'images/icon-facebook.svg')
 *                                           images/ 폴더에 해당 SVG 파일이 존재해야 함.
 * @property {string}      handle           - 플랫폼 계정의 핸들명 또는 채널명.
 *                                           아이콘 오른쪽에 작게 표시됨.
 *                                           (예: '@nathanf', 'Nathan F.')
 * @property {string}      count            - 화면 중앙에 크게 표시할 팔로워/구독자 수.
 *                                           숫자지만 '11k'처럼 약어 표현도 가능하므로 string 타입 사용.
 *                                           (예: '1987', '11k', '8239')
 * @property {string}      label            - count 바로 아래에 표시할 단위 레이블.
 *                                           (예: 'Followers', 'Subscribers')
 * @property {number}      change           - 오늘 하루의 증감 수치 (순수 숫자).
 *                                           양수(+)면 위 화살표(↑) + 초록색 텍스트 적용.
 *                                           음수(-)면 아래 화살표(↓) + 빨간색 텍스트 적용.
 *                                           changeText와 함께 쌍으로 관리해야 함. (예: -144)
 * @property {string}      changeText       - 화면에 실제로 표시되는 변화량 텍스트.
 *                                           change의 절댓값 + 단위로 미리 포맷된 문자열.
 *                                           부호(+/-)는 아이콘으로 표현하므로 여기엔 넣지 않음.
 *                                           (예: '12 Today', '144 Today')
 * @property {string}      ariaLabel        - 스크린 리더(시각 장애인 보조 도구)가 카드 전체를
 *                                           읽어줄 때 사용하는 텍스트. <article>의 aria-label 속성에 들어감.
 *                                           (예: '페이스북 팔로워 현황')
 * @property {string|null} borderColorClass - 카드 상단 4px 컬러 테두리의 Tailwind 배경색 클래스.
 *                                           (예: 'bg-blue-facebook', 'bg-red-youtube')
 *                                           ★ 인스타그램만 예외: null을 사용하면 createMainCardHTML()이
 *                                           상단 테두리 div 대신 article에 'instagram-border' 클래스를 추가함.
 *                                           그러면 CSS의 .instagram-border::before 가상요소가 그라디언트 선을 그려줌.
 */

// ─── 섹션 1: 소셜 미디어 팔로워 메인 카드 데이터 (4개) ───
/** @type {MainCard[]} */
const mainCardsData = [
  {
    icon: 'images/icon-facebook.svg', // 플랫폼 아이콘 경로
    handle: '@nathanf',               // 계정 핸들명
    count: '1987',                    // 팔로워/구독자 수
    label: 'Followers',               // 수치 아래 레이블
    change: 12,                       // 양수 = 증가, 음수 = 감소 (아이콘·색상 결정에 사용)
    changeText: '12 Today',           // 화면에 표시될 변화량 텍스트 (이미 포맷 완료)
    ariaLabel: '페이스북 팔로워 현황', // 스크린 리더용 카드 설명
    borderColorClass: 'bg-blue-facebook', // 상단 4px 테두리 색상 클래스 (null이면 인스타그램)
  },
  {
    icon: 'images/icon-twitter.svg',
    handle: '@nathanf',
    count: '1044',
    label: 'Followers',
    change: 99,
    changeText: '99 Today',
    ariaLabel: '트위터 팔로워 현황',
    borderColorClass: 'bg-blue-twitter',
  },
  {
    icon: 'images/icon-instagram.svg',
    handle: '@realnathanf',
    count: '11k',
    label: 'Followers',
    change: 1099,
    changeText: '1099 Today',
    ariaLabel: '인스타그램 팔로워 현황',
    borderColorClass: null, // null = CSS의 .instagram-border::before 가상요소로 그라디언트 처리
  },
  {
    icon: 'images/icon-youtube.svg',
    handle: 'Nathan F.',
    count: '8239',
    label: 'Subscribers',
    change: -144,            // 음수이므로 아래 화살표 + 빨간색 적용
    changeText: '144 Today',
    ariaLabel: '유튜브 구독자 현황',
    borderColorClass: 'bg-red-youtube',
  },
];

/**
 * @typedef {Object} OverviewCard
 * @description
 * 섹션 2(오늘의 개요 카드)를 구성하는 데이터 객체의 타입 정의.
 * overviewCardsData 배열에 새 카드를 추가할 때 반드시 이 구조를 따라야 함.
 *
 * ★ MainCard와의 차이점:
 *   - handle, label, borderColorClass 속성이 없음 (개요 카드에는 핸들·테두리가 없는 디자인)
 *   - metric 속성이 있음 (카드 좌상단에 표시되는 지표 이름)
 *   - changeText가 '%' 단위 (예: '3%', '2257%')
 *
 * @property {string} icon        - 플랫폼 아이콘 이미지의 상대 경로. 카드 우상단에 표시됨.
 *                                  (예: 'images/icon-instagram.svg')
 * @property {string} metric      - 측정 지표의 이름. 카드 좌상단에 표시됨.
 *                                  (예: 'Page Views', 'Retweets', 'Profile Views')
 * @property {string} count       - 화면 좌하단에 크게 표시할 지표 수치.
 *                                  약어 표현도 가능하므로 string 타입 사용.
 *                                  (예: '87', '5462', '52k')
 * @property {number} change      - 오늘 하루의 증감률(%). 순수 숫자로 부호를 포함함.
 *                                  양수(+)면 위 화살표(↑) + 초록색, 음수(-)면 아래 화살표(↓) + 빨간색.
 *                                  화면에 직접 표시되지 않고 아이콘·색상 결정에만 사용됨. (예: -19)
 * @property {string} changeText  - 화면 우하단에 실제로 표시되는 변화율 텍스트.
 *                                  change의 절댓값 + '%'로 미리 포맷된 문자열.
 *                                  (예: '3%', '19%', '2257%')
 * @property {string} ariaLabel   - 스크린 리더가 카드 전체를 읽어줄 때 사용하는 텍스트.
 *                                  (예: '인스타그램 프로필 조회수')
 */

// ─── 섹션 2: 오늘의 개요 카드 데이터 (8개) ───
/** @type {OverviewCard[]} */
const overviewCardsData = [
  {
    icon: 'images/icon-facebook.svg',
    metric: 'Page Views', // 지표명
    count: '87',
    change: 3,
    changeText: '3%',
    ariaLabel: '페이스북 페이지 뷰',
  },
  {
    icon: 'images/icon-facebook.svg',
    metric: 'Likes',
    count: '52',
    change: -2,
    changeText: '2%',
    ariaLabel: '페이스북 좋아요',
  },
  {
    icon: 'images/icon-instagram.svg',
    metric: 'Likes',
    count: '5462',
    change: 2257,
    changeText: '2257%',
    ariaLabel: '인스타그램 좋아요',
  },
  {
    icon: 'images/icon-instagram.svg',
    metric: 'Profile Views',
    count: '52k',
    change: 1375,
    changeText: '1375%',
    ariaLabel: '인스타그램 프로필 조회수',
  },
  {
    icon: 'images/icon-twitter.svg',
    metric: 'Retweets',
    count: '117',
    change: 303,
    changeText: '303%',
    ariaLabel: '트위터 리트윗',
  },
  {
    icon: 'images/icon-twitter.svg',
    metric: 'Likes',
    count: '507',
    change: 553,
    changeText: '553%',
    ariaLabel: '트위터 좋아요',
  },
  {
    icon: 'images/icon-youtube.svg',
    metric: 'Likes',
    count: '107',
    change: -19,
    changeText: '19%',
    ariaLabel: '유튜브 좋아요',
  },
  {
    icon: 'images/icon-youtube.svg',
    metric: 'Total Views',
    count: '1407',
    change: -12,
    changeText: '12%',
    ariaLabel: '유튜브 총 조회수',
  },
];


// =====================================================
// [섹션 C] 카드 HTML 생성 함수 (Template Functions)
// 비유: 붕어빵 틀. 재료(데이터)만 넣으면 똑같은 모양의 카드가 찍혀 나옴.
// =====================================================

/**
 * mainCardsData 배열의 항목 하나를 받아 완성된 메인 팔로워 카드의 HTML 문자열을 반환하는 함수.
 *
 * 비유: 붕어빵 틀. card(재료)를 넣으면 HTML(붕어빵)이 찍혀 나옴.
 * renderCards() 함수가 mainCardsData를 순회하며 카드마다 이 함수를 반복 호출함.
 *
 * ★ 인스타그램 예외 처리 로직:
 *   card.borderColorClass === null 이면 인스타그램으로 판단.
 *   → 상단 색상 테두리 <div>를 생성하지 않는 대신, <article>에 'instagram-border' 클래스를 추가함.
 *   → CSS의 .instagram-border::before 가상요소(Pseudo-element)가 그라디언트 선을 자동으로 그려줌.
 *
 * @param {MainCard} card - mainCardsData 배열의 항목 하나. 위의 @typedef MainCard 구조를 따름.
 * @returns {string}        완성된 <article> 카드의 HTML 문자열.
 *                          이 문자열은 renderCards() 내부에서 다른 카드들과 이어 붙여진 후
 *                          컨테이너의 innerHTML에 한 번에 삽입됨.
 */
function createMainCardHTML(card) {
  // borderColorClass가 null이면 인스타그램 → instagram-border 클래스를 article에 붙임
  const isInstagram = card.borderColorClass === null;

  // change 값의 부호로 증가/감소 아이콘과 색상 클래스 결정
  const isPositive = card.change > 0;
  const changeIcon = isPositive ? 'images/icon-up.svg' : 'images/icon-down.svg';
  const changeAlt = isPositive ? '증가' : '감소';
  const changeColorClass = isPositive ? 'text-green-positive' : 'text-red-negative';

  // 인스타그램이 아닌 카드에만 상단 색상 테두리 div를 생성
  // 인스타그램은 CSS ::before 가상요소가 그라디언트 선을 그려줌
  const borderHTML = isInstagram
    ? ''
    : `<div class="h-1 ${card.borderColorClass}" aria-hidden="true"></div>`;

  // 인스타그램 카드에만 'instagram-border' 클래스를 article에 추가
  const instagramClass = isInstagram ? 'instagram-border ' : '';

  // 템플릿 리터럴(백틱 문자열)로 카드 전체 HTML 조립
  return `
    <article
      class="${instagramClass}bg-navy-50 dark:bg-navy-950 rounded-[5px] overflow-hidden cursor-pointer lg:hover:bg-gray-200 lg:dark:hover:bg-navy-900 transition-colors duration-300"
      aria-label="${card.ariaLabel}">
      ${borderHTML}
      <div class="flex flex-col items-center text-center py-[31px] px-0 gap-spacing-300">
        <div class="flex items-center gap-spacing-100">
          <img src="${card.icon}" alt="" aria-hidden="true" class="w-5 h-5">
          <span class="text-preset-6-bold font-bold text-gray-650 dark:text-gray-400 transition-colors duration-300">
            ${card.handle}
          </span>
        </div>
        <div>
          <p class="text-preset-1 font-bold text-black dark:text-white transition-colors duration-300">
            ${card.count}
          </p>
          <p class="text-preset-6 font-normal uppercase text-gray-650 dark:text-gray-400 mt-spacing-100 transition-colors duration-300">
            ${card.label}
          </p>
        </div>
        <div class="flex items-center gap-1">
          <img src="${changeIcon}" alt="${changeAlt}" class="w-[8px] h-[4px]">
          <span class="text-preset-6-bold font-bold ${changeColorClass}">${card.changeText}</span>
        </div>
      </div>
    </article>
  `;
}

/**
 * overviewCardsData 배열의 항목 하나를 받아 완성된 개요 카드의 HTML 문자열을 반환하는 함수.
 *
 * 비유: 붕어빵 틀. card(재료)를 넣으면 HTML(붕어빵)이 찍혀 나옴.
 * renderCards() 함수가 overviewCardsData를 순회하며 카드마다 이 함수를 반복 호출함.
 *
 * ★ createMainCardHTML()과의 차이점:
 *   - 상단 컬러 테두리 없음 (인스타그램 예외 처리도 불필요)
 *   - 레이아웃이 다름: 지표명+아이콘(상단 행), 수치+증감률(하단 행) 구조
 *   - 내부 padding 방식: 카드 본문 전체에 p-spacing-300 적용 (메인 카드는 py-[31px])
 *
 * @param {OverviewCard} card - overviewCardsData 배열의 항목 하나. 위의 @typedef OverviewCard 구조를 따름.
 * @returns {string}            완성된 <article> 카드의 HTML 문자열.
 *                              이 문자열은 renderCards() 내부에서 다른 카드들과 이어 붙여진 후
 *                              컨테이너의 innerHTML에 한 번에 삽입됨.
 */
function createOverviewCardHTML(card) {
  // 메인 카드와 동일한 방식으로 증가/감소 판단
  const isPositive = card.change > 0;
  const changeIcon = isPositive ? 'images/icon-up.svg' : 'images/icon-down.svg';
  const changeAlt = isPositive ? '증가' : '감소';
  const changeColorClass = isPositive ? 'text-green-positive' : 'text-red-negative';

  return `
    <article
      class="bg-navy-50 dark:bg-navy-950 rounded-[5px] p-spacing-300 cursor-pointer lg:hover:bg-gray-200 lg:dark:hover:bg-navy-900 transition-colors duration-300"
      aria-label="${card.ariaLabel}">
      <div class="flex justify-between items-center mb-spacing-300">
        <span class="text-preset-5 font-bold text-gray-650 dark:text-gray-400 transition-colors duration-300">
          ${card.metric}
        </span>
        <img src="${card.icon}" alt="" aria-hidden="true" class="w-5 h-5">
      </div>
      <div class="flex justify-between items-end">
        <span class="text-preset-2 font-bold text-black dark:text-white transition-colors duration-300">${card.count}</span>
        <div class="flex items-center gap-1 pb-[7px]">
          <img src="${changeIcon}" alt="${changeAlt}" class="w-[8px] h-[4px]">
          <span class="text-preset-6-bold font-bold ${changeColorClass}">${card.changeText}</span>
        </div>
      </div>
    </article>
  `;
}


// =====================================================
// [섹션 D] 범용 렌더링 함수 (Rendering Engine)
// 비유: 인쇄기. 붕어빵 틀(createCardFn)과 재료(dataArray)를
//       받아서 지정된 쟁반(container)에 카드를 한 번에 올려놓음.
// =====================================================

/**
 * 데이터 배열을 순회하며 카드 HTML을 생성하고, 지정된 컨테이너에 한 번에 삽입하는 범용 렌더링 함수.
 *
 * 비유: 인쇄기. 붕어빵 틀(createCardFn)과 재료(dataArray)를 넘겨주면,
 *       모든 카드를 찍어낸 뒤 지정된 쟁반(containerId의 요소) 위에 한꺼번에 올려놓음.
 *
 * ★ innerHTML을 단 1번만 조작하는 이유 (성능):
 *   forEach로 카드마다 innerHTML += 를 반복하면 브라우저가 매번 화면을 다시 계산(Reflow)함.
 *   reduce로 문자열을 모두 합친 뒤 innerHTML에 1번만 대입하면 Reflow가 1번만 발생 → 훨씬 빠름.
 *
 * @param {string}   containerId  - 카드를 삽입할 컨테이너 요소의 HTML id 속성값.
 *                                  이 id를 가진 요소가 index.html에 반드시 존재해야 함.
 *                                  (예: 'main-cards-container', 'overview-cards-container')
 * @param {MainCard[]|OverviewCard[]} dataArray
 *                               - 렌더링할 카드 데이터의 배열.
 *                                 (예: mainCardsData, overviewCardsData)
 * @param {function(MainCard|OverviewCard): string} createCardFn
 *                               - 카드 데이터 객체 하나를 받아 HTML 문자열 하나를 반환하는 함수.
 *                                 (예: createMainCardHTML, createOverviewCardHTML)
 * @returns {void} 반환값 없음.
 *                 container.innerHTML을 직접 교체하는 부수 효과(Side Effect)만 발생시킴.
 */
function renderCards(containerId, dataArray, createCardFn) {
  // id로 컨테이너 요소를 찾음
  const container = document.getElementById(containerId);

  // 혹시 컨테이너가 HTML에 없으면 조용히 멈춤 (오류 방지)
  if (!container) return;

  // reduce: 배열의 각 카드를 HTML 문자열로 변환 후 하나로 합침
  // 비유: 카드 12장을 한 줄로 이어 붙여 긴 종이 한 장을 만드는 것
  //
  // ★ reduce 작동 원리 (단계별):
  //   초기값('')  →  '' + card[0]의HTML  →  card[0]HTML + card[1]HTML  →  ...
  //   →  (모든 카드 HTML이 이어진) 하나의 긴 문자열
  //   →  그 문자열을 container.innerHTML에 1번 대입 → 브라우저가 1번만 화면 갱신
  container.innerHTML = dataArray.reduce(
    (accumulatedHTML, card) => accumulatedHTML + createCardFn(card),
    '' // 초기값: 빈 문자열
  );
}


// =====================================================
// [섹션 E] 초기화 실행 (Entry Point)
// defer 속성 덕분에 HTML이 전부 파싱된 뒤에 이 파일이 실행됨
// → DOM 요소를 바로 찾아도 안전
// =====================================================

// 섹션 1: 메인 팔로워 카드 4개 렌더링
renderCards('main-cards-container', mainCardsData, createMainCardHTML);

// 섹션 2: 개요 카드 8개 렌더링
renderCards('overview-cards-container', overviewCardsData, createOverviewCardHTML);
