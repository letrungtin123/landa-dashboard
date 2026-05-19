# Kong Gateway Routing Configuration cho Landa Dashboard

Tài liệu này mô tả cấu hình các định tuyến (routes) bắt buộc trên Kong Gateway dành cho hệ thống Landa Dashboard (chạy trên public domain `https://elearning.l-a.vn/admin/`).

Hệ thống được chia làm 3 nhóm upstream chính:
1. **Frontend Dashboard** (Node.js/Vite)
2. **Open edX LMS** (Backend xử lý học viên, khóa học)
3. **Open edX CMS / Studio** (Backend xử lý biên soạn nội dung)

---

## 1. Nhóm Route Frontend Dashboard
- **Upstream Target:** `http://192.168.0.226:5174` (IP chạy PM2 của frontend-shell)
- **Tính chất:** Trả về file HTML tĩnh (React SPA) và các chunk JS/CSS. Không được strip path do React Router đang mount tại basename `/admin`.

| Nguồn vào (Public Path) | Strip Path | Forward Tới (Upstream URL) | Mô tả |
| :--- | :---: | :--- | :--- |
| `/admin` | **KHÔNG** | `http://192.168.0.226:5174/admin` | Route chính cho dashboard |

---

## 2. Nhóm Route LMS (Backend Chính)
- **Upstream Target:** `http://192.168.0.226` (IP nội bộ của Open edX LMS)
- **Tính chất:** Forward nguyên bản, không sửa đổi đường dẫn. LMS sẽ tự nhận diện và xử lý.

| Nguồn vào (Public Path) | Strip Path | Forward Tới (Upstream URL) | Mô tả |
| :--- | :---: | :--- | :--- |
| `/oauth2` | **KHÔNG** | `http://192.168.0.226/oauth2` | Cấp token, xác thực người dùng |
| `/api` | **KHÔNG** | `http://192.168.0.226/api` | Các REST API chính của Open edX |
| `/login_ajax` | **KHÔNG** | `http://192.168.0.226/login_ajax` | Luồng đăng nhập bằng Cookie / Fallback |
| `/logout` | **KHÔNG** | `http://192.168.0.226/logout` | Xóa session trên server |
| `/asset-v1:` | **KHÔNG** | `http://192.168.0.226/asset-v1:` | Tải file ảnh/video bên trong khóa học |
| `/c4x` | **KHÔNG** | `http://192.168.0.226/c4x` | Static content định dạng cũ (Legacy) |
| `/static` | **KHÔNG** | `http://192.168.0.226/static` | Assets tĩnh mặc định của edX |
| `/media` | **KHÔNG** | `http://192.168.0.226/media` | Hình đại diện, avatar, file tải lên |

---

## 3. Nhóm Route CMS / Studio (Authoring)
- **Upstream Target:** `http://studio.192.168.0.226.nip.io` (Hoặc IP/Port tương ứng của dịch vụ CMS, ví dụ: `http://192.168.0.226:18010`)
- **Tính chất:** Dùng Virtual Path (`/cms-api/`) để nhận diện request CMS từ frontend, nhưng **bắt buộc phải xóa (strip) đoạn path này đi** trước khi gửi xuống server đích, vì bản thân Studio không định nghĩa đường dẫn nào bắt đầu bằng `/cms-api/`.

| Nguồn vào (Public Path) | Strip Path | Forward Tới (Upstream URL) | Mô tả |
| :--- | :---: | :--- | :--- |
| `/cms-api` | **CÓ** (Bắt buộc) | `http://studio.192.168.0.226.nip.io/` | Giao tiếp với Contentstore để lấy cấu trúc bài giảng |

*Ví dụ cơ chế Strip Path:*
Khi client gọi `https://elearning.l-a.vn/cms-api/api/contentstore/v1/course_index/...`
➔ Kong sẽ chặn route `/cms-api`
➔ Kong loại bỏ `/cms-api` ra khỏi path
➔ Kong forward request mới thành: `http://studio.192.168.0.226.nip.io/api/contentstore/v1/course_index/...`
