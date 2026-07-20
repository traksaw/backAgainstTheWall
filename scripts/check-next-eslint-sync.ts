// CI guardrail (WAS-109): fail if next and eslint-config-next majors diverge.
// Dependabot grouping (WAS-106) is best-effort only — this check enforces the
// invariant on every PR/push regardless of whether both packages shipped in
// the same Dependabot run.
import { readFileSync } from 'node:fs'
import { join } from 'node:path'

type PackageJson = {
  dependencies?: Record<string, string>
  devDependencies?: Record<string, string>
}

/** Strip range prefixes (^, ~, >=, etc.) and return the major version number. */
function majorVersion(raw: string): number | null {
  const stripped = raw.replace(/^[^\d]*/, '')
  const match = /^(\d+)/.exec(stripped)
  if (!match) return null
  return Number(match[1])
}

function main() {
  const pkgPath = join(process.cwd(), 'package.json')
  const pkg = JSON.parse(readFileSync(pkgPath, 'utf8')) as PackageJson

  const nextRaw = pkg.dependencies?.next
  const eslintConfigRaw = pkg.devDependencies?.['eslint-config-next']

  if (!nextRaw) {
    console.error('Missing "next" in package.json dependencies.')
    process.exit(1)
  }
  if (!eslintConfigRaw) {
    console.error('Missing "eslint-config-next" in package.json devDependencies.')
    process.exit(1)
  }

  const nextMajor = majorVersion(nextRaw)
  const eslintMajor = majorVersion(eslintConfigRaw)

  if (nextMajor === null) {
    console.error(`Could not parse major version from next: "${nextRaw}"`)
    process.exit(1)
  }
  if (eslintMajor === null) {
    console.error(
      `Could not parse major version from eslint-config-next: "${eslintConfigRaw}"`,
    )
    process.exit(1)
  }

  if (nextMajor !== eslintMajor) {
    console.error('next and eslint-config-next major versions must match.')
    console.error(`  next:                ${nextRaw} (major ${nextMajor})`)
    console.error(
      `  eslint-config-next:  ${eslintConfigRaw} (major ${eslintMajor})`,
    )
    console.error('Update both in the same PR. See WAS-109.')
    process.exit(1)
  }

  console.log(
    `OK: next (${nextRaw}) and eslint-config-next (${eslintConfigRaw}) share major ${nextMajor}.`,
  )
}

main()
