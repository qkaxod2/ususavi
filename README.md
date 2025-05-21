# Usual Saviors - Discord RPG 도우미 봇

"Usual Saviors" 세계관을 배경으로 롤플레잉 게임을 돕기 위한 Discord 봇입니다.

## 주요 기능

*   **캐릭터 프로필 관리**: 간단한 캐릭터 프로필을 생성하고 조회할 수 있습니다.
*   **인터랙티브 시나리오 생성**: Gemini API를 활용하여 "Usual Saviors" 세계관 기반의 롤플레잉 시나리오를 제공합니다. 플레이어는 자유롭게 행동을 입력하여 스토리를 진행할 수 있습니다.
*   **세계관 설정집**: 게임의 주요 용어, 세력, 개념 등을 빠르게 찾아볼 수 있습니다.

## 사전 준비 사항

*   Node.js (v18 이상 권장)
*   npm 또는 yarn
*   Discord 봇 토큰
*   Google Gemini API 키 (`API_KEY`)

## 설정 방법

1.  **저장소 복제**:
    ```bash
    git clone <repository-url>
    cd usual-saviors-discord-bot
    ```

2.  **의존성 설치**:
    ```bash
    npm install
    ```
    또는
    ```bash
    yarn install
    ```

3.  **환경 변수 설정**:
    루트 디렉토리에 `.env` 파일을 생성하고 다음 내용을 참고하여 입력합니다:
    ```env
    DISCORD_BOT_TOKEN=YOUR_DISCORD_BOT_TOKEN_HERE
    API_KEY=YOUR_GEMINI_API_KEY_HERE
    ```
    *   `DISCORD_BOT_TOKEN`: Discord Developer Portal에서 생성한 봇 토큰을 입력합니다.
    *   `API_KEY`: Google AI Studio에서 발급받은 Gemini API 키를 입력합니다. 이 키는 `process.env.API_KEY`로 코드에서 사용됩니다.

## 실행 방법

*   **개발 모드 (자동 재시작)**:
    ```bash
    npm run dev
    ```

*   **프로덕션 모드**:
    먼저 빌드를 실행합니다:
    ```bash
    npm run build
    ```
    그 다음 봇을 시작합니다:
    ```bash
    npm run start
    ```

## 명령어

봇이 서버에 추가되면 다음 슬래시 명령어를 사용할 수 있습니다:

*   `/모험시작`: 새로운 롤플레잉 모험 시나리오를 시작합니다.
*   `/캐릭터생성 [이름] [설명]`: 새로운 캐릭터를 생성합니다.
*   `/캐릭터보기`: 자신의 캐릭터 정보를 확인합니다.
*   `/세계관 [용어]`: "Usual Saviors" 세계관의 특정 용어에 대한 설명을 봅니다. (예: `/세계관 이형`)

모험 진행 중에는 봇의 메시지에 대한 응답으로 다음 행동을 채팅으로 입력합니다.

## 주의사항

*   Gemini API는 사용량에 따라 비용이 발생할 수 있습니다.
*   봇의 캐릭터 및 모험 데이터는 현재 봇이 실행 중인 세션에만 저장됩니다. 봇이 재시작되면 데이터가 초기화될 수 있습니다. (영구 저장을 위해서는 데이터베이스 연동 필요)
*   `.env` 파일은 절대로 Git 저장소나 공개된 곳에 업로드하지 마세요. 개인의 민감한 정보입니다. `.gitignore` 파일에 `.env`를 추가하는 것을 권장합니다.
