# TestPilot AI

## Business Flow — MVP

**Version:** 1.0 Draft
**Status:** Approved Baseline for Development

---

# 1. Business Overview

TestPilot AI membantu QA Engineer mengubah PRD menjadi structured test cases secara lebih cepat.

Tanpa TestPilot:

```text
PRD
 ↓
QA baca requirement
 ↓
QA breakdown module/feature
 ↓
QA mencari testing scenario
 ↓
QA membuat Positive Case
 ↓
QA membuat Negative Case
 ↓
QA membuat Edge Case
 ↓
QA merapikan spreadsheet
```

Dengan TestPilot:

```text
PRD
 ↓
AI Requirement Analysis
 ↓
QA Review
 ↓
AI Test Case Generation
 ↓
QA Final Review
 ↓
TSV Export
```

TestPilot bertindak sebagai **QA Copilot**, bukan pengganti QA Engineer.

---

# 2. Main Actor

| Actor            | Responsibility                                                                              |
| ---------------- | ------------------------------------------------------------------------------------------- |
| QA Engineer      | Upload PRD, review requirement, menentukan testing scope, review testcase, finalisasi hasil |
| TestPilot AI     | Menganalisis PRD dan menghasilkan testing scenario                                          |
| TestPilot System | File processing, preview, editing, data handling, dan TSV export                            |

---

# 3. Main Business Flow

```text
START
  │
  ▼
QA memiliki PRD
  │
  ▼
Upload PRD
  │
  ▼
Validate File
  │
  ├──── Invalid ────→ Show Error
  │                       │
  │                       └──→ Upload Again
  │
  ▼
Extract PRD Content
  │
  ▼
AI Analyze PRD
  │
  ▼
Detect:
- Module
- Feature
- Requirement
- Business Rule
- Validation
- Unclear Requirement
  │
  ▼
QA Review Analysis
  │
  ▼
Select Module / Feature
  │
  ▼
Select Testing Scope
  │
  ├── Frontend
  ├── Backend
  └── Frontend + Backend
  │
  ▼
AI Generate Test Cases
  │
  ├── Positive
  ├── Negative
  └── Edge
  │
  ▼
Preview Test Case Table
  │
  ▼
QA Review
  │
  ├──── Needs Correction
  │          │
  │          ├── Edit
  │          └── Delete
  │
  ▼
Final Test Cases
  │
  ▼
Select Export Columns
  │
  ▼
Export TSV
  │
  ▼
Use in Excel / Google Sheets
  │
  ▼
END
```

---

# 4. Detailed Process

| Step | Actor  | Action                | Result                                                 |
| ---: | ------ | --------------------- | ------------------------------------------------------ |
|    1 | QA     | Menyiapkan PRD        | PRD menjadi input                                      |
|    2 | QA     | Upload PRD            | File diterima TestPilot                                |
|    3 | System | Validate file         | File dipastikan dapat diproses                         |
|    4 | System | Extract content       | Requirement menjadi readable content                   |
|    5 | AI     | Analyze PRD           | Module, feature, rule, dan requirement teridentifikasi |
|    6 | QA     | Review analysis       | QA memastikan AI memahami PRD                          |
|    7 | QA     | Select module/feature | Menentukan area generation                             |
|    8 | QA     | Select FE/BE/Both     | Menentukan testing scope                               |
|    9 | AI     | Generate testcase     | Positive, Negative, Edge dibuat                        |
|   10 | System | Show preview          | Testcase ditampilkan dalam tabel                       |
|   11 | QA     | Review testcase       | QA menilai kualitas output                             |
|   12 | QA     | Edit/Delete           | Hasil yang tidak sesuai diperbaiki                     |
|   13 | QA     | Select export columns | Menentukan struktur output                             |
|   14 | System | Generate TSV          | Hasil dikonversi tanpa AI                              |
|   15 | QA     | Use result            | TSV siap digunakan                                     |

---

# 5. Business Rules

## BR-01 — PRD Is The Source of Truth

Generated testcase harus memiliki dasar dari PRD.

AI tidak boleh menambahkan undocumented business rule sebagai fakta.

---

## BR-02 — QA Has Final Control

AI result selalu melewati QA review.

```text
AI Result
   ↓
QA Review
   ↓
Final Result
```

---

## BR-03 — Reasonable QA Inference Is Allowed

Requirement:

```text
Password minimum 8 characters.
```

Allowed:

```text
Password 7 characters
Password exactly 8 characters
Password more than 8 characters
```

Not allowed:

```text
Password maximum 50 characters
```

jika tidak ada di PRD.

---

## BR-04 — Unclear Requirements Must Not Be Invented

Requirement:

```text
File dapat diupload dengan ukuran yang sesuai.
```

Jika maximum size tidak tersedia, AI tidak boleh menentukan angka sendiri.

Status:

```text
Need Confirmation
```

---

## BR-05 — FE and BE Must Be Separated

Jika user memilih Both:

```text
Frontend Test Cases
+
Backend Test Cases
```

Preview menggunakan tab terpisah.

Export menghasilkan TSV terpisah.

---

## BR-06 — Backend Must Not Invent API Contract

Jika PRD tidak menyediakan informasi API, AI tidak boleh mengarang:

- Endpoint.
- HTTP Method.
- Request Body.
- Response Schema.
- HTTP Status.
- Header.

---

## BR-07 — Output Language Follows PRD

Supported:

```text
Bahasa Indonesia
English
Mixed Indonesian + English
```

Default:

```text
Same as PRD
```

---

# 6. Example Business Scenario

PRD:

```text
Feature: Login

User dapat login menggunakan email dan password.

Email wajib diisi dan menggunakan format valid.

Password minimal 8 karakter.

Credential salah menampilkan error.

Credential benar membawa user ke Dashboard.
```

AI Analysis:

```text
Authentication
└── Login
    ├── Email
    │   ├── Required
    │   └── Valid format
    │
    ├── Password
    │   └── Minimum 8 characters
    │
    └── Credential
        ├── Valid
        └── Invalid
```

QA memilih:

```text
Module:
Authentication

Feature:
Login

Scope:
Frontend
```

Generated cases:

```text
TP-FE-001
Login valid
Positive

TP-FE-002
Email kosong
Negative

TP-FE-003
Email format invalid
Negative

TP-FE-004
Password kurang dari 8 karakter
Negative

TP-FE-005
Password tepat 8 karakter
Edge

TP-FE-006
Credential salah
Negative
```

QA kemudian:

```text
Review
 ↓
Edit / Delete
 ↓
Export TSV
```

---

# 7. Before TestPilot

```text
PRD
 ↓
QA membaca seluruh requirement
 ↓
QA breakdown module/feature
 ↓
QA mencari scenario
 ↓
QA menulis testcase
 ↓
QA merapikan format
 ↓
Spreadsheet
```

---

# 8. After TestPilot

```text
PRD
 ↓
TestPilot Analyze
 ↓
QA Review
 ↓
TestPilot Generate
 ↓
QA Final Review
 ↓
Export TSV
```

---

# 9. Business Value

| Problem                | TestPilot Solution      | Value                              |
| ---------------------- | ----------------------- | ---------------------------------- |
| PRD dibreakdown manual | AI Requirement Analysis | Mengurangi repetitive work         |
| Scenario bisa terlewat | Positive/Negative/Edge  | Membantu coverage                  |
| TC ditulis dari awal   | Structured generation   | Mempercepat drafting               |
| AI bisa hallucinate    | PRD source-of-truth     | Mengurangi undocumented assumption |
| AI belum tentu benar   | QA review               | Human control                      |
| Format berbeda-beda    | Select export columns   | Fleksibel                          |
| FE/BE beda konteks     | Separate generation     | Lebih relevan                      |
| Formatting manual      | TSV export              | Langsung usable                    |

---

# 10. User Journey

```text
QA Engineer
     ↓
Has PRD
     ↓
Upload to TestPilot
     ↓
Review AI Understanding
     ↓
Choose Module / Feature
     ↓
Choose FE / BE / Both
     ↓
Generate Test Cases
     ↓
Review & Correct
     ↓
Export TSV
     ↓
Use Test Cases
```

---

# 11. Business Value Proposition

TestPilot mengambil pekerjaan repetitif pada:

```text
Reading Assistance
Requirement Structuring
Initial Scenario Generation
Test Case Drafting
Export Formatting
```

QA tetap menangani:

```text
Validation
Judgement
Correction
Final Approval
```

Positioning:

> **AI Copilot for QA Test Case Creation**

---

# 12. Demo Flow

Untuk demo/juri:

```text
1. Tampilkan sample PRD
        ↓
2. Upload ke TestPilot
        ↓
3. Analyze PRD
        ↓
4. Tampilkan Module / Feature detection
        ↓
5. Pilih Feature
        ↓
6. Pilih Frontend / Backend / Both
        ↓
7. Generate Test Cases
        ↓
8. Tampilkan Positive / Negative / Edge
        ↓
9. Edit salah satu testcase
        ↓
10. Delete testcase yang tidak diperlukan
        ↓
11. Select export columns
        ↓
12. Export TSV
        ↓
13. Buka hasil di Excel / Google Sheets
```

---

# 13. Evaluation Points

Juri dapat menilai:

## Requirement Understanding

Apakah AI memahami PRD dengan benar?

## Test Case Relevance

Apakah testcase sesuai requirement?

## QA Reasoning

Apakah Positive, Negative, dan Edge masuk akal?

## Hallucination Control

Apakah AI menghindari undocumented business rule?

## FE / BE Accuracy

Apakah output sesuai scope?

## Human Control

Apakah QA mudah memperbaiki hasil AI?

## Usability

Apakah flow upload sampai export mudah dipahami?

## Practical Value

Apakah TestPilot mempercepat pembuatan testcase?

---

# 14. One-Line Business Flow

> **QA upload PRD → TestPilot memahami requirement → QA memilih scope → AI membuat testcase → QA melakukan review → hasil diexport menjadi TSV.**

---

# 15. Business Flow Boundary

Business flow MVP berhenti setelah testcase berhasil diexport menjadi TSV.

Tidak termasuk:

```text
Test Execution
Bug Reporting
Automation Execution
Jira
GitHub
Team Approval
Project Management
```

---

# 16. Product Message

> **TestPilot AI mempercepat proses dari PRD menjadi structured QA test cases tanpa mengambil kontrol keputusan dari QA Engineer.**
