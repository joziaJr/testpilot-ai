# TestPilot AI

## Product Requirement Document — MVP

**Version:** 1.0 Draft
**Status:** Approved Baseline for Development
**Product Type:** AI-Powered QA Test Case Generator

---

# 1. Product Overview

TestPilot AI adalah aplikasi berbasis AI yang membantu QA Engineer membuat test case berdasarkan Product Requirement Document (PRD).

User mengupload PRD, TestPilot menganalisis requirement yang tersedia, kemudian user memilih area yang ingin dibuatkan test case dalam scope:

- Frontend
- Backend
- Frontend + Backend

TestPilot kemudian menghasilkan Positive, Negative, dan Edge Test Case yang dapat direview, diedit, dihapus, dan diexport menjadi TSV.

PRD menjadi **source of truth utama** dalam proses generation.

---

# 2. Problem Statement

Dalam proses QA, pembuatan test case dari PRD biasanya membutuhkan beberapa pekerjaan manual:

1. Membaca PRD.
2. Memahami requirement.
3. Mengidentifikasi module dan feature.
4. Menentukan business rule dan validation.
5. Menentukan Positive Case.
6. Menentukan Negative Case.
7. Menentukan Edge Case.
8. Menulis test case satu per satu.
9. Merapikan hasil ke spreadsheet.

Risiko dari proses manual:

- Requirement terlewat.
- Test scenario kurang lengkap.
- Test case duplicate.
- QA salah memahami requirement.
- Dokumentasi tidak konsisten.

TestPilot AI membantu mempercepat proses tersebut tanpa menghilangkan review dan judgement dari QA Engineer.

---

# 3. Product Goal

MVP TestPilot harus mendukung flow:

```text
Upload PRD
    ↓
Extract PRD Content
    ↓
AI Analyze PRD
    ↓
Review Detected Requirements
    ↓
Select Module / Feature
    ↓
Select Frontend / Backend / Both
    ↓
Generate Test Cases
    ↓
Preview Test Cases
    ↓
Edit / Delete
    ↓
Select Export Columns
    ↓
Export TSV
```

MVP dianggap memiliki value ketika QA dapat menghasilkan draft test case yang usable dari PRD tanpa perlu menyusunnya dari nol.

---

# 4. Target User

## Primary User

- QA Engineer
- QA Tester
- Software Tester

## Secondary User

- Developer yang membutuhkan testing scenario.
- Product team yang ingin melihat kemungkinan test coverage.
- Tim kecil yang belum memiliki dedicated QA.

---

# 5. MVP Scope

## 5.1 PRD Input

Supported format:

- PDF
- DOCX
- TXT

System harus memvalidasi:

- File tersedia.
- File tidak kosong.
- Format didukung.
- File dapat dibaca.
- Text dapat diextract.
- File tidak melebihi maximum size.

Scanned PDF tanpa readable text belum menjadi scope MVP.

---

# 6. Language Support

TestPilot harus memahami:

- Bahasa Indonesia.
- English.
- Mixed Bahasa Indonesia + English.

Default output:

```text
Same as PRD
```

Behavior:

| PRD Language     | Output             |
| ---------------- | ------------------ |
| Bahasa Indonesia | Bahasa Indonesia   |
| English          | English            |
| Mixed            | Bahasa dominan PRD |

Structured value tetap konsisten:

```text
Priority:
High
Medium
Low

Type:
Positive
Negative
Edge
```

Header test case tidak diterjemahkan otomatis.

---

# 7. PRD Analysis

Setelah text berhasil diextract, AI menganalisis PRD sebelum membuat testcase.

AI harus mencoba mengidentifikasi informasi yang didukung PRD:

- Module.
- Feature.
- Requirement.
- Business Rule.
- Field.
- Validation.
- User Behavior.
- Navigation.
- Permission.
- Constraint.

Contoh:

```text
Authentication

├── Login
│   ├── Email required
│   ├── Email format validation
│   ├── Password required
│   └── Invalid credential behavior
│
└── Register
    ├── Email
    └── Password
```

---

# 8. Requirement Review

User dapat melihat module dan feature yang berhasil diidentifikasi.

```text
Detected Requirements

☑ Authentication
   ☑ Login
   ☑ Register
   ☐ Forgot Password

☑ Workspace
   ☑ Create Workspace
   ☐ Delete Workspace
```

User dapat memilih:

- Seluruh module.
- Module tertentu.
- Feature tertentu.

Test case hanya dibuat berdasarkan selection tersebut.

---

# 9. Testing Scope

User memilih:

```text
○ Frontend
○ Backend
○ Frontend + Backend
```

## 9.1 Frontend

Frontend testcase berfokus pada:

- Field behavior.
- Input validation.
- Button behavior.
- Navigation.
- Visibility.
- State.
- User interaction.
- User-facing error.
- UI behavior yang didukung PRD.

## 9.2 Backend

Backend testcase berfokus pada:

- Business logic.
- Server-side validation.
- Authentication.
- Authorization.
- Data handling.
- Request behavior.
- Response behavior.

Jika API contract tidak tersedia di PRD, TestPilot tidak boleh mengarang:

- Endpoint.
- HTTP Method.
- Request Body.
- Response Schema.
- Header.
- HTTP Status Code.
- Authentication mechanism.

---

# 10. Test Case Types

TestPilot menghasilkan:

## Positive

Memastikan feature bekerja pada kondisi valid.

## Negative

Memastikan system menangani kondisi/input invalid.

## Edge

Memastikan behavior pada boundary atau kondisi ekstrem yang masih logis berdasarkan requirement.

Contoh requirement:

```text
Password minimal 8 karakter.
```

Allowed:

```text
Positive:
Password lebih dari 8 karakter.

Negative:
Password 7 karakter.

Edge:
Password tepat 8 karakter.
```

Not allowed:

```text
Password maksimal 50 karakter.
```

jika maximum password tidak disebutkan.

---

# 11. AI Source of Truth Rules

PRD adalah source of truth.

AI boleh:

- Menghasilkan Positive Case.
- Menghasilkan Negative Case.
- Menghasilkan Edge Case.
- Menurunkan validation scenario yang logis.
- Menguji documented boundary.
- Menghubungkan requirement yang relevan dalam context yang sama.

AI tidak boleh:

- Mengarang business rule.
- Mengarang role.
- Mengarang permission.
- Mengarang field.
- Mengarang API contract.
- Mengarang limit.
- Mengarang HTTP status.
- Mengarang behavior produk.
- Menganggap undocumented functionality sebagai requirement.

---

# 12. Reasonable QA Inference

AI tetap diperbolehkan melakukan QA reasoning.

Requirement:

```text
Email wajib diisi.
```

Allowed:

```text
Positive:
Email diisi dengan data valid.

Negative:
Email kosong.

Edge:
Email hanya berisi whitespace.
```

Reasonable validation inference diperbolehkan.

Undocumented business rule tidak diperbolehkan.

---

# 13. Unclear Requirement

Jika requirement ambigu atau tidak lengkap, AI tidak boleh membuat nilai sendiri.

Contoh:

```text
User dapat upload file dengan ukuran yang sesuai.
```

Tidak boleh diasumsikan:

```text
Maximum file size = 10 MB
```

System harus memberikan indicator:

```text
Need Confirmation
```

Contoh:

```text
Requirement:
"User dapat upload file dengan ukuran yang sesuai."

Need Confirmation:
Maximum supported file size tidak dijelaskan pada PRD.
```

---

# 14. Test Case Quantity

User tidak menentukan jumlah testcase secara manual seperti:

```text
20 Test Cases
50 Test Cases
100 Test Cases
```

AI menentukan jumlah berdasarkan requirement coverage.

Rule:

> Generate sufficient test cases to cover the selected requirements without intentionally increasing test case quantity or creating redundant scenarios.

---

# 15. Test Case Schema

Default Test Case Schema:

| Column          |
| --------------- |
| Test Case ID    |
| Module          |
| Feature         |
| Title           |
| Preconditions   |
| Steps           |
| Expected Result |
| Priority        |
| Type            |
| Automation      |
| Notes           |

Test Data bukan default column pada Test Case MVP.

Frontend dan Backend menggunakan base schema yang sama.

---

# 16. Test Case ID

Frontend:

```text
TP-FE-001
TP-FE-002
TP-FE-003
```

Backend:

```text
TP-BE-001
TP-BE-002
TP-BE-003
```

Rules:

- Dibuat otomatis.
- Unique.
- Tidak berubah setelah dibuat.
- Delete tidak menyebabkan renumber.

Contoh:

```text
TP-FE-001
TP-FE-003
TP-FE-004
```

valid jika `TP-FE-002` dihapus.

---

# 17. AI Generation Output

AI harus mengembalikan structured data.

AI tidak bertanggung jawab menghasilkan TSV secara langsung.

Preferred internal representation:

```json
{
  "test_cases": [
    {
      "test_case_id": "TP-FE-001",
      "module": "Authentication",
      "feature": "Login",
      "title": "Login valid",
      "preconditions": "User sudah terdaftar",
      "steps": [
        "Buka halaman Login",
        "Input email valid",
        "Input password valid",
        "Klik Login"
      ],
      "expected_result": "Masuk Dashboard",
      "priority": "High",
      "type": "Positive",
      "automation": "Yes",
      "notes": "-"
    }
  ]
}
```

Application mengubah structured result tersebut menjadi preview table.

---

# 18. Test Case Preview

Generated test case tidak langsung diexport.

User harus melihat hasil terlebih dahulu.

Jika scope Frontend + Backend:

```text
[ Frontend 42 ] [ Backend 28 ]
```

FE dan BE menggunakan tab terpisah.

Preview schema:

| Test Case ID | Module | Feature | Title | Preconditions | Steps | Expected Result | Priority | Type | Automation | Notes |
| ------------ | ------ | ------- | ----- | ------------- | ----- | --------------- | -------- | ---- | ---------- | ----- |

---

# 19. Edit Test Case

User dapat melakukan manual editing terhadap:

- Module.
- Feature.
- Title.
- Preconditions.
- Steps.
- Expected Result.
- Priority.
- Type.
- Automation.
- Notes.

Manual editing tidak menggunakan AI.

---

# 20. Delete Test Case

Rules:

- Tidak menggunakan AI.
- Testcase hilang dari current preview.
- ID testcase lain tidak berubah.

---

# 21. Export

Output utama MVP:

```text
TSV — Tab-Separated Values
```

TSV dipilih karena:

- Mudah digunakan di Excel.
- Mudah digunakan di Google Sheets.
- Mudah dicopy/paste.
- Tidak membutuhkan spreadsheet processing kompleks.

---

# 22. Export Column Selection

Sebelum export, user memilih kolom yang ingin dimasukkan.

```text
☑ Test Case ID
☑ Module
☑ Feature
☑ Title
☑ Preconditions
☑ Steps
☑ Expected Result
☑ Priority
☑ Type
☐ Automation
☐ Notes
```

Kolom yang tidak dipilih tidak muncul pada TSV.

Selection tidak menghapus data asli dari preview.

---

# 23. FE + BE Export

Frontend:

```text
testpilot_frontend.tsv
```

Backend:

```text
testpilot_backend.tsv
```

Both:

```text
testpilot_frontend.tsv
testpilot_backend.tsv
```

FE dan BE tidak digabungkan dalam satu TSV.

---

# 24. AI Processing

MVP memiliki dua AI responsibility.

## PRD Analyzer

Input:

```text
Extracted PRD Content
```

Output:

- Module.
- Feature.
- Requirement.
- Business Rule.
- Validation.
- Need Confirmation.

## Test Case Generator

Input:

```text
Structured Requirements
+
Selected Module / Feature
+
Testing Scope
```

Output:

```text
Structured Test Cases
```

Flow:

```text
PRD
 ↓
Document Extraction
 ↓
AI PRD Analyzer
 ↓
Structured Requirements
 ↓
User Review & Selection
 ↓
AI Test Case Generator
 ↓
Structured Test Cases
 ↓
Preview
 ↓
TSV Export
```

Document extraction dan TSV export tidak menggunakan AI.

---

# 25. AI Provider

Development awal menggunakan provider/model yang memiliki free tier dan cukup baik dalam:

- Document understanding.
- Bahasa Indonesia.
- English.
- Structured output.
- Requirement reasoning.

Provider harus configurable sehingga dapat diganti tanpa mengubah application flow.

User tidak memilih provider dari UI pada MVP.

---

# 26. AI Usage Tracking

Setiap AI request mencatat usage metadata jika tersedia.

Minimum:

```text
Action
Model
Input Tokens
Output Tokens
Total Tokens
Timestamp
```

Action:

```text
prd_analysis
generate_frontend
generate_backend
```

Tujuan:

- Monitoring free-tier usage.
- Mengetahui penggunaan per generation.
- Optimasi prompt.
- Mengidentifikasi PRD dengan context besar.

Dedicated usage dashboard belum wajib.

---

# 27. Error Handling

## File

```text
Unsupported file format
File cannot be read
No readable text found
File exceeds maximum size
```

## AI

```text
Failed to analyze PRD
Failed to generate test cases
AI service unavailable
AI usage limit reached
```

## Export

```text
No test cases available
No export columns selected
Failed to export TSV
```

System tidak boleh crash jika proses gagal.

---

# 28. MVP Main Screens

MVP memiliki tiga main screen.

## Screen 1 — Upload PRD

```text
Upload your PRD

[ Drop PDF / DOCX / TXT ]

[ Analyze PRD ]
```

Responsibilities:

- Select/drop file.
- Validate file.
- Analyze PRD.

## Screen 2 — PRD Analysis

Responsibilities:

- Detected language.
- Module.
- Feature.
- Unclear requirement.
- Select module/feature.
- Select FE/BE/Both.
- Generate testcase.

## Screen 3 — Test Case Preview

Responsibilities:

- FE/BE tabs.
- Preview table.
- Edit.
- Delete.
- Export.

---

# 29. MVP Data Persistence

MVP belum membutuhkan account dan full project management.

Namun current generation data harus tersedia selama active session:

```text
Generation Session
├── PRD metadata
├── Extracted requirements
├── Detected language
├── Selected module/features
├── FE test cases
└── BE test cases
```

---

# 30. Versioning & Release Management

TestPilot AI menggunakan Semantic Versioning:

```text
MAJOR.MINOR.PATCH
```

Examples:

```text
0.1.0
0.1.1
0.2.0
1.0.0
```

## 30.1 Versioning Rules

| Change                          | Version Impact |
| ------------------------------- | -------------- |
| Bug fix                         | PATCH          |
| New backward-compatible feature | MINOR          |
| Breaking change                 | MAJOR          |

Examples:

```text
0.3.0

fix: handle invalid PDF
→ 0.3.1

feat: add Backend test case generation
→ 0.4.0

feat!: change test case schema
→ 1.0.0
```

Early development dapat menggunakan:

```text
0.x.x
```

Stable MVP release:

```text
1.0.0
```

---

## 30.2 Conventional Commits

Supported commit types:

```text
feat:
fix:
docs:
test:
refactor:
chore:
```

Examples:

```text
feat: add PRD upload
fix: handle invalid PDF
docs: update PRD
test: add parser tests
refactor: simplify AI service
chore: update dependencies
```

Breaking change:

```text
feat!: change generated test case schema
```

---

## 30.3 Husky Git Hooks

Husky digunakan sebagai development quality gate.

Checks dapat meliputi:

- Lint.
- Typecheck.
- Automated tests.
- Commit message validation.

Expected flow:

```text
Developer Change
      ↓
git commit
      ↓
Husky Validation
      ↓
Lint
Typecheck
Test
Commit Message Check
      ↓
Commit Accepted
```

---

## 30.4 Push and Release Flow

Version bump tidak dilakukan pada setiap local push.

Expected flow:

```text
Feature Branch
      ↓
Development
      ↓
Commit
      ↓
Husky Validation
      ↓
Push
      ↓
Pull Request
      ↓
Review / CI
      ↓
Merge to Main
      ↓
Automated Versioning
      ↓
Release Version
```

---

## 30.5 Automated Versioning

Expected mapping:

```text
fix
→ PATCH

feat
→ MINOR

breaking change
→ MAJOR
```

Possible tooling:

- Release Please.
- GitHub Actions.
- Equivalent release automation.

Final tooling ditentukan pada technical architecture.

---

## 30.6 Version Usage

Version digunakan untuk:

- Application identification.
- QA testing.
- Bug reporting.
- Regression testing.
- Retesting.
- Release tracking.
- Deployment identification.

Example:

```text
Environment: Staging
Version: 0.5.1
```

Bug lifecycle:

```text
Bug Found:
0.5.1

Bug Fixed:
0.5.2

Retested:
0.5.2
```

---

# 31. Out of Scope — MVP

Tidak termasuk:

- Login.
- Register.
- User account.
- Team management.
- Collaboration.
- Project management.
- Full generation history.
- Test Execution module.
- Bug Report module.
- Jira integration.
- GitHub integration.
- Playwright generation.
- XLSX export.
- OCR.
- Image-only PRD.
- PRD version comparison.
- Requirement change detection.
- Existing testcase import.
- Coverage dashboard.
- Autonomous multi-agent workflow.
- Multi-provider selection from UI.
- Regenerate individual testcase.

---

# 32. Post-MVP Candidates

## MVP 1.1

- Regenerate individual testcase.
- Search/filter testcase.
- PRD reference per testcase.
- Better duplicate detection.
- Save export preference.
- AI usage dashboard.

## MVP 1.2

- Project.
- Save PRD.
- Generation history.
- Multiple PRD.

## V2

- PRD version comparison.
- Changed requirement detection.
- Generate affected testcase only.
- Import existing testcase.
- Coverage analysis.
- XLSX.
- Jira integration.
- Playwright generation.
- Team collaboration.

---

# 33. Non-Functional Requirements

## Reliability

- Invalid AI response tidak boleh menyebabkan app crash.
- Structured output harus divalidasi.
- Failed generation memiliki retry path.

## Security

- AI API key server-side only.
- Secret tidak dikirim ke client.
- Uploaded PRD tidak menjadi public URL secara default.

## Performance

- UI tidak freeze selama parsing/generation.
- Proses AI memiliki loading state.
- Preview tetap usable untuk data besar.

## Maintainability

- AI provider terpisah dari business logic.
- Document parser terpisah dari AI.
- TSV exporter tidak bergantung pada AI.
- Schema dapat dikembangkan tanpa major rewrite.
- Versioning dan release flow konsisten.
- Git hooks dan CI menjadi quality gate.

---

# 34. Definition of Done

MVP dianggap selesai jika:

1. User dapat upload PRD.
2. PDF dapat diproses.
3. DOCX dapat diproses.
4. TXT dapat diproses.
5. Invalid file ditolak.
6. Indonesian PRD dipahami.
7. English PRD dipahami.
8. Mixed PRD dipahami.
9. Module dideteksi.
10. Feature dideteksi.
11. Requirement dianalisis.
12. User dapat review analysis.
13. User dapat memilih module/feature.
14. Frontend dapat dipilih.
15. Backend dapat dipilih.
16. Both dapat dipilih.
17. Positive testcase dapat dibuat.
18. Negative testcase dapat dibuat.
19. Edge testcase dapat dibuat.
20. Ambiguous requirement ditandai.
21. Undocumented business rule tidak diperlakukan sebagai fakta.
22. FE dan BE dipisahkan.
23. Test Case ID otomatis.
24. Testcase tampil di preview.
25. User dapat edit testcase.
26. User dapat delete testcase.
27. User dapat memilih export columns.
28. Frontend dapat diexport TSV.
29. Backend dapat diexport TSV.
30. Both menghasilkan output terpisah.
31. AI usage tercatat.
32. File/AI/export error ditangani.
33. Semantic Versioning diterapkan.
34. Conventional Commits diterapkan.
35. Husky quality gate berjalan.
36. Version dapat digunakan untuk QA/release tracking.
37. Version bump mengikuti release flow setelah merge ke main.

---

# 35. Product Principle

TestPilot AI tidak menggantikan QA Engineer.

AI membantu:

- Requirement breakdown.
- Initial scenario identification.
- Test case drafting.

QA tetap menangani:

- Requirement validation.
- Relevance judgement.
- Correction.
- Final approval.

> **AI may reason like a QA Engineer, but it must not invent product requirements.**

---

# 36. Value Proposition

> **Upload your PRD. Review the requirements. Generate Frontend and Backend test cases. Export directly to TSV.**
