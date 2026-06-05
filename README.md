# Habit Game — 데스크탑 앱 (Electron)

계획별 습관 트래커의 **네이티브 데스크탑 앱** 버전입니다.
기록은 **앱 전용 파일**(`habit-data.json`)에 저장돼요. 이건 브라우저 저장소가 아니라 일반 파일이라
**쿠키 삭제·브라우저 초기화와 전혀 무관 — 데이터가 날아가지 않습니다.**

---

## 준비물
- **Node.js 18 이상** (https://nodejs.org)

## 설치
```bash
npm install
```
> 이때 Electron 실행 파일(수십 MB)을 받아오니 잠시 걸릴 수 있어요.

## 실행해 보기 (테스트)
```bash
npm run app
```
→ 앱 창이 바로 떠요. (`vite build` 후 Electron이 실행됩니다)

## 설치 파일 만들기 (배포)
```bash
npm run dist
```
→ `release/` 폴더에 설치 파일이 생성돼요.
- macOS → `.dmg`
- Windows → `.exe` (NSIS 설치 프로그램)
- Linux → `.AppImage`

이렇게 만든 설치 파일을 실행하면 **시작메뉴/런치패드/독에 "Habit Game" 아이콘**이 생기고, 더블클릭으로 바로 열립니다.

> ⚠️ **설치 파일은 만드는 OS의 것만 나와요.** 윈도우 `.exe`는 윈도우에서, 맥 `.dmg`는 맥에서 빌드해야 합니다.
> (둘 다 필요하면 각 OS에서 한 번씩 빌드하거나, GitHub Actions 같은 CI를 쓰면 됩니다.)

---

## 데이터는 어디에 저장되나요?
앱의 사용자 데이터 폴더 안 `habit-data.json` 입니다.
- **macOS** : `~/Library/Application Support/Habit Game/habit-data.json`
- **Windows** : `%APPDATA%\Habit Game\habit-data.json`
- **Linux** : `~/.config/Habit Game/habit-data.json`

브라우저를 초기화하거나 쿠키를 지워도 이 파일은 그대로 남아요. (앱을 삭제하면 이 폴더를 직접 지우지 않는 한 보통 남습니다.)
추가 안전장치로 화면 우상단 **내보내기/가져오기**도 그대로 있어서, 이 파일을 백업하거나 다른 PC로 옮길 수 있어요.

## 아이콘 바꾸기
`build/icon.png` (1024×1024) 를 교체하면 앱 아이콘이 바뀝니다. (electron-builder가 OS별 아이콘으로 자동 변환)

## 참고
- 앱 화면 자체는 인터넷이 없어도 동작해요. (글꼴만 인터넷에서 받아오고, 없으면 기본 글꼴로 대체)
- 플랫폼별 빌드/서명 등에서 막히는 부분이 있으면 **Claude Code**로 이 폴더를 열어 빌드를 돌려가며 해결하면 편해요.

## 폴더 구조
```
electron/
  main.cjs       # 앱 창 + 파일 읽기/쓰기(데이터 저장)
  preload.cjs    # 앱에 안전하게 저장 기능 노출
src/
  App.jsx        # 대시보드 전체 (화면 + 로직)
  main.jsx, index.css
build/icon.png   # 앱 아이콘
vite.config.js   # 화면을 단일 파일로 빌드
package.json     # 스크립트 + electron-builder 설정
```

---

## (선택) GitHub Actions로 설치파일 자동 만들기 — 내 PC에서 빌드 안 함

내 컴퓨터에서 빌드하기 싫다면, GitHub에 올려서 **윈도우 exe·맥 dmg를 자동으로** 받을 수 있어요.

1. GitHub에서 새 저장소 생성 후, 이 폴더를 push
   ```bash
   git init && git add . && git commit -m "init"
   git branch -M main
   git remote add origin https://github.com/<내아이디>/<저장소>.git
   git push -u origin main
   ```
2. 저장소의 **Actions** 탭 → "Build installers" → **Run workflow** 클릭
3. 5~10분 뒤 완료되면, 그 실행 화면 아래 **Artifacts** 에서
   - `Habit-Game-Windows` (→ `.exe`)
   - `Habit-Game-macOS` (→ `.dmg`)
   를 다운로드. 압축을 풀면 설치파일이 들어 있어요.

> 참고: 맥 빌드는 기본적으로 **Apple Silicon(M1~)** 용 dmg가 나와요. 인텔 맥용이 필요하면 알려주세요(타깃 추가).
> 서명 인증서가 없어 설치 시 "확인되지 않은 앱" 경고가 떠요 — 윈도우는 "추가 정보 → 실행", 맥은 "우클릭 → 열기"로 넘기면 됩니다.
