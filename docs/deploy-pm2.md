# pm2 자동시작 배포 가이드 (Windows)

센터 PC에서 백엔드를 **상시 구동 + 로그인 시 자동 시작**하도록 설정한다.
(pm2 = Node 프로세스 관리자. 앱이 죽으면 자동 재시작, 재부팅/로그인 후 자동 복구)

---

## 1. 최초 설치 (딱 한 번)

PowerShell을 열고 프로젝트 폴더에서:

```powershell
npm run pm2:setup
```

이 명령이 자동으로 수행하는 것:
1. 의존성 설치 (`npm install`)
2. 프런트 빌드 (`npm run build`)
3. `pm2` + `pm2-windows-startup` 전역 설치
4. **로그인 시 자동시작 등록** (`pm2-startup install`)
5. 백엔드 시작 + 목록 저장 (`pm2 start` → `pm2 save`)

완료되면 **http://localhost:8080** 에서 앱이 열립니다.

> 실행 정책 오류가 나면:
> `powershell -ExecutionPolicy Bypass -File scripts\pm2-setup.ps1`

---

## 2. 평소 운영 명령

| 목적 | 명령 |
|---|---|
| 상태 확인 | `pm2 status` |
| 실시간 로그 | `pm2 logs ywca` |
| 수동 재시작 | `pm2 restart ywca` |
| 중지(자동시작은 유지) | `pm2 stop ywca` |
| 다시 시작 | `pm2 start ywca` |

---

## 3. 코드 수정 후 재배포

```powershell
npm run pm2:deploy
```
→ 재빌드 + **무중단 재시작**(`pm2 reload`) + 저장.

---

## 4. 자동시작 해제 / 제거

```powershell
npm run pm2:uninstall
```
→ 백엔드 중지, 목록에서 제거, 로그인 자동시작 해제.
pm2 자체 제거는: `npm remove -g pm2 pm2-windows-startup`

---

## 5. 동작 방식 & 주의점

- `pm2-windows-startup` 은 **사용자 로그인 시** `pm2 resurrect` 를 실행해 저장된 프로세스를 복구합니다.
  → 즉 PC가 켜지고 **해당 계정으로 로그인**하면 자동으로 뜹니다. (로그인 없이 부팅만으로 뜨려면 아래 대안)
- 환경변수(포트/동기화 주기 등)는 `ecosystem.config.cjs` 의 `env` 에서 수정 후 `npm run pm2:deploy`.
- 로그는 `logs/ywca-out.log`, `logs/ywca-err.log`.
- 데이터 캐시는 `data/courses.json` (자동 생성/갱신).

### 로그인 없이 부팅만으로 실행하려면 (선택, 고급)
`pm2-windows-startup` 대신 **pm2를 Windows 서비스로** 등록하는 `pm2-installer`(nssm 기반)를 사용합니다.
서비스로 등록하면 로그인 전에도 백엔드가 뜹니다. 필요 시 별도 안내 가능.

---

## 6. 방화벽 / 다른 PC에서 접속

기본은 그 PC 안에서만(`localhost:8080`) 접속됩니다.
같은 사무실의 다른 PC에서 열려면:
1. 백엔드 PC의 내부 IP 확인 (`ipconfig` → 예 `192.168.0.10`)
2. Windows 방화벽에서 **8080 인바운드 허용**
3. 다른 PC 브라우저에서 `http://192.168.0.10:8080`

> 외부 인터넷 공개는 보안 검토(HTTPS/접근제한) 후 진행하세요. 내부망 사용을 권장합니다.
