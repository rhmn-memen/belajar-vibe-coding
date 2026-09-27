# Issue: Implementasi Fitur Login User & Session Management

## Ringkasan Tugas
Issue ini berisi panduan tahap demi tahap untuk mengimplementasikan fitur Login User. Fitur ini akan memvalidasi kredensial pengguna (email dan password), menghasilkan token menggunakan nilai UUID unik, lalu menyimpannya ke tabel baru (`sessions`) di database PostgreSQL via Drizzle ORM.

Instruksi di bawah dibuat secara berurutan agar dapat dengan mudah diikuti oleh programmer maupun agen AI secara sistematis.

---

## 1. Pembaruan Skema Database (Tabel Sessions)

Tambahkan definisi tabel `sessions` pada file skema Drizzle (`src/db/schema.ts`). Pastikan sudah ada tabel `users` yang dirujuk oleh tabel baru ini.

**Spesifikasi Tabel `sessions`:**
- `id`: integer, auto increment, primary key
- `token`: varchar 255, not null (akan menyimpan string UUID)
- `user_id`: integer, foreign key yang merujuk pada `users.id`
- `created_at`: timestamp, dengan nilai default `current_timestamp`

**Langkah Eksekusi Database:**
1. Definisikan `sessions = pgTable("sessions", { ... })` di `src/db/schema.ts` menggunakan API dari `drizzle-orm/pg-core` (tambahkan tipe seperti `integer("user_id").references(() => users.id)`).
2. Generate file migrasi SQL menggunakan Drizzle Kit (misal: `bun run db:generate`).
3. Terapkan/push skema migrasi ke PostgreSQL lokal Anda (misal: `bun run db:push`).

---

## 2. Struktur Folder & Penamaan File

Untuk menjaga arsitektur aplikasi (modular):
- **Routes:** File berakhiran `-route.ts` di direktori `src/routes/` (misal: `users-route.ts`).
- **Services:** File berakhiran `-service.ts` di direktori `src/services/` (misal: `users-service.ts`).

---

## 3. Implementasi Layer Service (`src/services/users-service.ts`)

Buka atau edit file `src/services/users-service.ts`. File ini bertugas mengeksekusi logika verifikasi dan menyimpan data sesi.

**Langkah Eksekusi Service:**
1. Buat fungsi baru yang di-export (misal: `loginUserService`).
2. Proses dalam fungsi tersebut:
   - **Pencarian User:** Lakukan *query select* ke tabel `users` berdasarkan kolom `email`. 
   - Jika pengguna tidak ditemukan, hentikan eksekusi (*throw error* "Email atau password salah").
   - **Verifikasi Password:** Bandingkan input `password` teks dengan data kolom `password` (hash dari database) menggunakan fungsi bawaan Bun (misal: `await Bun.password.verify(...)`) atau library *bcrypt* terkait.
   - Jika hasil verifikasi *false*, hentikan eksekusi (*throw error* "Email atau password salah"). Jangan pisahkan pesan error agar keamanan tetap baik.
   - **Pembuatan Token (Session):** Gunakan `crypto.randomUUID()` bawaan Bun/Node untuk membuat string token acak.
   - **Penyimpanan Sesi:** Masukkan/`insert` record baru ke dalam tabel `sessions` (kolom `token` dan `user_id`).
   - Kembalikan nilai string token yang baru saja dibuat tersebut.

---

## 4. Implementasi Layer Route (`src/routes/users-route.ts`)

Edit atau buka file `src/routes/users-route.ts` untuk mendaftarkan endpoint API Login.

**Spesifikasi Endpoint:**
- **Metode & URL**: `POST /api/users/login`
- **Request Body (JSON):**
  ```json
  {
      "email" : "rahman@localhost",
      "password" : "rahasia"
  }
  ```
- **Response Body - Success (JSON):**
  ```json
  {
      "data" : "token_uuid"
  }
  ```
- **Response Body - Error (JSON):**
  ```json
  {
      "error" : "Email atau password salah"
  }
  ```

**Langkah Eksekusi Route:**
1. Pada *instance* Elysia route users (`usersRoute`), tambahkan endpoint `.post('/login', handler)`.
2. Validasi input body (hanya butuh `email` dan `password` berbentuk string).
3. Panggil service login (`loginUserService`).
4. Eksekusi menggunakan blok `try-catch`.
   - Pada blok `catch`, berikan HTTP status 400 atau 401 dan format error sesuai spesifikasi di atas.
   - Jika login pada service sukses mengembalikan *token*, letakkan di dalam properti `"data"` dan sukseskan respons HTTP.

---

## Kriteria Penyelesaian Akhir
- Dapat di-hit via HTTP Request (cURL/Postman) ke `POST /api/users/login`.
- Jika email/password salah, respons API konsisten menolak secara persis menampilkan pesan: `{"error": "Email atau password salah"}`.
- Jika login sukses, token UUID akan tersimpan di dalam tabel `sessions` dan terelasi pada id pengguna.
- Token UUID direturn utuh pada atribut `data` untuk *response body* sukes.
- Logika terpisah rapi dengan lapisan *routes* dan *services*.

---

## 5. Implementasi Unit Testing & Verifikasi

Untuk memastikan endpoint login berjalan dengan stabil dan reliabel, tambahkan kode pengetesan otomatis (*testing*) pada file pengetesan, contoh: `src/routes/users-route.test.ts`.

**Skenario Test yang Wajib Dibuat (Unit/Integration Test):**
1. Buat skenario/grup test baru `describe("POST /api/users/login", () => { ... })`.
2. **Test Case 1 (Login Sukses):**
   - Lakukan *mocking* pada layanan/fungsi `loginUserService` agar mengembalikan sebuah string UUID dummy (misal: `"mock-token-uuid"`).
   - Lakukan simulasi pemanggilan request ke endpoint `POST /api/users/login` dengan membawa kredensial.
   - Lakukan asersi (*assert*) untuk memastikan respons statusnya `200` (OK) dan *response body* persis bernilai `{"data": "mock-token-uuid"}`.
3. **Test Case 2 (Kredensial Salah):**
   - Lakukan *mocking* pada layanan `loginUserService` sehingga melempar *error* dengan pesan `"Email atau password salah"`.
   - Lakukan simulasi pemanggilan request login.
   - Lakukan asersi untuk memastikan respons memiliki status code `400` (Bad Request) atau `401` (Unauthorized) dan isi *response body* berupa `{"error": "Email atau password salah"}`.

**Langkah Eksekusi & Verifikasi Akhir:**
1. Jalankan perintah `bun test` di terminal Anda.
2. Pastikan terminal mereturn persentase hijau/success, yang menyatakan seluruh skenario pengetesan login berhasil dilalui (Passed).
