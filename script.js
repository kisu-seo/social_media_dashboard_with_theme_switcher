// =====================================================
// 다크 모드 토글 로직
// 비유: 방의 조명 스위치를 제어하는 전기 회로.
//       html 태그 = 집 전체의 두꺼비집(메인 차단기)
//       dark 클래스 = 전기가 흐르는 상태
// =====================================================

// ─── 즉시 실행 함수(IIFE): 페이지 로드 즉시 저장된 테마를 적용 ───
// 괄호()로 감싸고 마지막에 ()를 붙이면 함수 정의 즉시 실행됨
(function () {
  // localStorage = 브라우저의 작은 메모장. 새로고침해도 데이터가 살아있음
  const savedTheme = localStorage.getItem('theme'); // 이전에 저장한 테마 읽기
  const toggleBtn = document.getElementById('darkModeToggle');

  // ─── 기본값(Default)이 다크 모드로 바뀐 핵심 로직 ───
  // 비유: 집에 처음 이사 오면 무조건 조명이 켜진(dark) 상태.
  //       사용자가 명시적으로 'light'를 선택했을 때만 조명을 끔.
  //
  // 변경 전 로직: savedTheme === 'dark' 이면 dark 클래스를 추가
  // 변경 후 로직: savedTheme === 'light' 이면 dark 클래스를 제거
  //              (그 외의 경우 = 최초 방문 null 포함 → HTML에 이미 class="dark"가 있으므로 그냥 둠)
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

// ─── 토글 버튼 클릭 시 호출되는 함수 ───
function toggleDarkMode() {
  // classList.toggle('dark'):
  //   'dark' 클래스가 없으면 → 추가하고 true 반환 (다크모드 ON)
  //   'dark' 클래스가 있으면 → 제거하고 false 반환 (다크모드 OFF)
  // 마치 전등 스위치를 누를 때마다 켜졌다/꺼졌다 하는 것과 같음
  const isDark = document.documentElement.classList.toggle('dark');

  // 접근성 업데이트: 변경된 상태를 스크린 리더가 읽을 수 있도록 동기화
  document.getElementById('darkModeToggle').setAttribute('aria-checked', String(isDark));

  // localStorage에 현재 테마를 저장 → 새로고침해도 설정이 유지됨
  // isDark가 true면 'dark' 저장, false면 'light' 저장
  localStorage.setItem('theme', isDark ? 'dark' : 'light');
}
