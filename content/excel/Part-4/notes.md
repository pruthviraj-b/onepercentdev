# Part 4 — How to Save an Excel File with a Password

## Overview
Protecting sensitive data is a core analyst skill. This part covers workbook-level encryption and sheet-level protection — the two layers of security every Excel professional must understand.

## What You Will Learn
- Setting an "open" password (encrypts the entire file)
- Setting a "modify" password (read-only access without the password)
- Protecting individual sheets with a password
- Locking specific cells while leaving others editable
- Removing passwords from a workbook

## Password Protect a Workbook

### Method 1 — Save As Dialog
File -> Save As -> More Options -> Tools (dropdown) -> General Options
- Password to open: required to open the file at all
- Password to modify: required to edit (otherwise read-only)

### Method 2 — Info Panel (Recommended)
File -> Info -> Protect Workbook -> Encrypt with Password
Enter password -> confirm -> Save

## Protect a Specific Sheet
1. Right-click the sheet tab -> **Protect Sheet**
2. Set a password (optional but recommended)
3. Choose what users CAN do: select cells, format columns, insert rows, etc.
4. Click OK

## Protect Workbook Structure
Review -> **Protect Workbook**
Prevents: adding, deleting, renaming, moving, hiding, or unhiding sheets
Different from sheet-level cell protection.

## Lock Specific Cells Only (Most Common Use Case)
1. **Ctrl+A** to select all cells -> Format Cells -> Protection tab -> uncheck **Locked**
2. Select only the cells you want to lock -> Format Cells -> check **Locked**
3. Now protect the sheet (Review -> Protect Sheet)
Result: only the cells you explicitly locked are protected; all others remain editable

## Remove a Password
File -> Info -> Protect Workbook -> Encrypt with Password -> clear the password field -> OK

## Critical Notes
- Passwords are **case-sensitive** — "Excel" and "excel" are different passwords
- There is **no built-in recovery** for forgotten passwords — do not lose yours
- Modern Excel uses **AES-256 encryption** for workbook passwords
- Sheet protection is a courtesy lock — not designed to stop determined attackers

## Resources
- Watch: https://www.youtube.com/watch?v=fgr8GoeywnQ
- Playlist: https://www.youtube.com/playlist?list=PL6Omre3duO-N7yY1Uxl7hOC3gRMMomamK


---

# Part 4 — Excel File Security and Passwords (Premium Lesson)

## Learning Objectives
By the end of this lesson you will be able to:
- Apply AES-256 encryption to protect workbook files with an open password
- Set modify passwords for read-only access control
- Protect individual sheets with granular permission settings
- Lock and unlock specific cells while keeping others editable
- Protect workbook structure (prevent sheet manipulation)
- Understand and apply Information Rights Management (IRM)
- Protect VBA code from viewing or editing
- Apply digital signatures to workbooks
- Mark a workbook as Final
- Remove hidden personal metadata from workbooks using Document Inspector
- Share workbooks safely by removing sensitive information
- Understand the limitations of each security layer

## What is Excel File Security?
Think of Excel security like protecting your house. A workbook password is the front door lock — nobody gets in without the key. Sheet protection is a lock on an individual room inside the house — even if guests are allowed in, they can't access the locked room. Cell locking is like putting a glass display case over valuable items inside a room — people can see them but can't touch them. And digital signatures are like a wax seal on an envelope — proof that the document hasn't been tampered with since you signed it.

## Why Do We Need Excel Security?
- Financial models contain sensitive salary, revenue, or client data
- Healthcare spreadsheets contain patient data — legally required to be protected
- HR files contain personal employee information
- Templates distributed to staff must prevent accidental formula deletion
- Auditors and clients should review data without being able to modify formulas
- Regulatory compliance (GDPR, HIPAA, SOX) requires demonstrable data protection
- VBA macros embedded in files represent business logic worth protecting

## Real World Problem — Healthcare Sector
A hospital finance department uses an Excel workbook to calculate ward budgets. The workbook contains formulas linking all wards to a master dashboard. Without protection, a well-meaning nurse manager on a ward tab accidentally deletes a pivot formula while trying to add a row. The entire dashboard breaks. By using sheet protection with only "Select unlocked cells" and "Insert rows" allowed on ward tabs, while locking all formula cells, the hospital protects the model integrity while allowing normal data entry.

## Simple Analogy
An Excel workbook is like a bank. The building has security guards at the entrance (open password/encryption). Inside, individual vaults (protected sheets) need separate codes. Items inside vaults can be in display cases (locked cells) — visible but untouchable. The bank manager has an override key (VBA password and workbook structure password). The bank's official documents have a notary seal (digital signature). And before handing over financial statements, the bank shreds internal memos (Document Inspector removes metadata).

## Internal Working — AES-256 Encryption
When you set an "open" password on an Excel file, Excel does the following:
1. Derives a 256-bit encryption key from your password using PBKDF2-SHA512 with a random salt and 100,000 iterations (as of Office 2016+)
2. Encrypts the entire file contents using AES-256-CBC cipher
3. Stores the encrypted data in the Compound Document File Format (OLE2 container)
4. The salt, IV (initialization vector), and key derivation parameters are stored unencrypted in the file header so the correct key can be reconstructed during decryption
5. Without the correct password, the 256-bit key space makes brute-force practically impossible for strong passwords

Sheet protection and cell locking are NOT encryption — they are UI-level restrictions implemented in the XML. A determined user with technical knowledge can bypass sheet protection by editing the .xlsx XML directly. Only workbook-level encryption (open password) provides true security.

## Visual Explanation

```
EXCEL SECURITY LAYERS
=====================

Layer 1 — File Encryption (Open Password)
  [Encrypted .xlsx file] ←→ AES-256
  Nobody can open without password
  
Layer 2 — Modify Password
  File opens in READ-ONLY mode without password
  Viewer can see everything but cannot save changes
  
Layer 3 — Workbook Structure Protection
  Tabs cannot be: added, deleted, renamed, moved, hidden, unhidden
  
Layer 4 — Sheet Protection
  Specific operations blocked per sheet:
  ✓ = allowed  ✗ = blocked
  [Cell Selection] [Formatting] [Insert/Delete Rows] [Sort] [Filter]
  
Layer 5 — Cell-Level Locking
  Individual cells: Locked = protected | Unlocked = editable
  Only active when sheet protection is ON

Layer 6 — VBA Project Password
  Code viewer locked — cannot view or edit macros
  
Layer 7 — Digital Signature
  Tamper-evident seal — any change invalidates signature
  
Layer 8 — IRM/Rights Management
  Cloud-based policy — controls who can open, print, forward, copy
  Expires access on a set date
```

## Step-by-Step — Complete Security Methods

### Method 1 — Encrypt with Open Password (Recommended)
1. Go to **File -> Info**
2. Click **Protect Workbook** (the padlock icon)
3. Select **Encrypt with Password**
4. Type a strong password (min. 12 chars, mixed case, numbers, symbols)
5. Click OK
6. Confirm by typing the password again
7. Click OK
8. **Save the file** — encryption only applies after saving (Ctrl+S)

Warning: If you forget this password, Microsoft provides no recovery. The file is permanently inaccessible.

### Method 2 — Open + Modify Password via Save As
1. **File -> Save As -> Browse**
2. In the Save As dialog, click the **Tools** dropdown button (bottom of dialog)
3. Select **General Options**
4. Enter **Password to open**: (full encryption)
5. Enter **Password to modify**: (opens read-only without this password)
6. Optionally check **Read-only recommended** (prompts user to open read-only even without password)
7. Click OK -> confirm both passwords -> Save

### Method 3 — Protect a Sheet
1. Right-click the sheet tab -> **Protect Sheet**
   OR: Review tab -> **Protect Sheet**
2. Enter an optional password (if blank, anyone can unprotect)
3. In the checklist, select what users ARE ALLOWED to do:
   - Select locked cells (default: allowed)
   - Select unlocked cells (default: allowed)
   - Format cells
   - Format columns
   - Format rows
   - Insert columns
   - Insert rows
   - Insert hyperlinks
   - Delete columns
   - Delete rows
   - Sort
   - Use AutoFilter
   - Use PivotTable reports
   - Edit objects (shapes, charts)
   - Edit scenarios
4. Click OK

### Method 4 — Lock Specific Cells Only (Most Professional Use Case)

The critical concept: ALL cells are "Locked" by default, but cell locking only has effect when sheet protection is active. Therefore the workflow is:

**Step A — Unlock everything first**:
1. Press Ctrl+A to select all cells
2. Press Ctrl+1 (Format Cells dialog) -> Protection tab
3. Uncheck **Locked** -> OK

**Step B — Lock only the cells you want protected**:
1. Select the cells containing formulas or important data
2. Ctrl+1 -> Protection tab -> check **Locked** -> OK

**Step C — Optionally hide formula content**:
1. With the formula cells still selected
2. Ctrl+1 -> Protection tab -> check **Hidden** (hides formula from formula bar even when cell is selected)
3. Click OK

**Step D — Enable sheet protection**:
1. Review -> Protect Sheet -> enter password -> OK
Result: Only the explicitly locked cells are protected. All other cells remain freely editable.

### Method 5 — Protect Workbook Structure
1. **Review -> Protect Workbook**
2. Enter an optional password
3. Check **Structure** (prevents sheet tab manipulation)
4. Check **Windows** (available in older Excel — prevents resizing the workbook window)
5. Click OK

Now nobody can: insert sheets, delete sheets, rename sheets, move or copy sheets, hide or unhide sheets.

### Method 6 — Protect VBA Code
1. Press **Alt+F11** to open the VBA Editor
2. In the Project Explorer, right-click your project
3. Select **VBAProject Properties**
4. Click the **Protection** tab
5. Check **Lock project for viewing**
6. Enter and confirm a password
7. Click OK
8. Close the VBA Editor and save the file

Now: opening the VBA editor on this file requires the password. The code cannot be viewed or edited without it.

### Method 7 — Digital Signature
1. **File -> Info -> Protect Workbook -> Add a Digital Signature**
2. Select or obtain a digital certificate (from a Certificate Authority like DigiCert, or a self-signed cert for internal use)
3. Add a commitment type: "Created and approved this document" or "Approved this document"
4. Optionally add signing purpose text
5. Click Sign
A digital signature appears in the workbook. If anyone modifies the file after signing, the signature is invalidated and Excel shows a warning. Used for: audit trails, regulatory compliance, contract approval.

### Method 8 — Mark as Final
1. **File -> Info -> Protect Workbook -> Mark as Final**
2. Confirm the message
3. Save
The workbook opens in read-only mode with a banner saying "This workbook has been marked as final." The editing ribbon is hidden. Users can click "Edit Anyway" to override — this is a courtesy indicator, NOT a security control. Use it to communicate "this is the approved version, please don't edit" rather than as actual protection.

### Method 9 — Document Inspector (Remove Metadata)
Before sharing externally:
1. **File -> Info -> Check for Issues -> Inspect Document**
2. Select what to inspect:
   - Comments and Annotations
   - Document Properties and Personal Information (author name, company, edit history)
   - Data Model (embedded Power Pivot model)
   - Headers and Footers
   - Hidden Rows and Columns
   - Hidden Worksheets
   - Invisible Content
   - Custom XML Data
   - Links to External Data
3. Click **Inspect**
4. Review findings and click **Remove All** for each category you want to clean
Warning: Removing items cannot be undone. Save a backup before inspecting.

### Method 10 — Information Rights Management (IRM)
IRM requires Microsoft Azure Active Directory or an on-premises Rights Management Server:
1. **File -> Info -> Protect Workbook -> Restrict Access -> Connect to Rights Management Servers**
2. After connecting: **Restrict Access -> Restricted Access**
3. Configure permissions per user:
   - Read: can open and read only
   - Change: can read, edit, save (but not print or copy)
   - Full Control: all permissions
4. Set expiry date (file becomes inaccessible after this date even with the correct password)
5. Allow printing: checkbox
6. Allow users to copy content: checkbox
IRM policies are enforced by the server even when the file is offline (periodic online check required). Used in banking, legal, government, and pharmaceutical industries.

## Keyboard Shortcuts for Security Operations

| Action | Windows | Mac |
|---|---|---|
| Open Format Cells dialog | Ctrl+1 | Cmd+1 |
| Open Protect Sheet | No shortcut | No shortcut |
| Open VBA Editor | Alt+F11 | Opt+F11 |
| Save As dialog | F12 | Cmd+Shift+S |
| Open Info panel | Alt+F, I | No direct |
| Run Document Inspector | Alt+F, I, then navigate | N/A |
| Confirm cell lock settings | Ctrl+1, Protection tab | Cmd+1, Protection |

## Hidden Productivity Tricks

1. **Allow Edit Ranges** (Review tab): Define specific ranges that different users or groups can edit without the sheet protection password — each range has its own password. Useful for multi-team workbooks where different departments own different sections.

2. **Protect Multiple Sheets at Once**: Hold Ctrl, click multiple sheet tabs (they become "grouped"), then protect — all selected sheets are protected simultaneously.

3. **Named Ranges + Cell Locking**: Define named ranges for your input cells before locking. Users can find and navigate to input areas by name even when most of the sheet is locked.

4. **Selective Hidden Formulas**: Use the Hidden attribute (Format Cells -> Protection -> Hidden) only on proprietary calculation cells. Your general SUM formulas don't need hiding — only your competitive advantage formulas.

5. **Password Manager Integration**: Store Excel passwords in your company password manager (1Password, Bitwarden, LastPass) rather than in emails or notes. Create a separate entry per workbook.

## Common Mistakes and Troubleshooting

### Mistake 1 — Protecting the sheet before unlocking cells
If you protect the sheet without first unlocking input cells, ALL cells become locked and nobody can enter data. Always unlock input cells first (Step A above), then protect.

### Mistake 2 — Using a simple/guessable password
"1234", "password", "excel", company name, your name — all are guessable. Use a passphrase like "BlueSky#Tables2026!" — long, memorable, strong.

### Mistake 3 — Not saving after password change
Setting a password without saving leaves the file unprotected. Always Ctrl+S immediately after setting a password.

### Mistake 4 — Confusing sheet protection with encryption
Sheet protection is XML-level and can be bypassed by experts. Workbook encryption (open password) is the only true security. Use BOTH for sensitive files: encryption keeps unauthorised users out; sheet protection prevents accidental formula damage by authorised users.

### Mistake 5 — Forgetting which cells are locked
Before protecting, use Go To Special (F5 -> Special -> select "Cell with criteria" or use the formula bar trick) to identify locked cells. Or use Conditional Formatting with a formula: `=CELL("protect",A1)=1` to visually highlight locked cells.

### Troubleshooting Guide

| Problem | Cause | Solution |
|---|---|---|
| Can't edit any cells after protection | All cells were Locked before protecting | Unprotect, Ctrl+A, uncheck Locked, re-lock only formula cells, protect again |
| Password not accepted | Caps Lock was on when entering | Check Caps Lock, try again; passwords are case-sensitive |
| File opens read-only | Modify password set on file | Open with modify password, or open read-only and save a copy |
| Forgot open password | No recovery mechanism exists | Use a third-party tool (Passper for Excel, etc.) as last resort — success not guaranteed |
| Digital signature invalid | File was edited after signing | Re-sign the document; the original signer must re-validate |
| IRM error "Contact your administrator" | IRM server unreachable | Check network connection; IRM requires periodic server validation |
| VBA code visible despite password | Password set but file saved before closing VBA editor | Close VBA editor completely, save .xlsm file, reopen to verify lock |

## Version Differences Table

| Feature | Excel 2019 | Excel 2021 | Excel 365 | Excel Web |
|---|---|---|---|---|
| AES-256 encryption | Yes | Yes | Yes | No (handled by OneDrive) |
| Open password | Yes | Yes | Yes | No |
| Modify password | Yes | Yes | Yes | No |
| Sheet protection | Yes | Yes | Yes | Partial |
| Cell locking | Yes | Yes | Yes | Partial |
| Workbook structure protection | Yes | Yes | Yes | No |
| VBA project password | Yes | Yes | Yes | No (no VBA in Web) |
| Digital signature | Yes | Yes | Yes | No |
| Mark as Final | Yes | Yes | Yes | No |
| Document Inspector | Yes | Yes | Yes | No |
| IRM / Sensitivity Labels | Enterprise | Enterprise | Yes (M365) | Yes (M365) |
| Allow Edit Ranges | Yes | Yes | Yes | No |
| Sensitivity Labels (MIP) | Partial | Partial | Yes | Yes |

## AI & Copilot (2026)
- Copilot can assist with security: "Which cells in this sheet contain formulas that should be locked?" — Copilot identifies formula cells and recommends a protection plan
- Copilot cannot apply passwords or protection programmatically (security boundary)
- Microsoft Purview Information Protection (formerly MIP/AIP) integrates with Excel 365 to apply automatic sensitivity labels based on content detection — e.g., automatically labelling a file "Confidential" when it detects NHS numbers, credit card numbers, or salary data
- In 2026, Copilot can help you audit a workbook: "Show me all unprotected formula cells" and highlight them for review
- Future: AI-suggested protection policies based on the type of data detected in the workbook

## Security Best Practices (2026)
1. Use AES-256 encryption (open password) for any file leaving your organisation
2. Separate passwords for separate files — never reuse
3. Store all file passwords in a corporate password manager
4. Use Sensitivity Labels (Microsoft Purview) for automatic data classification
5. Run Document Inspector before every external share
6. Use IRM for highly sensitive files that should expire
7. Never rely on sheet protection alone for sensitive data — it is not encryption
8. VBA password protects your intellectual property but not the data — add encryption too
9. For compliance (GDPR, HIPAA), document your protection practices
10. Test your passwords from a different machine before distributing a file

## Interview Questions

### Beginner
**Q: What is the difference between a workbook open password and a sheet protection password?**
A: An open password encrypts the entire file with AES-256. Nobody can open the file without it. A sheet protection password is a UI restriction within an already-opened file that prevents editing specific sheet elements. Sheet protection does not encrypt anything.

**Q: How do you lock specific cells so users can only enter data in input fields?**
A: Step 1 — Select all cells (Ctrl+A) and uncheck Locked in Format Cells -> Protection. Step 2 — Select only the formula/protected cells and check Locked. Step 3 — Apply sheet protection (Review -> Protect Sheet). Now only the locked cells are protected; all others are editable.

### Intermediate
**Q: A colleague forgot the protection password for a sheet. What are the options?**
A: Legitimate options: Ask the original author. Check if the file was saved before the password was set (check AutoRecover). For a workbook open password, there is effectively no built-in recovery — third-party tools exist but success is not guaranteed. For sheet protection only (which is not real encryption), the XML can be manually edited by renaming .xlsx to .zip, editing the worksheet XML to remove the sheetProtection element, and re-zipping — but this is only ethical if you own the file.

**Q: What does the Document Inspector remove?**
A: Comments and annotations, document properties (author name, company, last modified by, edit time), hidden rows/columns/sheets, invisible objects, headers and footers with personal info, custom XML data, and embedded data model content. It removes metadata that could reveal internal information to external recipients.

### Advanced
**Q: Why is sheet protection NOT a security control?**
A: Sheet protection is implemented as an XML attribute in the worksheet file (sheetProtection element in sheet1.xml). Any user who renames the .xlsx file to .zip, navigates to the xl/worksheets/ folder, opens the relevant XML file, and removes the sheetProtection element will bypass the protection completely. It requires no password cracking — just XML editing. True security requires AES-256 file encryption via the open password.

**Q: How does IRM differ from a workbook open password for protecting sensitive data?**
A: An open password protects the file itself — anyone with the password has full access. IRM (Information Rights Management) grants granular per-user permissions enforced by a server. IRM can restrict printing, copying, and forwarding independently. IRM permissions can expire. IRM is revocable — even after the file is distributed, you can revoke access from the server. Open passwords cannot be revoked once shared.

### Senior
**Q: How would you implement a compliant data protection strategy for a GDPR-sensitive HR Excel workbook distributed to 50 department heads?**
A: 1) Apply AES-256 open password encryption. 2) Lock all formula and employee ID cells. 3) Protect the worksheet with password to prevent formula overwriting. 4) Apply Microsoft Purview Sensitivity Label "Confidential - HR Only" which enforces IRM policies: read/change only, no forwarding, no print. 5) Run Document Inspector to strip author metadata. 6) Store the open password in Azure Key Vault with access restricted to authorised personnel. 7) Document the protection approach for GDPR Article 32 compliance records. 8) Set the IRM expiry to 90 days requiring re-authorisation.

## Practice Exercises

### Easy
1. Create a new workbook, set an open password of "Excel@2026", save, close, and reopen to verify
2. Set a modify password on a file, then open it as read-only without the modify password
3. Add sheet protection to Sheet1 with no password — verify you cannot type in any cell

### Medium
1. Create a budget template: unlock input cells (yellow background), lock all formula cells (no fill), protect the sheet — send to a colleague and verify they can enter data but not edit formulas
2. Use Document Inspector on an existing workbook — document exactly what personal information was found and removed
3. Apply "Mark as Final" to a workbook — verify the editing interface changes, then click "Edit Anyway" and verify you can edit again

### Hard
1. Create a VBA macro that unprotects a sheet, runs data validation, and re-protects it with the password passed as a parameter — protect the VBA code itself
2. Build a multi-user workbook: three regions each with an "Allow Edit Range" for their data entry section, each with a different range password — the formulas sheet is fully locked
3. Research Sensitivity Labels in your Microsoft 365 tenant — apply one to a test file and verify the protection behaviour when opening on another account

## Quiz (10 Questions)

**1. What encryption standard does modern Excel use for workbook passwords?**
a) MD5  b) SHA-256  c) AES-256  d) DES
Answer: c) AES-256

**2. Cell locking in Format Cells -> Protection only takes effect when:**
a) The workbook has an open password  b) Sheet protection is enabled  c) The file is saved  d) Mark as Final is applied
Answer: b) Sheet protection is enabled

**3. What does "Protect Workbook Structure" prevent?**
a) Editing cell content  b) Adding/deleting/renaming sheets  c) Changing cell formats  d) Opening the file without a password
Answer: b) Adding/deleting/renaming sheets

**4. Which tool removes author name and edit history from a workbook?**
a) Inspect Document  b) Protect Workbook  c) Mark as Final  d) Digital Signature
Answer: a) Inspect Document (Document Inspector)

**5. What is the "Hidden" attribute in Format Cells -> Protection?**
a) Hides the row  b) Hides the formula in the formula bar when cell is selected (only when sheet is protected)  c) Hides the cell from printing  d) Hides the cell from charts
Answer: b) Hides the formula in the formula bar when cell is selected (only when sheet is protected)

**6. What happens if you forget a workbook open password in modern Excel?**
a) Microsoft can recover it via your account  b) There is no built-in recovery  c) You can reset it by reinstalling Excel  d) The password is stored in the Windows Registry
Answer: b) There is no built-in recovery

**7. IRM (Information Rights Management) requires:**
a) Only the file password  b) A Rights Management Server or Azure AD  c) A third-party plugin  d) Windows Server only
Answer: b) A Rights Management Server or Azure AD

**8. The "Allow Edit Ranges" feature is found in which tab?**
a) Home  b) Data  c) Review  d) Formulas
Answer: c) Review

**9. Sheet protection in .xlsx files can be bypassed by:**
a) Running a special Excel command  b) Editing the XML inside the renamed .zip file  c) Using Ctrl+Alt+Delete  d) Reinstalling Office
Answer: b) Editing the XML inside the renamed .zip file

**10. A Digital Signature becomes invalid when:**
a) The file is opened on a different computer  b) The certificate expires  c) The file is modified after signing  d) Both b and c
Answer: d) Both b and c

## Cheat Sheet

```
EXCEL SECURITY QUICK REFERENCE
================================
Open Password    → File -> Info -> Protect Workbook -> Encrypt with Password (AES-256)
Modify Password  → Save As -> Tools -> General Options -> Password to modify
Sheet Protection → Review -> Protect Sheet OR right-click tab
Cell Locking     → Ctrl+A -> Ctrl+1 -> uncheck Locked -> select formulas -> check Locked -> protect sheet
Workbook Struct  → Review -> Protect Workbook
VBA Password     → Alt+F11 -> right-click project -> VBAProject Properties -> Protection tab
Digital Sig      → File -> Info -> Protect Workbook -> Add a Digital Signature
Document Inspect → File -> Info -> Check for Issues -> Inspect Document
Mark as Final    → File -> Info -> Protect Workbook -> Mark as Final
Remove Password  → File -> Info -> Protect Workbook -> Encrypt with Password -> delete password -> OK -> Save
```

## Memory Tricks
- **Open password = Front door lock** (AES-256 encryption)
- **Modify password = Visitor policy** (read-only without it)
- **Sheet protection = Room lock** (inside the already-opened house)
- **Cell locking = Display case** (visible but don't touch)
- **VBA password = Secret recipe protection** (code, not data)
- **Document Inspector = Spring cleaning before company visits**
- **Digital Signature = Wax seal** (proves untampered)
- **IRM = Rented access** (expires, can be revoked)

## Summary
Excel security operates in layers. True confidentiality requires AES-256 file encryption via the open password — everything else is a UI restriction. Sheet protection and cell locking are essential for template integrity and preventing accidental formula damage, but they are not confidentiality controls. Use Document Inspector before every external share to remove hidden personal metadata. For enterprise data classification, integrate Microsoft Purview Sensitivity Labels. Understanding each layer's purpose and limitations allows you to choose the right level of protection for each situation.

## Related Topics
- Part 2: Excel Interface (accessing security options from the ribbon)
- Part 3: Custom Tab (add protection commands to your analyst tab)
- VBA Module (Part later): Automating protection/unprotection via macros

## Frequently Asked Questions

**Q: Can I protect some sheets with one password and others with a different password?**
A: Yes. Each sheet's protection is set independently. Navigate to each sheet, right-click -> Protect Sheet, and set different passwords per sheet.

**Q: If I email a password-protected file, is it safe?**
A: The file itself is encrypted (if you used an open password with AES-256). However, if you send the password in the same email, an attacker who intercepts both can open the file. Send the password via a separate channel (SMS, phone call, or secure messaging).

**Q: Can someone see my formulas if I've applied sheet protection but no file encryption?**
A: The formula bar will hide formulas if you checked the "Hidden" attribute AND the sheet is protected. But anyone can bypass sheet protection by editing the XML inside the .xlsx file. For truly hidden proprietary formulas, use VBA (which can be password-protected) or export results-only via Paste Special -> Values.

## Additional Knowledge

### The .xlsx Security Model
An .xlsx file is actually a ZIP archive. Rename any .xlsx file to .zip and you can extract it. Inside are XML files defining every aspect of the workbook — including sheet protection settings. This is why sheet protection is a courtesy lock only. However, if the file has an open password (AES-256 encryption), the entire ZIP is encrypted and cannot be extracted without the password. The encrypted container wrapping defeats the XML-editing bypass.

### Password Complexity Recommendations (2026)
NIST SP 800-63B (2017, still current) recommends:
- Minimum 8 characters (12+ recommended for sensitive data)
- Allow all printable characters and spaces
- Check against known breach databases (HaveIBeenPwned)
- No mandatory complexity requirements (letters+numbers+symbols) — length is more important than complexity
- No mandatory rotation unless compromise is suspected
For Excel files: use a passphrase of 4+ random words: "correct-horse-battery-staple" is both memorable and cryptographically stronger than "P@ssw0rd1!"
