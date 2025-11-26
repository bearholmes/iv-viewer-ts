# 의존성 보안 및 쿨다운 전략

**프로젝트:** iv-viewer-ts
**날짜:** 2025-11-24
**작성자:** Claude Code Review

---

## 📊 현재 상태 분석

### 의존성 현황

```json
총 의존성: 587개
- Production: 1개 (런타임 의존성 없음 - 순수 클라이언트 라이브러리)
- Development: 587개
- Optional: 65개
```

### 보안 취약점 현황

```
npm audit 결과:
- Critical: 0개 ✅
- High: 0개 ✅
- Moderate: 1개 ⚠️
- Low: 1개 ⚠️
- Total: 2개
```

**발견된 취약점:**

1. **brace-expansion (Low)**
   - 버전: 1.0.0-1.1.11, 2.0.0-2.0.1
   - 문제: Regular Expression Denial of Service (ReDoS)
   - CVSS: 3.1
   - 영향: 간접 의존성 (devDependencies)
   - 수정 가능: ✅ Yes

2. **js-yaml (Moderate)**
   - 버전: 4.0.0-4.1.0
   - 문제: Prototype pollution in merge
   - CVSS: 5.3
   - 영향: 간접 의존성 (devDependencies)
   - 수정 가능: ✅ Yes

---

## 🛡️ 의존성 쿨다운 (Dependency Cooldown) 전략

### 1. 쿨다운이란?

의존성 쿨다운은 **새로 발표된 패키지 버전을 즉시 적용하지 않고 일정 기간 대기하는 보안 전략**입니다.

**목적:**

- 공급망 공격(Supply Chain Attack) 방지
- 악의적으로 변조된 패키지 버전 회피
- 커뮤니티에서 문제 발견 및 보고할 시간 확보
- 안정성 검증 기간 확보

### 2. 공급망 공격 사례

**실제 사례:**

- **event-stream (2018)**: 비트코인 지갑 탈취 악성 코드 삽입
- **ua-parser-js (2021)**: 암호화폐 채굴 악성코드 삽입
- **node-ipc (2022)**: 러시아/벨라루스 IP 대상 파일 삭제
- **colors.js (2022)**: 개발자가 의도적으로 무한루프 코드 삽입

### 3. 권장 쿨다운 기간

| 의존성 타입               | 쿨다운 기간 | 이유                                 |
| ------------------------- | ----------- | ------------------------------------ |
| **Critical Dependencies** | 7-14일      | 보안 패치는 빠르게, 새 기능은 신중히 |
| **Major Version**         | 14-30일     | Breaking changes 검증 필요           |
| **Minor Version**         | 3-7일       | 새 기능 안정성 확인                  |
| **Patch Version**         | 1-3일       | 버그픽스는 비교적 안전               |
| **Security Patches**      | 즉시-24시간 | 보안 패치는 신속히 적용              |

---

## 🔧 구현 방안

### Option 1: Renovate Bot (권장)

**장점:**

- 자동화된 PR 생성
- 쿨다운 기간 설정 가능 (stabilityDays)
- 의존성 그룹화
- 자동 머지 규칙
- 취약점 자동 감지

**설정 예시:** `.github/renovate.json`

```json
{
  "$schema": "https://docs.renovatebot.com/renovate-schema.json",
  "extends": ["config:base"],
  "stabilityDays": 7,
  "prCreation": "not-pending",
  "packageRules": [
    {
      "matchPackagePatterns": ["*"],
      "matchUpdateTypes": ["major"],
      "stabilityDays": 14,
      "minimumReleaseAge": "14 days"
    },
    {
      "matchPackagePatterns": ["*"],
      "matchUpdateTypes": ["minor"],
      "stabilityDays": 7,
      "minimumReleaseAge": "7 days"
    },
    {
      "matchPackagePatterns": ["*"],
      "matchUpdateTypes": ["patch"],
      "stabilityDays": 3,
      "minimumReleaseAge": "3 days"
    },
    {
      "matchDepTypes": ["devDependencies"],
      "automerge": false,
      "stabilityDays": 3
    },
    {
      "matchDatasources": ["npm"],
      "matchPackageNames": ["@typescript-eslint/**", "eslint", "prettier", "typescript"],
      "groupName": "linting and formatting",
      "stabilityDays": 7
    },
    {
      "matchPackageNames": ["vite", "rollup", "vitest"],
      "groupName": "build tools",
      "stabilityDays": 7
    }
  ],
  "vulnerabilityAlerts": {
    "enabled": true,
    "labels": ["security"],
    "stabilityDays": 0,
    "minimumReleaseAge": null
  },
  "schedule": ["every weekend"]
}
```

### Option 2: Dependabot

**장점:**

- GitHub 네이티브 통합
- 무료 (GitHub 포함)
- 자동 보안 패치

**설정 예시:** `.github/dependabot.yml`

```yaml
version: 2
updates:
  - package-ecosystem: 'npm'
    directory: '/'
    schedule:
      interval: 'weekly'
      day: 'sunday'
    open-pull-requests-limit: 10
    groups:
      build-tools:
        patterns:
          - 'vite'
          - 'rollup'
          - 'vitest'
      linting:
        patterns:
          - 'eslint*'
          - '@typescript-eslint/*'
          - 'prettier'
    ignore:
      - dependency-name: '*'
        update-types: ['version-update:semver-major']
```

**한계:** Dependabot은 쿨다운 기능이 없음. 수동으로 PR 머지 지연 필요.

### Option 3: npm-check-updates + Manual Review

**장점:**

- 완전한 수동 제어
- 커스터마이징 가능

**사용법:**

```bash
# 안전하게 패치 버전만 업데이트
npx npm-check-updates -u --target patch

# 7일 이상 된 버전만 업데이트
npx npm-check-updates -u --target minor --filterVersion ">=7d"

# 특정 패키지 제외
npx npm-check-updates -u --reject typescript,vite
```

### Option 4: Socket.dev (고급)

**장점:**

- 실시간 악성 코드 감지
- 공급망 위험 분석
- AI 기반 위협 탐지
- 새 패키지 설치 시 자동 스캔

**비용:** Open source 프로젝트는 무료

---

## 📋 즉시 수행 권장 사항

### 1. 현재 취약점 수정 (즉시)

```bash
# 자동 수정
npm audit fix

# 강제 수정 (breaking changes 가능)
npm audit fix --force
```

### 2. .npmrc 설정 생성

```bash
# .npmrc 파일 생성
cat > .npmrc << 'EOF'
# 보안 설정
audit=true
audit-level=moderate
save-exact=true

# 패키지 잠금
package-lock=true
package-lock-only=false

# 신뢰할 수 있는 레지스트리만 사용
registry=https://registry.npmjs.org/
EOF
```

### 3. package.json 스크립트 추가

```json
{
  "scripts": {
    "security:audit": "npm audit --production",
    "security:audit:dev": "npm audit",
    "security:check": "npm audit --audit-level=moderate",
    "security:fix": "npm audit fix",
    "deps:check": "npx npm-check-updates",
    "deps:update:patch": "npx npm-check-updates -u --target patch",
    "deps:update:minor": "npx npm-check-updates -u --target minor"
  }
}
```

### 4. Pre-commit Hook 추가

`.husky/pre-commit` 수정:

```bash
#!/usr/bin/env sh
. "$(dirname -- "$0")/_/husky.sh"

# 보안 체크
npm audit --audit-level=high --production

# Lint staged
npx lint-staged
```

### 5. CI/CD 보안 체크 추가

`.github/workflows/security.yml`:

```yaml
name: Security Audit

on:
  push:
    branches: [main, master]
  pull_request:
    branches: [main, master]
  schedule:
    # 매주 월요일 오전 9시 실행
    - cron: '0 9 * * 1'

jobs:
  audit:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'

      - name: Install dependencies
        run: npm ci

      - name: Run npm audit
        run: npm audit --audit-level=moderate

      - name: Check for outdated dependencies
        run: npx npm-check-updates --errorLevel 2
```

---

## 🔍 의존성 모니터링 Best Practices

### 1. 정기 점검 스케줄

| 주기       | 점검 내용                | 도구                   |
| ---------- | ------------------------ | ---------------------- |
| **매일**   | 보안 알림 확인           | GitHub Security Alerts |
| **매주**   | 의존성 업데이트 검토     | npm-check-updates      |
| **매월**   | 전체 의존성 감사         | npm audit              |
| **분기별** | Major 버전 업데이트 검토 | Manual review          |

### 2. 업데이트 우선순위

1. **Critical Security Patches** - 즉시
2. **High/Moderate Security** - 24-48시간 내
3. **Low Security** - 1주일 내
4. **Patch versions** - 3-7일 쿨다운
5. **Minor versions** - 7-14일 쿨다운
6. **Major versions** - 14-30일 쿨다운

### 3. 체크리스트

업데이트 전 확인 사항:

- [ ] 패키지 npm 페이지에서 주간 다운로드 확인
- [ ] GitHub 저장소에서 이슈 확인
- [ ] Release notes 검토
- [ ] Breaking changes 확인
- [ ] 커뮤니티 피드백 확인 (Twitter, Reddit)
- [ ] 의존성 트리 확인 (하위 의존성 변경)
- [ ] 로컬 테스트 실행
- [ ] CI 통과 확인

---

## 📊 현재 프로젝트 위험도 평가

### 위험도: **낮음** ✅

**이유:**

1. ✅ Production 의존성 없음 (순수 클라이언트 라이브러리)
2. ✅ 런타임에 외부 패키지 미사용
3. ✅ DevDependencies만 사용 (빌드/테스트 도구)
4. ✅ Critical/High 취약점 없음
5. ✅ package-lock.json 사용 (버전 고정)

**주의사항:**

- ⚠️ DevDependencies도 공급망 공격 대상 가능
- ⚠️ 빌드 도구 변조 시 빌드된 결과물에 악성 코드 삽입 가능
- ⚠️ 현재 2개 취약점 존재 (Low, Moderate)

---

## 🎯 권장 구현 계획

### Phase 1: 즉시 (1일 내)

1. ✅ 현재 취약점 수정 (`npm audit fix`)
2. ✅ .npmrc 파일 생성
3. ✅ package.json 보안 스크립트 추가

### Phase 2: 단기 (1주일 내)

1. ⏳ Renovate Bot 설정 (쿨다운 7일)
2. ⏳ CI/CD 보안 체크 추가
3. ⏳ Pre-commit 보안 훅 추가

### Phase 3: 중기 (1개월 내)

1. ⏳ Socket.dev 통합 검토
2. ⏳ 의존성 정책 문서화
3. ⏳ 팀 교육 및 가이드라인 수립

---

## 📚 참고 자료

### 공급망 공격 사례

- [OWASP Top 10: A06:2021 – Vulnerable and Outdated Components](https://owasp.org/Top10/A06_2021-Vulnerable_and_Outdated_Components/)
- [NPM Security Best Practices](https://docs.npmjs.com/packages-and-modules/securing-your-code)

### 도구

- [Renovate](https://docs.renovatebot.com/)
- [Dependabot](https://docs.github.com/en/code-security/dependabot)
- [Socket.dev](https://socket.dev/)
- [Snyk](https://snyk.io/)

### 쿨다운 전략

- [Dependency Cooldown Period Best Practices](https://medium.com/@alex.birsan/dependency-confusion-4a5d60fec610)
- [npm Package Vetting](https://socket.dev/blog/introducing-safe-npm)

---

**최종 업데이트:** 2025-11-24
**다음 검토:** 2025-12-01
