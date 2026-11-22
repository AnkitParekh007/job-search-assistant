"""Check every end-card claim in src/films.json against the latest GitHub release and the repo.

Usage: verify_release.py  ->  out/checks/release.json (exit 1 if a claim is not supported)

  price         "Free and open source (MIT)"     LICENSE on the default branch is MIT
  availability  "Mac app for Apple Silicon ·      the macos-arm64 asset contains a runnable .app;
                 Windows and Intel Mac: build      the windows / macos-x64 assets contain no .exe/.msi/.app
                 from source"                      (if a binary appears, the claim is out of date: update it)
  url           job-search-assistant.rebound-ops.org     the site and /download answer 200
Uses the authenticated `gh` CLI; release assets are downloaded to a temp folder and inspected, never run.
"""
import io, json, os, subprocess, sys, tempfile, urllib.request, zipfile
from lib import DATA, p

REPO = 'AnkitParekh007/job-search-assistant'
claims = DATA['claims']
out = {'repo': REPO, 'checks': []}


def check(name, ok, detail):
    out['checks'].append({'claim': name, 'ok': bool(ok), 'detail': detail})
    print(f'{"PASS" if ok else "FAIL"}  {name}: {detail}')


def gh(*args):
    return subprocess.run(['gh', *args], capture_output=True, text=True, check=True).stdout


rel = json.loads(gh('api', f'repos/{REPO}/releases/latest'))
out['release'] = {'tag': rel['tag_name'], 'published': rel['published_at'], 'draft': rel['draft'], 'prerelease': rel['prerelease'],
                  'assets': [a['name'] for a in rel['assets']]}
print(f"latest release {rel['tag_name']} ({rel['published_at']})")

with tempfile.TemporaryDirectory() as d:
    gh('release', 'download', rel['tag_name'], '-R', REPO, '-D', d, '-p', '*.zip', '-p', 'SHA256SUMS.txt')
    sums = subprocess.run(['shasum', '-a', '256', '-c', 'SHA256SUMS.txt'], cwd=d, capture_output=True, text=True)
    check('checksums', sums.returncode == 0, sums.stdout.strip().replace('\n', '; '))
    kinds = {}
    for name in sorted(os.listdir(d)):
        if not name.endswith('.zip'):
            continue
        names = zipfile.ZipFile(os.path.join(d, name)).namelist()
        app = any('.app/Contents/MacOS/' in n for n in names)
        exe = any(n.lower().endswith(('.exe', '.msi', '.msix')) for n in names)
        src = any(n.endswith('src-tauri/tauri.conf.json') for n in names)
        kinds[name] = {'mac_app': app, 'windows_binary': exe, 'source_package': src}
    out['assets'] = kinds
    arm = [k for k in kinds if 'macos-arm64' in k]
    x64 = [k for k in kinds if 'macos-x64' in k]
    win = [k for k in kinds if 'windows' in k]
    check('availability: Mac app for Apple Silicon', arm and all(kinds[k]['mac_app'] for k in arm), f'{arm}')
    check('availability: Windows is build-from-source', win and all(kinds[k]['source_package'] and not kinds[k]['windows_binary'] for k in win),
          f'{win} (a Windows binary would make this claim out of date)')
    check('availability: Intel Mac is build-from-source', x64 and all(kinds[k]['source_package'] and not kinds[k]['mac_app'] for k in x64),
          f'{x64} (an Intel .app would make this claim out of date)')

lic = gh('api', f'repos/{REPO}/license', '--jq', '.license.spdx_id').strip()
check('price: Free and open source (MIT)', lic == 'MIT' and 'MIT' in claims['price'], f'license {lic}')

for path in ['', '/download']:
    url = f"https://{claims['url']}{path}"
    try:
        code = urllib.request.urlopen(urllib.request.Request(url, headers={'User-Agent': 'campaign-check'}), timeout=20).status
    except Exception as e:  # noqa: BLE001
        code = str(e)
    check(f'url: {url}', code == 200, f'HTTP {code}')

readme = gh('api', f'repos/{REPO}/readme', '--jq', '.content')
import base64
text = base64.b64decode(readme).decode('utf-8', 'replace')
need = ['Claude Code', 'Codex', 'OpenAI', 'Gemini', 'Ollama']
missing = [n for n in need if n not in text]
check('requirement: bring-your-own providers', not missing and all(n.split()[0] in claims['requirement'] for n in need),
      f"README missing {missing or 'nothing'}; claim is {claims['requirement']!r}")
check('disclaimer: you submit applications yourself', 'does not auto-submit' in text or 'submit applications yourself' in text, 'README states the app does not submit')

os.makedirs(p('out', 'checks'), exist_ok=True)
json.dump(out, open(p('out', 'checks', 'release.json'), 'w'), indent=1)
sys.exit(0 if all(c['ok'] for c in out['checks']) else 1)
