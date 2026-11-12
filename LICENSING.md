# Annual Retail ERP licences

The retail app follows the medical ERP's signed-key workflow, with separate retailer signing keys. A shop must activate a valid licence before password setup, sign-in, viewing records, billing, reports, settings or other business functions are available. There is no automatic trial and no lifetime key option.

## On the shopkeeper's computer

1. Install/open **Retail ERP**. The activation screen shows a Machine ID.
2. Send that Machine ID to the software provider.
3. Paste the complete `RETAIL1-…` key supplied by the provider and click **Activate Licence**.
4. Set the operator password/sign in as usual. Existing records are preserved.

A licence lasts one calendar year from its start date. Its `expires` date is the renewal deadline: the app locks at **00:00 Asia/Kolkata on that date**, rather than at the end of that date. For example, a licence starting 11 November 2026 requires renewal before 11 November 2027. February 29 anniversaries clamp to February 28 in the following year.

The app warns during the final 30 days. Open **Licence & Renewal** from the sidebar or **Your Account**, then paste the next key. An early renewal starts when the current licence expires, so remaining paid time is preserved. Renewal after expiry starts on the issuing date. After expiry, the native activation screen replaces the entire workspace. Only licence activation/status and a native **Save Data Backup** action remain available. Renewal restores access to the same records and passwords.

## Issue keys on your own development/provider computer

The signing pair has already been initialized for this project. Do **not** run `init` again or replace the keys. Your private signing key and licence register are in the ignored `.vendor/` directory. Back up that directory privately; it is needed for every future renewal. Only `electron/licence-public.pem` is included in shop installers.

From the project folder:

```sh
npm run licence -- machine
npm run licence -- issue --shop "Shop Name" --machine "AAAA-BBBB-CCCC-DDDD-EEEE-FFFF"
npm run licence -- list
npm run licence -- renew --id "RT-2026-XXXXXXXX"
```

- `machine` prints the current computer's ID; use the shopkeeper's ID from their activation screen when issuing a shop licence.
- `issue` prints the licence number, start/deadline, machine ID, and complete key. Send only the generated key to that shop.
- `list` shows your local register of issued licences.
- `renew` uses the existing shop and machine, issues one additional annual period, and records the link to the prior licence. For subsequent years, renew the latest licence number from `list`. The tool rejects duplicate renewals of the same licence number.
- `RETAIL_ERP_VENDOR_DIR` can point to a private alternative directory containing the same signing key and register; it must match the public key built into this app.

The first annual activation key for **this development computer only** is saved in `.vendor/owner-activation.txt` (licence `RT-2026-D0BB5740`, valid from 2026-11-11, renewal due 2027-11-11). Paste the file's single key line into the activation screen. It will not activate a different shop computer. No real customer licence is activated automatically.

Distribute only the built installer/app from `release/`. Do not send the source checkout, `.vendor/`, the private signing key, or the issuing register to shopkeepers. The shop app contains verification and activation only; the issuing CLI and private key are not packaged. Medical ERP licences and signing files are unchanged and do not activate Retail ERP.

## Superadmin licence list

On your provider computer, sign in as an administrator and open **Licence & Renewal → Superadmin / All Licences**. The list shows every signed licence in your provider register, including shop name, licence number, Machine ID, issue/start/expiry dates, renewal links, date validity and activation confirmation. Search, validity/activation filters, issue-date filters, pagination and CSV export are available. Use **Refresh Licences** after issuing or renewing a key with the provider CLI.

Development launches discover this project's `.vendor/` directory automatically. In the packaged app, first choose **File → Connect Superadmin Register…** and select your private `.vendor/` folder (enable hidden files in the folder picker if necessary). The connection is remembered on this computer; the app reloads and requires sign-in again. `RETAIL_ERP_VENDOR_DIR` also supports an explicit provider-folder location. Connecting reads the existing key and register and never initializes or replaces your signing keys.

Provider access requires a private signing key matching this app's public key, checked in Electron's main process on every register read. A shop Admin role alone does not grant access. No full activation keys or private keys are returned to the interface or exported in the CSV. Provider connection settings are separate from business backups. This is a provider-computer capability, not a new role customers can assign to themselves.

**Offline activation limitation:** “Activated locally” means the signed key is present in this computer's verified activation history, including queued renewals and expired keys. “Unconfirmed (offline)” means activation on another computer is not known here; it does not indicate that the client's app is inactive. “Valid”, “Expiring soon”, “Expired” and “Scheduled” describe only the signed date range, not remote activation. A central, automatically updated list of client activations would require an online activation service; the current app makes no network calls to collect that information.

## Enforcement and data

Verification uses Ed25519 signatures in Electron's main process. Keys are bound to the machine ID and the retailer app, and their dates must cover exactly one annual period. The native protocol refuses to serve the business application without a valid licence. It checks expiry at runtime, on focus/resume, and synchronously before workspace writes, then moves to the lock screen when expired. Customer renderers never receive the private signing key.

Licence state is stored separately from the business localStorage JSON in `licence-state.json` under the app's user-data folder. Business backup/restore does not renew, reset or extend the licence. A persisted highest-seen clock and monotonic elapsed time stop ordinary clock rollback from extending an observed licence. Incorrect future clock settings can require provider assistance.

This is offline enforcement like the medical app, not a claim of tamper resistance against a computer administrator who edits application binaries or licensing files. Absolute clock/anti-tamper guarantees would require an online licensing authority or trusted hardware. Business records are preserved and are not encrypted by licensing.

## Validation

`npm test` covers signature tampering, different machines/apps, invalid and perpetual terms, anniversary expiry, queued renewal, clock rollback, elapsed time, leap years and corrupt state. `npm run test:desktop` uses temporary signing keys in an isolated profile to activate, expire, reject access/rollback, restart locked, renew, and verify records remain intact. Test-key/clock overrides are disabled in packaged builds. Browser UI tests provide an explicit test-only bridge stub; they are not the native enforcement test.
