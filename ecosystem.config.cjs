// pm2 프로세스 정의 — YWCA 전화응대 업무도우미 백엔드
// (package.json 이 ESM 이라 확장자는 .cjs 여야 pm2 가 읽습니다)
//
// 사용:
//   pm2 start ecosystem.config.cjs      # 시작
//   pm2 reload ecosystem.config.cjs     # 무중단 재시작(배포)
//   pm2 save                            # 현재 프로세스 목록 저장(자동시작 대상)

module.exports = {
  apps: [
    {
      name: 'ywca',
      script: 'server/index.mjs',
      cwd: __dirname,
      exec_mode: 'fork',
      instances: 1,
      autorestart: true,
      max_restarts: 10,
      restart_delay: 3000,
      watch: false,
      // 로그
      out_file: 'logs/ywca-out.log',
      error_file: 'logs/ywca-err.log',
      merge_logs: true,
      time: true,
      // 환경변수 (필요 시 수정)
      env: {
        NODE_ENV: 'production',
        PORT: 8080,
        SYNC_INTERVAL_HOURS: 6,
        SYNC_ON_BOOT: 'true',
        REFRESH_MIN_INTERVAL_SEC: 60,
      },
    },
  ],
}
